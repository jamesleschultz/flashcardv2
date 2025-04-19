"use client";

// Remove useState, useEffect, axios imports if they were only for fetching
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton"; // Optional: For better loading UI

// Define the Deck type (can be shared in a types file)
type Deck = {
  id: string;
  name: string;
  description: string | null;
  userId?: string;
};

// Define props the component expects
interface DeckListProps {
    decks: Deck[];
    loading: boolean;
    error: string | null;
}

// Make it a function receiving props
export default function DeckList({ decks, loading, error }: DeckListProps) {
  const router = useRouter();

  // --- Remove internal state and fetch logic ---
  // const [decks, setDecks] = useState<Deck[]>([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  // const fetchDecks = ... // Removed
  // useEffect(...) // Removed

  // Loading state display (using Skeleton for better UX)
  if (loading) {
    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Your Decks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Render skeleton loaders */}
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  // Error state display
  if (error) {
    return (
        <div className="space-y-4">
             <h2 className="text-2xl font-bold">Your Decks</h2>
             <p className="text-red-500 text-center p-4 border border-red-300 bg-red-50 rounded">{error}</p>
        </div>
    );
  }

  // Actual deck list display
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Decks</h2>
      {decks.length === 0 ? (
        <p className="text-muted-foreground text-center pt-4">No decks found. Click "Create New Deck" to add one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out"
              onClick={() => {
                if (deck.id) {
                  router.push(`/deck/${encodeURIComponent(deck.id)}`);
                } else {
                  console.error("Deck ID is missing or invalid:", deck.id);
                }
              }}
            >
              <CardHeader>
                <CardTitle>{deck.name}</CardTitle>
                {/* Only show description if it exists */}
                {deck.description && (
                    <CardDescription>
                        {deck.description}
                    </CardDescription>
                )}
              </CardHeader>
              {/* Removed CardContent as description moved to header */}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}