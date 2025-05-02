"use server"; // Essential directive for Server Actions

import prisma from '@/lib/prisma'; // Your singleton Prisma client
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';

import OpenAI from 'openai';


// --- Helper Function to Get Authenticated User ID ---
async function getCurrentUserId(): Promise<string | null> {
    try {
        const session = await getServerSession(authOptions);
        return session?.user?.id ?? null;
    } catch (error) {
        console.error("Error getting server session in action:", error);
        return null;
    }
}

export type AiActionResponse = {
    status: 'success' | 'error' | 'idle';
    message: string | null;
    errors?: {
        inputText?: string[];
        deckId?: string[]; // Re-add deckId errors
    } | null;
    // Remove parsedCards from final state type unless needed for UI feedback
    // parsedCards?: { question: string; answer: string }[] | null;
    // Add count of created cards on success
    createdCount?: number | null;
};

// --- Schemas for Input Validation ---
const FlashcardCreateSchema = z.object({
  question: z.string().min(2, "Question too short").max(200, "Question too long"),
  answer: z.string().min(2, "Answer too short").max(500, "Answer too long"),
  deckId: z.string().cuid("Invalid Deck ID"),
});

const FlashcardUpdateSchema = z.object({
  question: z.string().min(2, "Question too short").max(200, "Question too long"),
  answer: z.string().min(2, "Answer too short").max(500, "Answer too long"),
  flashcardId: z.string().cuid("Invalid Flashcard ID"),
});

const GenerateInputSchema = z.object({
    inputText: z.string().min(50, "Need >= 50 chars.").max(25000, "Text too long."),
    deckId: z.string().cuid("Invalid Deck ID selected"), // Ensure it's a valid ID format
});

// --- Action Return Type ---
type ActionResponse = Promise<{
    status: 'success' | 'error';
    message: string;
    errors?: Record<string, string[] | undefined> | null; // For Zod errors
}>;

export type DeckFormState = {
    status: 'success' | 'error' | 'idle'; // Use 'idle' for initial state
    message: string | null;
    errors?: { // Structure matching Zod's flattened errors
        name?: string[];
        description?: string[];
    } | null;
    // Optionally include timestamp or other fields if needed
};

// --- Zod Schema for Deck Creation ---
const DeckCreateSchema = z.object({
  // Use 'name' here to match the Zod schema fields with potential error keys
  name: z.string().min(2, "Name must be >= 2 chars.").max(50, "Name must be <= 50 chars."),
  description: z.string().min(2, "Min 2 chars.").max(200, "Max 200 chars.").optional().or(z.literal("")).nullable(),
});

  export async function createDeckAction(
    previousState: DeckFormState, // First argument is previous state
    formData: FormData          // Second argument is form data
): Promise<DeckFormState> {     // Return type must match FormState
    console.log("createDeckAction called. Prev State:", previousState);

    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
        return { status: 'error', message: 'Unauthorized: Not logged in.', errors: null };
    }

    // Extract using form names ('deckname', 'description')
    const validatedFields = DeckCreateSchema.safeParse({
        name: formData.get('deckname'),
        description: formData.get('description') || null,
    });

    if (!validatedFields.success) {
        console.log("Validation errors:", validatedFields.error.flatten().fieldErrors);
        // Return state matching FormState, including Zod errors
        return {
            status: 'error',
            message: 'Invalid input.',
            errors: validatedFields.error.flatten().fieldErrors
        };
    }

    // Use validated data (name, description)
    const { name, description } = validatedFields.data;

    try {
        console.log(`Action: Creating deck '${name}' for user ${currentUserId}`);
        await prisma.deck.create({
            data: {
                name: name, // Use validated name
                description: description, // Use validated description
                userId: currentUserId,
            },
        });

        revalidatePath('/dashboard');
        // Return success state matching FormState
        return { status: 'success', message: 'Deck created successfully!', errors: null };

    } catch (error) {
        console.error("Create Deck Action Error:", error);
        let errorMessage = 'Database Error: Failed to create deck.';
        if (error) { // Prisma unique constraint violation code
             errorMessage = 'A deck with this name might already exist.';
        }
        // Return error state matching FormState
        return { status: 'error', message: errorMessage, errors: null };
    }
}

// --- CREATE Flashcard Action ---
export async function createFlashcardAction(formData: FormData): ActionResponse {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
        return { status: 'error', message: 'Unauthorized: Not logged in.' };
    }

    const validatedFields = FlashcardCreateSchema.safeParse({
        question: formData.get('question'),
        answer: formData.get('answer'),
        deckId: formData.get('deckId'),
    });

    if (!validatedFields.success) {
        return { status: 'error', message: 'Invalid input.', errors: validatedFields.error.flatten().fieldErrors };
    }

    const { question, answer, deckId } = validatedFields.data;

    // Verify deck ownership before adding card
    const deck = await prisma.deck.findFirst({ where: { id: deckId, userId: currentUserId }});
    if (!deck) {
        return { status: 'error', message: 'Deck not found or access denied.' };
    }

    try {
        await prisma.flashcard.create({
            data: { question, answer, deckId, userId: currentUserId },
        });
        revalidatePath(`/deck/${deckId}`);
        return { status: 'success', message: 'Flashcard created!' };
    } catch (error) {
        console.error("Create Flashcard Action Error:", error);
        return { status: 'error', message: 'Database Error: Failed to create flashcard.' };
    }
}

// --- UPDATE Flashcard Action ---
export async function updateFlashcardAction(formData: FormData): ActionResponse {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
        return { status: 'error', message: 'Unauthorized: Not logged in.' };
    }

    const validatedFields = FlashcardUpdateSchema.safeParse({
       question: formData.get('question'),
       answer: formData.get('answer'),
       flashcardId: formData.get('flashcardId'),
    });

    if (!validatedFields.success) {
       return { status: 'error', message: 'Invalid input.', errors: validatedFields.error.flatten().fieldErrors };
    }

    const { question, answer, flashcardId } = validatedFields.data;

    // Verify flashcard ownership
    const flashcard = await prisma.flashcard.findFirst({
       where: { id: flashcardId, userId: currentUserId }
    });
    if (!flashcard) {
       return { status: 'error', message: 'Flashcard not found or access denied.' };
    }

    try {
       await prisma.flashcard.update({
         where: { id: flashcardId },
         data: { question, answer },
       });
       revalidatePath(`/deck/${flashcard.deckId}`);
       return { status: 'success', message: 'Flashcard updated!' };
    } catch (error) {
       console.error("Update Flashcard Action Error:", error);
       return { status: 'error', message: 'Database Error: Failed to update flashcard.' };
    }
}

// --- DELETE Flashcard Action ---
export async function deleteFlashcardAction(flashcardId: string): ActionResponse {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return { status: 'error', message: 'Unauthorized.' };
    }
    if (!flashcardId || typeof flashcardId !== 'string' || flashcardId.length < 1) {
        return { status: 'error', message: 'Invalid Flashcard ID provided.' };
    }

    // Verify flashcard ownership
    const flashcard = await prisma.flashcard.findFirst({
        where: { id: flashcardId, userId: currentUserId }
    });
    if (!flashcard) {
      // Return success even if not found or not owned? Or error? Error is safer.
      return { status: 'error', message: 'Flashcard not found or access denied.' };
    }

    try {
      await prisma.flashcard.delete({ where: { id: flashcardId } });
      revalidatePath(`/deck/${flashcard.deckId}`);
      return { status: 'success', message: 'Flashcard deleted.' };
    } catch (error) {
      console.error("Delete Flashcard Action Error:", error);
      // Handle specific Prisma errors if needed (e.g., P2025 Record not found)
      return { status: 'error', message: 'Database Error: Failed to delete flashcard.' };
    }
}

// --- DELETE Deck Action ---
export async function deleteDeckAction(deckId: string): ActionResponse {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
        return { status: 'error', message: 'Unauthorized.' };
    }
     if (!deckId || typeof deckId !== 'string' || deckId.length < 1) {
        return { status: 'error', message: 'Invalid Deck ID provided.' };
    }

    // Verify Deck Ownership
    const deck = await prisma.deck.findFirst({
        where: { id: deckId, userId: currentUserId }
    });
    if (!deck) {
         return { status: 'error', message: 'Deck not found or access denied.' };
    }

    try {
        // Prisma's cascade delete (defined in schema) handles associated flashcards
        await prisma.deck.delete({ where: { id: deckId } });
        revalidatePath('/dashboard'); // Revalidate dashboard where decks are listed
        return { status: 'success', message: 'Deck deleted.' };
    } catch (error) {
        console.error("Delete Deck Action Error:", error);
        return { status: 'error', message: 'Database Error: Failed to delete deck.' };
    }
}


type SimpleDeck = { id: string; name: string; };

// Action to fetch decks for the current user
export async function fetchUserDecksAction(): Promise<{ status: 'success' | 'error', decks?: SimpleDeck[], message?: string }> {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
        return { status: 'error', message: 'Unauthorized.' };
    }

    try {
        const decks = await prisma.deck.findMany({
            where: { userId: currentUserId },
            orderBy: { name: 'asc' }, // Order alphabetically for dropdown
            select: { id: true, name: true } // Only fetch ID and name
        });
        return { status: 'success', decks: decks };
    } catch (error) {
        console.error("Fetch User Decks Action Error:", error);
        return { status: 'error', message: 'Database error fetching decks.' };
    }
}


console.log("--- DEBUG: USING HARDCODED API KEY ---");
const openai = new OpenAI({ 
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY as string, 
});

// --- Structured Prompt Function ---
// (Moved inside actions.ts as it's specific to this action's logic)
const structuredPrompt = (text: string) => `
You are an assistant generating flashcards (question/answer pairs) from text.
Create flashcards with a clear question and a concise answer based ONLY on the provided text.
Output ONLY a valid JSON array of objects, where each object has ONLY a "question" (string) key and an "answer" (string) key.
Ensure questions and answers are distinct and meaningful for learning.
Example: [{"question": "Example Q1?", "answer": "Example A1."}, {"question": "Example Q2?", "answer": "Example A2."}]

Generate flashcards from the following text:
---
${text}
---
`;

// --- Function to Call OpenAI API ---
// This focuses *only* on getting the raw response
async function getOpenAICompletion(text: string): Promise<string | null> {
     if (!openai) { // Check if client initialized successfully
        console.error("OpenAI client not available in getOpenAICompletion.");
        throw new Error("OpenAI client is not configured on the server.");
     }
    console.log("Sending request to OpenAI...");
    try {
        const completion = await openai.chat.completions.create({
            messages: [
                // Using a simpler system message might be okay if prompt is detailed
                {"role": "system", "content": "You are an assistant that generates flashcards in JSON format."},
                {"role": "user", "content": structuredPrompt(text)} // Pass the structured user prompt
            ],
            model: 'gpt-3.5-turbo', // Use the latest model available
        });
        const content = completion.choices[0]?.message?.content;
        console.log("OpenAI Raw Response:", content);
        return content ?? null; // Return content or null
    } catch (error) {
        console.error("Error fetching response from OpenAI:", error);
        // Re-throw specific error type if possible or a generic one
        throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// --- Function to Parse the OpenAI Response ---
// This focuses *only* on parsing the expected JSON structure
type ParsedCard = { question: string; answer: string };
function parseFlashcards(response: string | null): ParsedCard[] {
    if (!response) {
        console.log("Parsing skipped: No response string provided.");
        return [];
    }
    console.log("Attempting to parse AI response...");

    // --- Refined Cleaning Logic ---
    let jsonString = response.trim();

    // Repeatedly remove ```json or ``` from the start and ``` from the end
    // This handles potential variations like ```json\n[...]``` or ```\n[...]```
    const fenceStartJson = "```json";
    const fenceStart = "```";
    const fenceEnd = "```";

    // Remove potential leading fences and optional newline
    if (jsonString.startsWith(fenceStartJson)) {
        jsonString = jsonString.substring(fenceStartJson.length).trim();
    } else if (jsonString.startsWith(fenceStart)) {
        jsonString = jsonString.substring(fenceStart.length).trim();
    }

    // Remove potential trailing fence
    if (jsonString.endsWith(fenceEnd)) {
        jsonString = jsonString.substring(0, jsonString.length - fenceEnd.length).trim();
    }

    // Sometimes the JSON itself might be missing or incomplete after removing fences
    if (!jsonString || (!jsonString.startsWith('[') && !jsonString.startsWith('{'))) {
         console.error("Cleaned string doesn't appear to be valid JSON after removing fences:", jsonString.substring(0,100)+"...");
         throw new Error("Could not extract valid JSON content from the AI response after cleaning.");
    }
    // --- End Refined Cleaning Logic ---

    console.log("Attempting JSON.parse on cleaned string:", jsonString.substring(0,100) + "...");
    try {
        const parsed = JSON.parse(jsonString); // Parse the *cleaned* string

        // Validate structure
         if (!Array.isArray(parsed) || !parsed.every(item => typeof item === 'object' && item !== null && 'question' in item && 'answer' in item && typeof item.question === 'string' && typeof item.answer === 'string')) {
            console.error("Parsed data is not a valid array of {question, answer} objects:", parsed);
            throw new Error("AI response structure is not the expected JSON array format after parsing.");
        }

        // Filter empty/invalid cards
        const validCards = parsed.filter(card => card.question?.trim().length > 1 && card.answer?.trim().length > 1);
        console.log(`Parsed ${validCards.length} valid flashcards.`);
        return validCards;

    } catch (error) {
        console.error("Failed to parse cleaned AI JSON response:", error);
        // Include snippet of the *cleaned* string in the error
        const cleanedSnippet = jsonString.substring(0, 200);
        throw new Error(`Failed to parse AI response as JSON. Content after cleaning started with: ${cleanedSnippet}... Parse Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
}

// --- Main Server Action (Orchestrator) ---
// This action calls the helper functions
export async function generateFlashcardsFromTextAction(
    previousState: AiActionResponse,
    formData: FormData
): Promise<AiActionResponse> {

    console.log("generateFlashcardsFromTextAction called.");
    // Use correct initial state shape matching AiActionResponse
    const initialState: AiActionResponse = { status: 'idle', message: null, errors: null, createdCount: null };

    // 1. Authentication
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
        return { ...initialState, status: 'error', message: 'Unauthorized.' };
    }

    // 2. Validation (Includes deckId again)
    const validatedFields = GenerateInputSchema.safeParse({
        inputText: formData.get('inputText'),
        deckId: formData.get('deckId'), // Validate deckId from form
    });

    if (!validatedFields.success) {
        console.error("AI Action Validation Errors:", validatedFields.error.flatten().fieldErrors);
        return { ...initialState, status: 'error', message: 'Invalid input.', errors: validatedFields.error.flatten().fieldErrors };
    }
    // Destructure both fields
    const { inputText, deckId } = validatedFields.data;
    console.log(`AI Action: User ${currentUserId} authenticated. Validated input for deck ${deckId}.`);


    // 3. Verify Deck Ownership
    try {
        const deck = await prisma.deck.findFirst({ where: { id: deckId, userId: currentUserId }});
        if (!deck) {
            return { ...initialState, status: 'error', message: 'Target deck not found or access denied.' };
        }
        console.log(`AI Action: Deck ${deckId} ownership verified.`);
    } catch (dbError) {
         console.error("AI Action: Database error checking deck ownership:", dbError);
         return { ...initialState, status: 'error', message: 'Database error verifying deck.' };
    }


    // 4. Call OpenAI and Parse (wrapped in try/catch)
    try {
        // Step 4a: Get completion
        const aiResponseContent = await getOpenAICompletion(inputText);
        if (aiResponseContent === null) throw new Error("Received null content from OpenAI.");

        // Step 4b: Parse completion
        const generatedCards = parseFlashcards(aiResponseContent);
        if (generatedCards.length === 0) {
             return { ...initialState, status: 'success', message: 'AI processed the text, but no flashcards could be generated.' };
        }
        console.log(`AI Action: Parsed ${generatedCards.length} cards.`);

        // --- Step 5: Save Generated Flashcards to Database ---
        console.log(`AI Action: Attempting to save ${generatedCards.length} cards to deck ${deckId}...`);
        const flashcardsToCreate = generatedCards.map(card => ({
            question: card.question,
            answer: card.answer,
            deckId: deckId,          // Assign to the correct deck
            userId: currentUserId,   // Assign ownership
            // Set default SRS values explicitly if needed, though schema defaults might suffice
            // easinessFactor: 2.5,
            // interval: 0,
            // repetitions: 0,
            // nextReviewDate: new Date(),
        }));

        const result = await prisma.flashcard.createMany({
             data: flashcardsToCreate,
             skipDuplicates: true, // Avoid errors if AI generates identical cards
        });
        console.log(`AI Action: Saved ${result.count} flashcards to the database.`);
        // --- End Database Saving ---

        // Step 6: Revalidate path and return success
        revalidatePath(`/deck/${deckId}`); // Revalidate the specific deck page
        return {
            status: 'success',
            message: `Successfully generated and saved ${result.count} flashcards!`,
            createdCount: result.count, // Return count
            errors: null
        };

    } catch (error: unknown) { // Catch errors from OpenAI call, parsing, or DB save
        console.error("Error in AI generation/parsing/saving flow:", error);
        const message = error instanceof Error ? error.message : "Unknown error during AI processing or saving.";
        return { ...initialState, status: 'error', message: `Error: ${message}` };
    }
}