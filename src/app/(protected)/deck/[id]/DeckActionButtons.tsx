"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FormComponentCard from '@/components/FormComponentCard'
import { AlertCircle, PlusCircle, Trash2, Play } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { deleteDeckAction } from '@/lib/actions';


interface DeckActionButtonsProps {
    deckId: string;
}

export default function DeckActionButtons({ deckId }: DeckActionButtonsProps) {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isPendingDelete, startDeleteTransition] = useTransition();
    const router = useRouter();

    // Callback for FormComponentCard success
    const handleActionComplete = () => {
        setIsCreateDialogOpen(false);
    };

    // Delete handler calls the imported Server Action
    const handleDeleteDeck = () => {
        setDeleteError(null);
        startDeleteTransition(async () => {
            const result = await deleteDeckAction(deckId);
            if (result.status === 'error') {
                setDeleteError(result.message);
            } else {
                setIsDeleteDialogOpen(false);

                router.push('/dashboard');

            }
        });
    };

    return (
        <div className="flex flex-wrap gap-3 pt-2">

            <Button> {/* Primary action style */}
                <Link href={`/deck/${deckId}/study`}> {/* Link to the study page */}
                    <Play />
                    Start Studying
                </Link>
             </Button>
            {/* Create Card Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button disabled={isPendingDelete}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Flashcard
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Flashcard</DialogTitle>
                        <DialogDescription>Enter question and answer.</DialogDescription>
                    </DialogHeader>
                    <FormComponentCard
                        deckId={deckId}
                        mode="create"
                        onActionComplete={handleActionComplete}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Deck Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="destructive" disabled={isPendingDelete}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Deck
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Deck Deletion</DialogTitle>
                        <DialogDescription>Delete deck and ALL its flashcards permanently?</DialogDescription>
                    </DialogHeader>
                    {deleteError && ( <Alert variant="destructive" className="mt-4"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Failed</AlertTitle> <AlertDescription>{deleteError}</AlertDescription> </Alert> )}
                    <DialogFooter className="mt-4 gap-2 sm:justify-end">
                        <DialogClose> 
                            <Button variant="outline" disabled={isPendingDelete}>Cancel</Button> 
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDeleteDeck} disabled={isPendingDelete}>
                            {isPendingDelete ? 'Deleting...' : 'Delete Forever'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}