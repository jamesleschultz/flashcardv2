"use server"; // Essential directive for Server Actions

import prisma from '@/lib/prisma'; // Your singleton Prisma client
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
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

    } catch (error: any) {
        console.error("Create Deck Action Error:", error);
        let errorMessage = 'Database Error: Failed to create deck.';
        if (error?.code === 'P2002') { // Prisma unique constraint violation code
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