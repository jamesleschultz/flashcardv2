// src/app/(protected)/pdf-uploader/page.tsx
'use client';

import PdfTextExtractorClient from '@/components/PdfExtractor';
import { useState, useEffect, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams} from 'next/navigation';
import { ArrowLeft, Bot, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// --- Import the Server Action and State Type ---
import { generateFlashcardsFromTextAction, type AiActionResponse } from '@/lib/actions'; // Adjust path

// Removed Deck interface and related state

export default function PdfUploaderPage() {
    const [extractedPdfText, setExtractedPdfText] = useState<string | null>(null);
    const router = useRouter();

    // --- State and Action Hook for AI Generation ---
    const initialAiState: AiActionResponse = { status: 'idle', message: null, errors: null, parsedCards: null };
    const [aiState, formAction] = useFormState(generateFlashcardsFromTextAction, initialAiState);
    const [isPendingAi, startAiTransition] = useTransition();
    // --- End AI State ---

    const searchParams = useSearchParams();
    const deckIdFromQuery = searchParams.get('deckId'); // Get deckId from URL query

    // Callback function for PdfTextExtractorClient
    const handlePdfTextExtracted = (text: string) => {
        console.log("Received extracted text. Length:", text.length);
        setExtractedPdfText(text);
    };

    // Handler for the "Generate Flashcards" button
    const handleGenerateClick = () => {
        // Only need extracted text
        if (!extractedPdfText || isPendingAi) {
            console.warn("Cannot generate: Missing text or already pending.");
            return;
        }
        console.log(`Sending text (length ${extractedPdfText.length}) to AI action...`);

        const formData = new FormData();
        formData.append('inputText', extractedPdfText);
        // formData.append('deckId', selectedDeckId); // REMOVED

        startAiTransition(() => {
            formAction(formData);
        });
    };

    // Effect to LOG feedback AFTER AI action completes
    useEffect(() => {
        if (aiState.status === 'success' && aiState.message) {
             console.log("--- AI Action Succeeded ---");
             console.log("Message:", aiState.message);
             console.log("Parsed Cards:", aiState.parsedCards); // Log the parsed cards
             alert(aiState.message); // Simple feedback
        } else if (aiState.status === 'error' && aiState.message) {
             console.error("--- AI Action Failed ---");
             console.error("Message:", aiState.message);
             console.error("Input Errors:", aiState.errors);
             // Error is displayed via the Alert component below
        }
    }, [aiState]);

    const handleGoBack = () => {
        if (deckIdFromQuery) {
            router.push(`/deck/${deckIdFromQuery}`); // Go back to specific deck
        } else {
            router.push('/dashboard'); // Fallback to dashboard
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Test PDF-to-Flashcard AI</h1>
                    <p className="text-md text-muted-foreground mt-1">
                        {/* Upload PDF -> Extract Text -> Call AI -> Log Result. */}
                    </p>
                </div>
                <Button onClick={handleGoBack} variant="outline" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {/* Change text based on whether we know the deck */}
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
                        <Textarea
                            readOnly
                            value={extractedPdfText}
                            className="h-60 text-sm bg-muted/50 dark:bg-background focus-visible:ring-transparent"
                            placeholder="Extracted text will appear here..."
                        />
                        <div className="flex justify-between items-center">
                             <p className="text-xs text-muted-foreground">Characters: {extractedPdfText.length}</p>
                             <Button variant="secondary" size="sm" onClick={() => setExtractedPdfText(null)}>
                                Clear Text / New PDF
                             </Button>
                        </div>
                    </div>

                    {/* --- REMOVED Deck Selection --- */}

                    {/* AI Generation Trigger */}
                    <div className="pt-4 text-center border-t">
                         <h2 className="text-xl font-semibold mb-4">3. Generate Flashcards (Test)</h2>
                        <Button
                            onClick={handleGenerateClick}
                            // Simpler disabled check
                            disabled={!extractedPdfText || isPendingAi}
                            size="lg"
                        >
                            {isPendingAi ? ( <Loader2 className="mr-2 h-5 w-5 animate-spin" /> ) : ( <Bot className="mr-2 h-5 w-5" /> )}
                            {isPendingAi ? "Generating (Check Console)..." : "Generate & Log AI Response"}
                        </Button>
                    </div>

                     {/* Display AI Action Errors/Messages */}
                     {aiState?.status === 'error' && aiState.message && (
                         <Alert variant="destructive" className="mt-4">
                           <AlertCircle className="h-4 w-4" />
                           <AlertTitle>AI Generation Failed</AlertTitle>
                           <AlertDescription>{aiState.message}</AlertDescription>
                         </Alert>
                     )}
                     {aiState?.status === 'success' && aiState.message && (
                         <Alert  className="mt-4"> {/* Use success variant */}
                           <Bot className="h-4 w-4" /> {/* Optional: Add success icon */}
                           <AlertTitle>AI Action Status</AlertTitle>
                           <AlertDescription>{aiState.message}</AlertDescription>
                         </Alert>
                     )}
                     {/* Display AI input validation errors */}
                     {aiState?.status === 'error' && aiState.errors?.inputText && (
                         <p className="text-sm text-destructive mt-2">Input Text Error: {aiState.errors.inputText[0]}</p>
                     )}
                     {/* Removed deckId error display */}
                     {/* {aiState?.status === 'error' && aiState.errors?.deckId && ( ... )} */}
                </div>
            )}
        </div>
    );
}