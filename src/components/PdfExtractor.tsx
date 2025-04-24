// src/components/PdfTextExtractorClient.tsx
"use client";

import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Specify the worker source for pdf.js using a CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PdfTextExtractorClientProps {
    // Callback function to pass the extracted text up to the parent
    onTextExtracted: (text: string) => void;
}

export default function PdfTextExtractorClient({ onTextExtracted }: PdfTextExtractorClientProps) {
    // State for managing the component's behavior and feedback
    // Removed 'extractedText' state as it's passed directly via callback
    const [isParsing, setIsParsing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [progress, setProgress] = useState(0);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const fileInput = event.target; // Keep reference to reset

        // Reset state for new file processing
        setError(null);
        setFileName("");
        setProgress(0);
        setIsParsing(false);

        if (!file) {
            // setError("No file selected."); // Optional: Show error if needed
            return;
        }

        if (file.type !== "application/pdf") {
            setError("Invalid file type. Please select a PDF.");
            fileInput.value = '';
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10 MB
        if (file.size > maxSize) {
            setError(`File is too large (Max: ${maxSize / 1024 / 1024} MB).`);
            fileInput.value = '';
            return;
        }

        // Start processing
        setFileName(file.name);
        setIsParsing(true);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                if (!e.target?.result) {
                    setError("Failed to read file content.");
                    setIsParsing(false);
                    fileInput.value = '';
                    return;
                }

                try {
                    const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
                    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
                    const pdf = await loadingTask.promise;
                    console.log('PDF loaded, pages:', pdf.numPages);

                    let fullText = '';
                    setProgress(10);

                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
                        fullText += pageText + '\n\n';
                        setProgress(10 + Math.round((i / pdf.numPages) * 80));
                    }

                    console.log("Text extraction complete. Length:", fullText.length);
                    setProgress(100);
                    // --- Pass text DIRECTLY to parent via callback ---
                    onTextExtracted(fullText);
                    // ---

                } catch (pdfParseError: unknown) {
                    console.error('Error parsing PDF:', pdfParseError);
                    let message = 'Failed to parse PDF content.';
                    if (pdfParseError instanceof Error) {
                        message = `Failed to parse PDF: ${pdfParseError.message}`;
                    }
                    setError(message);
                } finally {
                    // Always run after try/catch
                    setIsParsing(false);
                    // Reset the input value AFTER processing (success or failure)
                    // This allows selecting the same file again if needed after an error
                    fileInput.value = '';
                }
            };

            reader.onerror = () => {
                setError("Error reading the selected file.");
                setIsParsing(false);
                fileInput.value = ''; // Reset input on reader error
            };

            reader.readAsArrayBuffer(file);

        } catch (setupError: unknown) {
            console.error('Error setting up file reader:', setupError);
            let message = "Error processing file.";
            if (setupError instanceof Error) {
                message = `Error processing file: ${setupError.message}`;
            }
            setError(message);
            setIsParsing(false);
            fileInput.value = ''; // Reset input on setup error
        }

    }, [onTextExtracted]); // Dependency array includes the callback

    return (
        // Main container card styling
        <div className="w-full p-4 border rounded-lg shadow-sm space-y-4 bg-card text-card-foreground">
            {/* Inner box for centering the upload elements */}
            <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 border-2 border-dashed border-muted rounded-lg hover:border-primary transition-colors duration-200 ease-in-out">
                {/* Label acts as the visible upload trigger */}
                <Label htmlFor="pdf-upload-label" className="text-center cursor-pointer space-y-2">
                    {/* Upload Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {/* Dynamic Text based on state */}
                    <span className="block text-lg font-semibold text-foreground">
                         {isParsing ? "Processing PDF..." : (fileName || "Click or drag PDF here")}
                    </span>
                     {/* Helper text */}
                     {!fileName && !isParsing && <span className="block text-sm text-muted-foreground">Max 10MB</span>}
                </Label>
                {/* The actual file input, visually hidden but linked by label's htmlFor */}
                <Input
                    id="pdf-upload-label" // Matches label's htmlFor
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isParsing}
                    className="sr-only" // Make it invisible but accessible
                />
                {/* Display selected filename below the button area */}
                {fileName && !isParsing && (
                     <p className="text-xs text-muted-foreground mt-2 text-center truncate w-full px-2">
                        Selected: <span className="font-medium">{fileName}</span>
                    </p>
                 )}
            </div>

            {/* Progress Bar Display (only shown when parsing) */}
            {isParsing && (
                <div className="space-y-1 pt-2">
                     <p className="text-sm font-medium text-muted-foreground text-center">
                         Parsing... {progress}%
                    </p>
                    <Progress value={progress} className="w-full h-2" />
                </div>
            )}

            {/* Error Display (only shown when an error exists) */}
            {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Removed the Textarea for displaying extractedText */}
            {/* The parent component that receives text via onTextExtracted is responsible for display */}

        </div>
    );
}