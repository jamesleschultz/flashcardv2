'use client';

import PdfTextExtractorClient from '@/components/PdfExtractor';
import { useState, useEffect, useTransition, Suspense } from 'react'; // Added Suspense
import { useFormState } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import { Alert} from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Re-add Select
import { Label } from '@/components/ui/label'; // Re-add Label
import { fetchUserDecksAction } from '@/lib/actions';
// --- Import the Server Action and State Type ---
import { generateFlashcardsFromTextAction, type AiActionResponse } from '@/lib/actions'; // Adjust path

// Define Deck type for the dropdown
interface Deck {
    id: string;
    name: string;
}

// Needs to be wrapped for useSearchParams
function PdfUploaderContent() {
    const [extractedPdfText, setExtractedPdfText] = useState<string | null>(null);
    const [userDecks, setUserDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<string>('');
    const [loadingDecks, setLoadingDecks] = useState<boolean>(true);
    const [deckFetchError, setDeckFetchError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const deckIdFromQuery = searchParams.get('deckId'); // Get initial deckId

    const initialAiState: AiActionResponse = { status: 'idle', message: null, errors: null, createdCount: null };
    const [aiState, formAction] = useFormState(generateFlashcardsFromTextAction, initialAiState);
    const [isPendingAi, startAiTransition] = useTransition();

    const handlePdfTextExtracted = (text: string) => {
        setExtractedPdfText(text);
        // Consider resetting aiState here if needed
    };

    // Fetch user's decks
    useEffect(() => {
        const fetchDecks = async () => {
            setLoadingDecks(true);
            setDeckFetchError(null);
            setUserDecks([]);
            setSelectedDeckId('');
            // Call the server action
            const result = await fetchUserDecksAction();
            if (result.status === 'success' && result.decks) {
                setUserDecks(result.decks);
                // Pre-select deck logic...
                if (deckIdFromQuery && result.decks.some(d => d.id === deckIdFromQuery)) {
                    setSelectedDeckId(deckIdFromQuery);
                } else if (result.decks.length > 0) {
                    setSelectedDeckId(result.decks[0].id);
                }
            } else {
                 setDeckFetchError(result.message || "Could not load your decks.");
            }
            setLoadingDecks(false);
        };
        fetchDecks();
    }, [deckIdFromQuery]); // Dependency remains


    // Handler for the "Generate Flashcards" button
    const handleGenerateClick = () => {
        // Now requires selectedDeckId
        if (!extractedPdfText || !selectedDeckId || isPendingAi) {
            console.warn("Cannot generate: Missing text, selected deck, or already pending.");
            return;
        }
        console.log(`Generating flashcards for deck ${selectedDeckId}...`);

        const formData = new FormData();
        formData.append('inputText', extractedPdfText);
        formData.append('deckId', selectedDeckId); // --- ADD deckId back ---

        startAiTransition(() => { formAction(formData); });
    };

    // Effect for feedback and redirect
    useEffect(() => {
        if (aiState.status === 'success' && aiState.message) {
             console.log("AI Action Succeeded:", aiState.message);
             alert(aiState.message); // Or use a Toast notification
             // Redirect back to the deck where cards were added
             if (selectedDeckId) {
                 router.push(`/deck/${selectedDeckId}`);
             } else {
                  router.push('/dashboard'); // Fallback
             }
        } else if (aiState.status === 'error' && aiState.message) {
             console.error("AI Action Failed:", aiState.message, aiState.errors);
             // Error Alert is displayed below
        }
    }, [aiState, router, selectedDeckId]); // Depend on selectedDeckId for redirect

    // Handler for the Back button
    const handleGoBack = () => {
        if (deckIdFromQuery) router.push(`/deck/${deckIdFromQuery}`);
        else router.push('/dashboard');
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Generate from PDF</h1>
                    <p className="text-md text-muted-foreground mt-1">
                        Upload PDF, select deck, generate flashcards.
                    </p>
                </div>
                <Button onClick={handleGoBack} variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {deckIdFromQuery ? 'Back to Deck' : 'Back to Dashboard'}
                </Button>
            </div>

            {/* PDF Upload Section */}
            <div className="p-4 md:p-6 border rounded-lg bg-card shadow-sm space-y-4">
                <h2 className="text-xl font-semibold">1. Upload PDF & Extract Text</h2>
                <PdfTextExtractorClient onTextExtracted={handlePdfTextExtracted} />
            </div>

            {/* Extracted Text & AI Trigger Section */}
            {extractedPdfText && (
                <div className="p-4 md:p-6 border rounded-lg bg-card shadow-sm space-y-6">
                    {/* Extracted Text Display */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">2. Review Extracted Text</h2>
                        <Textarea readOnly value={extractedPdfText} className="h-60 ..." />
                        <div className="flex justify-between items-center">
                             <p className="text-xs text-muted-foreground">Characters: {extractedPdfText.length}</p>
                             <Button variant="secondary" size="sm" onClick={() => setExtractedPdfText(null)}> Clear Text </Button>
                        </div>
                    </div>

                    {/* --- RE-ADD Deck Selection --- */}
                    <div className="space-y-2">
                        <Label htmlFor="deck-select" className="text-lg font-semibold">3. Select Target Deck</Label>
                        {loadingDecks && <p className="text-sm text-muted-foreground">Loading decks...</p>}
                        {deckFetchError && <p className="text-sm text-destructive">{deckFetchError}</p>}
                        {!loadingDecks && !deckFetchError && (
                            <Select value={selectedDeckId} onValueChange={setSelectedDeckId} disabled={userDecks.length === 0 || isPendingAi} >
                                <SelectTrigger id="deck-select" className="w-full sm:w-[300px]">
                                    <SelectValue placeholder="Select a deck..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {userDecks.length > 0 ? (
                                        userDecks.map((deck) => ( <SelectItem key={deck.id} value={deck.id}>{deck.name}</SelectItem> ))
                                    ) : ( <div className="px-4 py-2 text-sm text-muted-foreground">No decks found.</div> )}
                                </SelectContent>
                            </Select>
                        )}
                         {userDecks.length === 0 && !loadingDecks && <p className="text-xs text-muted-foreground">Create a deck first on the dashboard.</p>}
                    </div>
                    {/* --- END Deck Selection --- */}

                    {/* AI Generation Trigger */}
                    <div className="pt-4 text-center border-t">
                         <h2 className="text-xl font-semibold mb-4">4. Generate & Save Flashcards</h2>
                        <Button
                            onClick={handleGenerateClick}
                            disabled={!extractedPdfText || !selectedDeckId || isPendingAi || userDecks.length === 0 || loadingDecks || extractedPdfText.length < 50} // Updated disabled check
                            size="lg"
                        >
                            {isPendingAi ? ( <Loader2 className="mr-2 h-5 w-5 animate-spin" /> ) : ( <Bot className="mr-2 h-5 w-5" /> )}
                            {isPendingAi ? "Generating & Saving..." : "Generate & Add to Deck"}
                        </Button>
                         {/* Text length warning */}
                         {!isPendingAi && extractedPdfText && extractedPdfText.length < 50 && (
                            <p className="text-xs text-destructive mt-2">Minimum 50 characters required.</p>
                         )}
                    </div>

                     {/* Display AI Action Errors/Messages */}
                     {aiState?.status === 'error' && aiState.message && ( <Alert variant="destructive" className="mt-4"> {/* ... Error Alert JSX ... */} </Alert> )}
                     {aiState?.status === 'success' && aiState.message && ( <Alert  className="mt-4"> {/* ... Success Alert JSX ... */} </Alert> )}
                     {/* Display specific input validation errors */}
                     {aiState?.status === 'error' && aiState.errors?.inputText && ( <p className="text-sm text-destructive mt-2">Text Error: {aiState.errors.inputText[0]}</p> )}
                     {aiState?.status === 'error' && aiState.errors?.deckId && ( <p className="text-sm text-destructive mt-2">Deck Error: {aiState.errors.deckId[0]}</p> )} {/* Re-add deckId error */}
                </div>
            )}
        </div>
    );
}

// Exported Page Component Wrapped in Suspense (Required for useSearchParams)
export default function PdfUploaderPageWrapper() {
    return (
        <Suspense fallback={<div className="container mx-auto p-8 text-center">Loading Uploader...</div>}>
             <PdfUploaderContent />
        </Suspense>
    );
}