// src/components/FlashcardList.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter, // Import CardFooter
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button"; // Import Button
import { Pencil } from "lucide-react"; // Import Edit icon
import { useEffect } from 'react';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  // Add userId if available and needed for permissions display
  userId?: string;
}

interface FlashcardListProps {
  flashcards: Flashcard[];
  loading: boolean;
  error: string | null;
  deckId: string;
  // --- NEW: Callback prop for edit ---
  onEditClick: (flashcard: Flashcard) => void;
}

export default function FlashcardList({
    flashcards,
    loading,
    error,
    deckId,
    onEditClick // Destructure new prop
}: FlashcardListProps) {

  useEffect(() => {
    // console.log("FlashcardList received props:", { loading, error, deckId, flashcardCount: flashcards.length });
  }, [flashcards, loading, error, deckId]);

  // --- Loading State Display ---
  if (loading) {
    // ... (skeleton code remains the same)
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6 mt-2" />
                        </CardContent>
                        {/* Optional: Skeleton for footer/button */}
                         <CardFooter><Skeleton className="h-8 w-16" /></CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  // --- Error State Display ---
  if (error) {
    // ... (error display remains the same)
     return (
        <div className="space-y-2">
             <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
             <p className="text-red-600 dark:text-red-400 text-center p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-md shadow-sm">
                {error}
             </p>
        </div>
    );
  }

  // --- Actual Flashcard List Display ---
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
      {flashcards.length === 0 ? (
        <p className="text-muted-foreground text-center pt-4 pb-4 border rounded-md">
            No flashcards found in this deck yet. Click "Create New Flashcard" to add some!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flashcards.map((flashcard) => (
            <Card key={flashcard.id} className="flex flex-col justify-between h-full"> {/* Ensure flex column and full height */}
              <div> {/* Wrapper for header and content */}
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Question:</CardTitle>
                    <CardDescription className="text-base pt-1 break-words">{flashcard.question}</CardDescription> {/* Added break-words */}
                  </CardHeader>
                  <CardContent>
                    <h4 className="text-md font-semibold mb-1">Answer:</h4>
                    <p className="text-muted-foreground break-words">{flashcard.answer}</p> {/* Added break-words */}
                  </CardContent>
              </div>
              {/* --- NEW: Card Footer with Edit Button --- */}
              <CardFooter className="pt-4 border-t mt-auto"> {/* Use mt-auto to push footer down */}
                 <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditClick(flashcard)} // Call the callback with the card data
                    className="ml-auto" // Push button to the right
                 >
                   <Pencil className="mr-2 h-4 w-4" />
                   Edit
                 </Button>
                 {/* Optional: Add Delete button here later */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}