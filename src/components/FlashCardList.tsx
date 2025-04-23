'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

interface FlashcardListProps {
  flashcards: Flashcard[];
}

export default function FlashcardList({ flashcards }: FlashcardListProps) {
  if (flashcards.length === 0) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">
          No flashcards found. Create a new flashcard to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {flashcards.map((flashcard) => (
        <Card key={flashcard.id}>
          <CardHeader>
            <CardTitle>{flashcard.question}</CardTitle>
            <CardDescription>{flashcard.answer}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}