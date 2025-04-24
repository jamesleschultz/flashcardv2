'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';

type Deck = {
  id: string;
  name: string;
  description: string | null;
  userId?: string;
};

interface DeckListProps {
  decks: Deck[];
}

export default function DeckList({ decks }: DeckListProps) {
  const router = useRouter();

  if (decks.length === 0) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">No decks found. Create a new deck to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <Card
          key={deck.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out"
          onClick={() => router.push(`/deck/${deck.id}`)}
        >
          <CardHeader>
            <CardTitle>{deck.name}</CardTitle>
            {deck.description && <CardDescription>{deck.description}</CardDescription>}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}