"use client"

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase-config';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose 
} from "@/components/ui/dialog"
import FormComponent from '@/components/formcomponent';
import DeckList from '@/components/DeckList';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { AlertCircle, PlusCircle, Trash2, ArrowLeft, Pencil } from "lucide-react"; // Added Pencil

type Deck = {
  id: string;
  name: string;
  description: string | null;
  userId?: string;
};

export default function Dashboard (){
    const [authUser, authLoading, authError] = useAuthState(auth); 
    const router = useRouter();

    // --- State Lifted Up ---
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false); 

    // --- Fetching Logic Lifted Up ---
    // Use useCallback to memoize fetchDecks
    const fetchDecks = useCallback(async () => {
        // Only fetch if user is authenticated (optional, but good practice)
        // Note: Your current API GET doesn't filter by user, this is client-side check
        // if (!authUser?.uid) {
        //     setDecks([]);
        //     setLoading(false);
        //     console.log("User not authenticated, not fetching decks.");
        //     return;
        // }

        console.log("Dashboard: Fetching decks...");
        setLoading(true);
        setError(null);
        try {
            // Consider fetching only user's decks: await axios.get(`/api/deck?userId=${authUser.uid}`);
            // Your current API fetches ALL decks - this needs fixing in the API route for security/correctness
            const response = await axios.get("/api/deck");
            setDecks(response.data);
            console.log("Dashboard: Decks fetched:", response.data.length);
        } catch (err: any) {
            console.error("Dashboard: Error fetching decks:", err.response?.data || err.message);
            const serverMessage = err.response?.data?.message || "Could not load decks.";
            setError(`Error: ${serverMessage}`);
            setDecks([]); // Clear decks on error
        } finally {
            setLoading(false);
        }
    }, []); // No dependency needed if API fetches all decks. Add authUser.uid if API filters

    // Fetch decks when component mounts or when user logs in/out
    useEffect(() => {
       if (authUser) { // Fetch only when user is logged in
          fetchDecks();
       } else {
           // Optionally clear decks if user logs out
           setDecks([]);
           setLoading(false); // Not loading if logged out
       }
    }, [authUser, fetchDecks]); // Re-run if user or fetchDecks changes

    // --- Callback for FormComponent ---
    const handleDeckCreated = () => {
        console.log("Dashboard: Deck created signal received, refetching...");
        fetchDecks(); // Trigger refetch
        setIsDialogOpen(false); // Close the dialog after successful creation
    };

    // Handle auth loading state
    if (authLoading) {
        return <p>Loading authentication...</p>; // Or a spinner component
    }

    // Handle auth error state
    if (authError) {
        return <p>Authentication Error: {authError.message}</p>;
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
                {/* ... header content ... */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-md text-muted-foreground mt-1">
                    See the decks you have created and manage them here.                    
                    </p>
                </div>
            </div>
            {authUser ? (
                <>
                    {/* Deck List Section */}
                    <div className="mt-8">
                        <DeckList
                            decks={decks}
                            loading={loading}
                            error={error}
                        />
                    </div>

                    {/* Create Deck Button/Dialog Section */}
                    <div className="mt-6 text-center">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                             <Button>Create New Deck</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add a deck to your collection!</DialogTitle>
                              <DialogDescription>
                                Fill in the form to add a deck.
                              </DialogDescription>
                            </DialogHeader>
                            {/* Pass the callback down to FormComponent */}
                            <FormComponent onDeckCreated={handleDeckCreated} />
                          </DialogContent>
                        </Dialog>
                    </div>
                </>
            ) : (
                // Render Login component or redirect if user is not signed in
                <div>
                    <p className="text-center mb-4">You need to sign in to view your dashboard.</p>
                    {/* Option 1: Render Login component directly */}
                     {/* <Login /> */}
                    {/* Option 2: Show a button to go to login page */}
                    <div className="text-center">
                        <Button onClick={() => router.push('/login')}>Go to Login</Button>
                    </div>
                </div>
            )}
        </div>
    )
}