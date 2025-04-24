// src/app/(protected)/deck/[id]/page.tsx
// SERVER COMPONENT

import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions'; // Adjust path if needed

import FlashcardListClient from './FlashcardListClient'; // Ensure correct path
import DeckActionButtons from './DeckActionButtons';   // Ensure correct path

// Types for data remain useful
interface Flashcard { id: string; question: string; answer: string; deckId: string; userId: string; }
interface Deck { id: string; name: string; userId: string; }

// --- Data Fetching Helper (No change needed here) ---
async function getDeckAndCards(deckId: string, userId: string): Promise<{ deck: Deck | null, flashcards: Flashcard[] }> {
    // ... (implementation remains the same)
    try {
        const deck = await prisma.deck.findUnique({ where: { id: deckId, userId: userId }, select: { id: true, name: true, userId: true } });
        if (!deck) return { deck: null, flashcards: [] };
        const flashcards = await prisma.flashcard.findMany({ where: { deckId: deckId }, orderBy: { createdAt: 'asc' }, select: { id: true, question: true, answer: true, deckId: true, userId: true } });
        return { deck, flashcards };
    } catch (error) {
        console.error(`Error fetching data for deck ${deckId}:`, error);
        throw new Error("Failed to load deck data.");
    }
}

// --- The Server Component ---
// Type the incoming prop inline as a Promise containing the expected shape
// And await it directly, destructuring the 'id'
export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) { // Type as Promise

    // --- AWAIT PARAMS and Destructure ID ---
    // This is the core change based on the example fix
    let id: string; // Variable to hold the extracted ID
    try {
        console.log("Awaiting params promise...");
        // Directly await and destructure. Assumes params resolves to { id: string }
        const resolvedParams = await params;
        id = resolvedParams.id; // Extract id after await

        // Validate the extracted id
        if (!id || typeof id !== 'string') {
            throw new Error("Invalid 'id' retrieved from resolved params.");
        }
        console.log("Params awaited, extracted id:", id);
    } catch (error) {
        console.error("Error awaiting or validating params promise:", error);
        notFound(); // If await fails or validation fails
    }
    // --- Use the extracted 'id' variable from here on ---


    // 1. Authenticate User
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        const callbackUrl = encodeURIComponent(`/deck/${id}`); // Use extracted id
        redirect(`/login?callbackUrl=${callbackUrl}`);
    }
    const userId = session.user.id;

    // 2. Decode ID (already validated it's a string above)
    let decodedDeckId: string;
    try {
        decodedDeckId = decodeURIComponent(id); // Use extracted id
        if (!decodedDeckId) throw new Error("Decoded ID is empty.");
    } catch (e) {
        console.error("Error decoding deck ID:", id, e);
        notFound();
    }

    // 3. Fetch Data
    const { deck, flashcards } = await getDeckAndCards(decodedDeckId, userId);

    // 4. Handle Not Found
    if (!deck) {
        notFound();
    }

    // 5. Render Page
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Deck: {deck.name}</h1>
                    <p className="text-md text-muted-foreground mt-1">
                        ID: <span className="font-mono text-xs bg-muted px-1 rounded">{deck.id}</span>
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                </Button>
            </div>

            {/* Action Buttons */}
            {/* Pass deck.id (which is guaranteed to exist if we got here) */}
            <DeckActionButtons deckId={deck.id} />

            {/* Flashcard List */}
            <div className="mt-8 border-t pt-6">
                 {/* Pass deck.id */}
                <FlashcardListClient
                    initialFlashcards={flashcards}
                    deckId={deck.id}
                 />
            </div>
        </div>
    );
}