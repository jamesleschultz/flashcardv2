import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import FlashcardListClient from './FlashcardListClient';
import DeckActionButtons from './DeckActionButtons';


interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  userId: string;
}
interface Deck {
  id: string;
  name: string;
  userId: string;
}
interface DeckPageProps { params: { id: string }; }

//  Data Fetching Helper 
async function getDeckAndCards(deckId: string, userId: string): Promise<{ deck: Deck | null, flashcards: Flashcard[] }> {
    try {
        const deck = await prisma.deck.findUnique({
            where: { id: deckId, userId: userId },
            select: { id: true, name: true, userId: true }
        });

        if (!deck) {
            console.log(`Deck not found or user ${userId} does not own deck ${deckId}`);
            return { deck: null, flashcards: [] };
        }

        const flashcards = await prisma.flashcard.findMany({
            where: { deckId: deckId },
            orderBy: { createdAt: 'asc' },
            select: { id: true, question: true, answer: true, deckId: true, userId: true }
        });

        return { deck, flashcards };
    } catch (error) {
        console.error("Error fetching deck/cards:", error);

        throw new Error("Failed to load deck data.");
    }
}

export default async function DeckPage({ params }: DeckPageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {

        const callbackUrl = encodeURIComponent(`/deck/${params.id}`);
        redirect(`/login?callbackUrl=${callbackUrl}`);
    }
    const userId = session.user.id;


    let decodedDeckId: string;
    try {
        decodedDeckId = decodeURIComponent(params.id);
    } catch (e) {
        console.error("Invalid deck ID format:", params.id);
        notFound();
    }


    const { deck, flashcards } = await getDeckAndCards(decodedDeckId, userId);

    if (!deck) {
        notFound(); 
    }


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

            {/* Action Buttons (Client Component) */}
            <DeckActionButtons deckId={deck.id} />

            {/* Flashcard List (Client Component) */}
            <div className="mt-8 border-t pt-6">
                <FlashcardListClient
                    initialFlashcards={flashcards}
                    deckId={deck.id}
                 />
            </div>
        </div>
    );
}