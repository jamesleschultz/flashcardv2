// src/app/(protected)/deck/[id]/study/page.tsx
// SERVER COMPONENT

import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions'; // Adjust path if needed
import StudySessionClient from '@/components/StudySessionClient'; // Adjust path if needed

// Types
interface Flashcard { id: string; question: string; answer: string; deckId: string; userId: string; }
interface Deck { id: string; name: string; userId: string; }

// --- Type for the RESOLVED params ---
interface StudyPageParams {
    id: string; // Represents the DECK ID for this study page
}

// --- Data Fetching Helper ---
async function getStudyData(deckId: string, userId: string): Promise<{ deck: Deck | null, flashcards: Flashcard[] }> {
    console.log(`Fetching study data for deck ${deckId}, user ${userId}`);
    try {
        const deck = await prisma.deck.findUnique({ where: { id: deckId, userId: userId }, select: { id: true, name: true, userId: true } });
        if (!deck) { return { deck: null, flashcards: [] }; }
        const flashcards = await prisma.flashcard.findMany({ where: { deckId: deckId }, orderBy: { createdAt: 'asc' }, select: { id: true, question: true, answer: true, deckId: true, userId: true } });
        return { deck, flashcards };
    } catch (error) {
        console.error(`Error fetching study data for deck ${deckId}:`, error);
        throw new Error("Failed to load study data.");
    }
}

// --- The Study Page Server Component ---
// Apply the "await params" pattern: Type the incoming prop as a Promise
export default async function StudyPage({ params: paramsPromise }: { params: Promise<StudyPageParams> }) { // Type as Promise

    // --- AWAIT PARAMS and Destructure ID ---
    let id: string; // This 'id' will be the DECK ID from the route
    try {
        console.log("[StudyPage] Awaiting params promise...");
        const resolvedParams = await paramsPromise; // Await the incoming prop
        id = resolvedParams.id; // Extract the id

        // Validate the extracted id
        if (!id || typeof id !== 'string') {
            throw new Error("Invalid 'id' retrieved from resolved study page params.");
        }
        console.log("[StudyPage] Params awaited, extracted deck id:", id);
    } catch (error) {
        console.error("[StudyPage] Error awaiting or validating params promise:", error);
        notFound(); // If await fails or validation fails
    }
    // --- Use the extracted 'id' variable (which is the deckId) from here on ---


    // 1. Authenticate User
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        const callbackUrl = encodeURIComponent(`/deck/${id}/study`); // Use extracted id
        console.log("[StudyPage] User not authenticated. Redirecting...");
        redirect(`/login?callbackUrl=${callbackUrl}`);
    }
    const userId = session.user.id;
    console.log(`[StudyPage] User authenticated: ${userId}`);

    // 2. Decode ID (already validated it's a string)
    // Note: Often IDs like CUIDs don't need decoding, but keeping it for consistency if your other page does.
    // If your IDs are guaranteed not to have URL-encoded chars, you can potentially remove decodeURIComponent.
    let decodedDeckId: string;
    try {
        decodedDeckId = decodeURIComponent(id); // Use extracted id
        if (!decodedDeckId) throw new Error("Decoded ID is empty.");
        console.log(`[StudyPage] Decoded Deck ID: ${decodedDeckId}`);
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error(`[StudyPage] Error decoding deck ID (${id}): ${errorMsg}`);
        notFound();
    }

    // 3. Fetch Deck and Cards for Studying using the decoded ID
    console.log(`[StudyPage] Calling getStudyData...`);
    const { deck, flashcards } = await getStudyData(decodedDeckId, userId);
    console.log(`[StudyPage] getStudyData returned: deck=${deck ? deck.id : 'null'}, flashcards=${flashcards.length}`);

    // 4. Handle Not Found / Not Authorized
    if (!deck) {
        console.log(`[StudyPage] Deck ${decodedDeckId} not found for user ${userId}. Rendering notFound().`);
        notFound();
    }

    // --- Render Page, passing data to Client Component ---
    console.log(`[StudyPage] Rendering content for deck: ${deck.name}`);
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Studying: {deck.name}</h1>
                    <p className="text-md text-muted-foreground mt-1">
                         {/* Display count based on fetched flashcards */}
                         {flashcards.length > 0 ? `Card 1 of ${flashcards.length}` : 'No cards in this deck'}
                    </p>
                </div>
                {/* Link back using the fetched deck.id */}
                <Button asChild variant="outline" size="sm">
                    <Link href={`/deck/${deck.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Deck Details
                    </Link>
                </Button>
            </div>

            {/* Render the Client Component for the Study Session */}
            <div className="mt-6">
                {flashcards.length > 0 ? (
                    <StudySessionClient
                        initialFlashcards={flashcards}
                        deckId={deck.id} // Pass the fetched deck id
                    />
                ) : (
                    <p className="text-center text-muted-foreground py-8">
                        This deck has no flashcards to study yet!
                         <Link href={`/deck/${deck.id}`} className="ml-2 text-primary hover:underline">Add some cards</Link>.
                    </p>
                )}
            </div>
        </div>
    );
}