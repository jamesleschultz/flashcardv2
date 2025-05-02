"use client";

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FormComponentCard from '@/components/FormComponentCard';

import { deleteFlashcardAction } from '@/lib/actions';


interface Flashcard { id: string; question: string; answer: string; deckId: string; userId: string; }

interface FlashcardListClientProps {
  initialFlashcards: Flashcard[];
  deckId: string;
}

export default function FlashcardListClient({ initialFlashcards, deckId }: FlashcardListClientProps) {
    const [flashcards, setFlashcards] = useState<Flashcard[]>(initialFlashcards);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [cardToEdit, setCardToEdit] = useState<Flashcard | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<Flashcard | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPendingDelete, startDeleteTransition] = useTransition();

    // Sync local state with props from server component re-render
    useEffect(() => {
        console.log("FlashcardListClient: Initial flashcards updated, syncing state.");
        setFlashcards(initialFlashcards);
    }, [initialFlashcards]);


    const handleEditClick = (flashcard: Flashcard) => {
        setCardToEdit(flashcard);
        setIsEditDialogOpen(true);
    };
    const handleEditComplete = () => {
        setIsEditDialogOpen(false);
        setCardToEdit(null);
        // Relies on revalidatePath from the update server action
    };

    // Delete Handlers
    const handleDeleteTrigger = (flashcard: Flashcard) => {
        setCardToDelete(flashcard);
        setDeleteError(null);
        setIsDeleteDialogOpen(true);
    };
    const confirmDeleteFlashcard = () => {
        if (!cardToDelete) return;
        startDeleteTransition(async () => {
            // Optimistic UI Update
            const originalFlashcards = flashcards;
            setFlashcards(currentCards => currentCards.filter(c => c.id !== cardToDelete!.id));

            const result = await deleteFlashcardAction(cardToDelete.id);

            if (result.status === 'error') {
                setDeleteError(result.message);
                setFlashcards(originalFlashcards); // Rollback on error
            } else {
                // If reaches here all good. Close dialog. Revalidation will eventually update props if needed.
                setIsDeleteDialogOpen(false);
                setCardToDelete(null);
            }
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Flashcards</h2>
            {flashcards.length === 0 ? ( <p className="text-muted-foreground text-center pt-4 pb-4 border rounded-md"> No flashcards yet. </p> )
             : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {flashcards.map((flashcard) => (
                        <Card
                        key={flashcard.id}
                        // Set desired fixed height (e.g., h-72 = 288px). Adjust as needed.
                        className="flex flex-col justify-between h-72 bg-card shadow-sm border overflow-hidden"
                        // Main card overflow-hidden is a fallback clip
                    >
                       {/* --- ADD OVERFLOW HIDDEN TO CONTENT WRAPPER --- */}
                       {/* This div wraps the part that might grow */}
                        <div className="flex-grow overflow-hidden"> {/* Allow grow, hide overflow */}
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <CardTitle className="text-base font-semibold leading-tight">Question:</CardTitle>
                                    {/* Removed line-clamp, keep overflow-hidden on parent */}
                                    <CardDescription
                                        className="text-sm pt-1 break-words text-card-foreground"
                                        // title attribute still useful for hover
                                        title={flashcard.question}
                                    >
                                        {flashcard.question}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    <h4 className="text-sm font-semibold mb-1">Answer:</h4>
                                    {/* Removed line-clamp, keep overflow-hidden on parent */}
                                    <p
                                        className="text-sm text-muted-foreground break-words"
                                        // title attribute still useful for hover
                                        title={flashcard.answer}
                                    >
                                        {flashcard.answer}
                                    </p>
                                </CardContent>
                            </div>
                            <CardFooter className="pt-4 border-t mt-auto flex justify-end gap-">
                                 {/* Disable buttons during delete operation */}
                                 <Button variant="outline" size="sm" onClick={() => handleEditClick(flashcard)} disabled={isPendingDelete}> <Pencil className="h-4 w-4" /> <span className="sr-only">Edit</span> </Button>
                                 <Button variant="destructive" size="sm" onClick={() => handleDeleteTrigger(flashcard)} disabled={isPendingDelete}> <Trash2 className="h-4 w-4" /> <span className="sr-only">Delete</span> </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader> <DialogTitle>Edit Flashcard</DialogTitle> <DialogDescription>Update question and answer.</DialogDescription> </DialogHeader>
                    {cardToEdit && deckId && ( <FormComponentCard deckId={deckId} mode="edit" initialData={cardToEdit} onActionComplete={handleEditComplete} /> )}
                </DialogContent>
            </Dialog>

             {/* Delete Confirmation Dialog */}
             <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader> <DialogTitle>Delete Flashcard?</DialogTitle> <DialogDescription> Sure you want to delete this flashcard? </DialogDescription> </DialogHeader>
                     {cardToDelete && <p className="text-sm my-4 p-2 border rounded bg-muted">Q: {cardToDelete.question}</p>}
                     {deleteError && ( <Alert variant="destructive" className="mt-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Failed</AlertTitle> <AlertDescription>{deleteError}</AlertDescription> </Alert> )}
                    <DialogFooter className="mt-4 gap-2 sm:justify-end">
                        <DialogClose> 
                            <Button variant="outline" disabled={isPendingDelete}>Cancel</Button> 
                        </DialogClose>
                        <Button variant="destructive" onClick={confirmDeleteFlashcard} disabled={isPendingDelete}> {isPendingDelete ? 'Deleting...' : 'Delete'} </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}