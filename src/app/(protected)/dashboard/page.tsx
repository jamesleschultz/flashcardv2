"use client"

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase-config';
import Login from '@/app/(auth)/login/page'; // Assuming Login handles its own logic or redirects
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation'; // Keep if needed for other navigation
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose // Import DialogClose
} from "@/components/ui/dialog"
import FormComponent from '@/components/formcomponent';
import DeckList from '@/components/DeckList';      // Adjust path if necessary
import { useState, useEffect, useCallback } from 'react'; // Import hooks
import axios from 'axios';                         // Import axios
import { Button } from '@/components/ui/button'; // Import Button for DialogTrigger

// Define the Deck type (can be shared in a types file)
type Deck = {
  id: string;
  name: string;
  description: string | null;
  userId?: string; // Optional: Include if your API returns it and you need it
};

export default function Dashboard (){
    const [authUser, authLoading, authError] = useAuthState(auth); // Renamed to avoid conflict
    const router = useRouter(); // Keep if needed

    // --- State Lifted Up ---
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true); // Loading state for the deck list
    const [error, setError] = useState<string | null>(null); // Error state for the deck list
    const [isDialogOpen, setIsDialogOpen] = useState(false); // State for Dialog

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

    const handleSignOut = () => {
        signOut(auth).catch((error) => {
          console.error("Sign out error:", error);
        });
        // Optional: Redirect after sign out
        // router.push('/');
      };

    // Handle auth loading state
    if (authLoading) {
        return <p>Loading authentication...</p>; // Or a spinner component
    }

    // Handle auth error state
    if (authError) {
        return <p>Authentication Error: {authError.message}</p>;
    }

    const handlePDFUploader = () => {
        // route to PDF Uploader page
        router.push('/pdf-uploader'); // Adjust the path as needed
    }

    return (
        <div className="container mx-auto p-4 space-y-8"> {/* Added container/padding */}
            <div className="flex justify-between mb-6"> {/* Header section */}
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className='flex justify-end'>
                    <Button className='mr-4' onClick={handlePDFUploader}>PDF Uploader</Button>
                    {authUser && (
                        <div className="flex items-center gap-4">
                            <span>Welcome, {authUser.displayName || authUser.email}!</span>
                            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
                        </div>
                    )}
                </div>
                
            </div>

            {authUser ? (
                <>
                    {/* Deck List Section */}
                    <div className="mt-8">
                        {/* Pass state and data down to DeckList */}
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
                    {/* Ensure your Login page redirects back to dashboard after successful login */}
                </div>
            )}
        </div>
    )
}