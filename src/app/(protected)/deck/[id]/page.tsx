// DeckPage.tsx
"use client";

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase-config';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormComponentCard from '@/components/FormComponentCard'; // We will modify this component
import FlashcardList from '@/components/FlashCardList';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, PlusCircle, Trash2, ArrowLeft, Pencil } from "lucide-react"; // Added Pencil
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface DeckPageProps {
  params: { id: string };
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  userId?: string; // Include userId from API if available
}

export default function DeckPage({ params }: DeckPageProps) {
  const [authUser, authLoading] = useAuthState(auth);
  const [deckId, setDeckId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // --- NEW: State for Editing ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Flashcard | null>(null);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);


  const router = useRouter();

  // --- Fetching Logic (remains mostly the same) ---
  const fetchFlashcards = useCallback(async (currentDeckId: string) => {
    console.log(`Fetching flashcards for deck: ${currentDeckId}...`);
    setLoadingFlashcards(true);
    setFetchError(null);
    try {
      const response = await axios.get(`/api/flashcard?deckId=${currentDeckId}`);
      if (!Array.isArray(response.data)) {
           throw new Error("API did not return an array of flashcards");
       }
      setFlashcards(response.data);
      console.log("Flashcards fetched:", response.data.length);
    } catch (err: any) {
      console.error("Error fetching flashcards:", err.response?.data || err.message);
      const serverMessage = err.response?.data?.message || "Could not load flashcards.";
      setFetchError(`Error: ${serverMessage}`);
      setFlashcards([]);
    } finally {
      setLoadingFlashcards(false);
    }
  }, []);

  // --- Delete Deck Logic (remains the same) ---
  const handleDeleteDeck = async () => {
    // ... (delete logic) ...
    if (!deckId) return;
    setDeleteError(null);
    try {
      await axios.delete(`/api/deck?deckId=${deckId}`);
      router.push('/dashboard');
    } catch (error: any) {
      setDeleteError(error.response?.data?.message || 'Failed to delete deck.');
    }
  };

  // --- Callbacks for Child Components ---
   const handleFlashcardCreated = () => {
    console.log("DeckPage: Create successful, refetching...");
    if (deckId) fetchFlashcards(deckId);
    setIsCreateDialogOpen(false);
  };

  // --- NEW: Handler for Edit Click ---
  const handleEditClick = (flashcard: Flashcard) => {
    console.log("Editing flashcard:", flashcard);
    setCardToEdit(flashcard); // Store the card data
    setIsEditDialogOpen(true); // Open the edit dialog
  };

  // --- NEW: Handler for Update Completion ---
  const handleFlashcardUpdated = () => {
    console.log("DeckPage: Update successful, refetching...");
    setCardToEdit(null);       // Clear the card being edited
    setIsEditDialogOpen(false); // Close the edit dialog
    if (deckId) fetchFlashcards(deckId); // Refetch the list
  };

  // --- Effects (remain mostly the same) ---
   useEffect(() => {
    const currentId = params.id;
    if (!currentId) {
      router.push("/dashboard");
    } else {
      const decodedId = decodeURIComponent(currentId);
      if (decodedId !== deckId) {
           setDeckId(decodedId);
           if(authUser) fetchFlashcards(decodedId);
      }
    }
  }, [params.id, router, deckId, authUser, fetchFlashcards]);


  useEffect(() => {
      if (authUser && deckId && flashcards.length === 0 && !loadingFlashcards && !fetchError) {
           fetchFlashcards(deckId);
      } else if (!authUser) {
          setFlashcards([]);
          setLoadingFlashcards(false);
      }
  }, [authUser, deckId, fetchFlashcards, flashcards.length, loadingFlashcards, fetchError]);


  // --- Loading & Auth States (remain the same) ---
  if (authLoading || deckId === null) {
    // ... (skeleton loading) ...
    return <div className="container mx-auto p-4"><p>Loading...</p></div>; // Simplified placeholder
  }
   if (!authUser) {
     // ... (auth guard) ...
      return <div className="container mx-auto p-8 text-center"><p>Please log in.</p><Button onClick={() => router.push('/login')} className="mt-4">Login</Button></div>; // Simplified placeholder
   }

  // --- Main Render ---
  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Header Section (remains the same) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
         {/* ... header content ... */}
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Deck Details</h1>
            <p className="text-md text-muted-foreground mt-1">
                Deck ID: <span className="inline-block font-mono text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md align-middle">{deckId}</span>
            </p>
        </div>
        <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Action Buttons (remains the same) */}
      <div className="flex flex-wrap gap-3 pt-2">
        {/* Create Card Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            {/* ... DialogTrigger and Button ... */}
             <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Flashcard
                </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Flashcard</DialogTitle>
              <DialogDescription>Enter the question and answer.</DialogDescription>
            </DialogHeader>
            {/* Use FormComponentCard for CREATING */}
            <FormComponentCard
              deckId={deckId}
              mode="create" // Explicitly set mode
              onActionComplete={handleFlashcardCreated} // Use generic callback name
              // initialData={null} // Ensure no initial data for create
            />
          </DialogContent>
        </Dialog>

        {/* Delete Deck Dialog (remains the same) */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
             {/* ... DialogTrigger and Button ... */}
             <DialogTrigger asChild>
                <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Deck
                </Button>
            </DialogTrigger>
            {/* ... DialogContent, Header, Footer ... */}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Deck Deletion</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to permanently delete this deck and all its flashcards? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                {deleteError && (
                    <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Deletion Failed</AlertTitle>
                    <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                )}
                <DialogFooter className="mt-4 gap-2 sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDeleteDeck}>Delete Forever</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {/* --- NEW: Edit Flashcard Dialog --- */}
      {/* Conditionally render the dialog only when a card is selected for edit */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {/* No Trigger needed here, opened programmatically via state */}
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard</DialogTitle>
            <DialogDescription>Update the question and answer.</DialogDescription>
          </DialogHeader>
          {/* Use FormComponentCard for EDITING */}
          {/* Ensure cardToEdit is not null before rendering */}
          {cardToEdit && deckId && (
             <FormComponentCard
                 deckId={deckId}
                 mode="edit" // Set mode to edit
                 initialData={cardToEdit} // Pass the data to pre-fill
                 onActionComplete={handleFlashcardUpdated} // Callback for successful update
             />
          )}
        </DialogContent>
      </Dialog>


      {/* Flashcard List Section */}
      <div className="mt-8 border-t pt-6">
        <FlashcardList
          flashcards={flashcards}
          loading={loadingFlashcards}
          error={fetchError}
          deckId={deckId}
          onEditClick={handleEditClick} // Pass the NEW edit handler down
        />
      </div>
    </div>
  );
}