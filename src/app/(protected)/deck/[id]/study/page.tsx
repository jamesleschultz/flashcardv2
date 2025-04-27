// src/app/(protected)/deck/[id]/study/page.tsx
// SERVER COMPONENT

import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import StudySessionClient from '@/components/StudySessionClient'; // Import the new Client Component

// Types
interface Flashcard { id: string; question: string; answer: string; deckId: string; userId: string; }
interface Deck { id: string; name: string; userId: string; }
interface StudyPageProps { params: { id: string }; }

// Data Fetching Helper (remains the same)
async function getStudyData(deckId: string, userId: string): Promise<{ deck: Deck | null, flashcards: Flashcard[] }> {
    // ... (implementation is fine)
     console.log(`Fetching study data for deck ${deckId}, user ${userId}`);
    try {
        const deck = await prisma.deck.findUnique({ where: { id: deckId, userId: userId }, select: { id: true, name: true, userId: true } });
        if (!deck) { return { deck: null, flashcards: [] }; }
        const flashcards = await prisma.flashcard.findMany({ where: { deckId: deckId }, orderBy: { createdAt: 'asc' }, select: { id: true, question: true, answer: true, deckId: true, userId: true } });
        return { deck, flashcards };
    } catch (error) { throw new Error("Failed to load study data."); }
}

// --- The Study Page Server Component ---
export default async function StudyPage({ params }: StudyPageProps) {
    // 1. Authenticate User
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        const callbackUrl = encodeURIComponent(`/deck/${params.id}/study`);
        redirect(`/login?callbackUrl=${callbackUrl}`);
    }
    const userId = session.user.id;

    // 2. Decode & Validate Deck ID
    let decodedDeckId: string;
    try {
        decodedDeckId = decodeURIComponent(params.id);
        if (!decodedDeckId) throw new Error("Decoded ID is empty.");
    } catch (e) { notFound(); }

    // 3. Fetch Deck and Cards for Studying
    const { deck, flashcards } = await getStudyData(decodedDeckId, userId);

    // 4. Handle Not Found / Not Authorized
    if (!deck) {
        notFound();
    }

    // --- Render Page, passing data to Client Component ---
    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Studying: {deck.name}</h1>
                    <p className="text-md text-muted-foreground mt-1">
                         {flashcards.length > 0 ? `Card 1 of ${flashcards.length}` : 'No cards in this deck'}
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/deck/${deck.id}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Deck Details
                    </Link>
                </Button>
            </div>

            {/* Render the Client Component for the Study Session */}
            <div className="mt-6"> {/* Add margin top */}
                {flashcards.length > 0 ? (
                    <StudySessionClient
                        initialFlashcards={flashcards}
                        deckId={deck.id}
                        // onSessionComplete={() => console.log("Session finished!")} // Optional callback
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