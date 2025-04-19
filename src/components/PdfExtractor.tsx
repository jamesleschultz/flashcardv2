// src/components/PdfTextExtractorClient.tsx
"use client";

import React, { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; // For visual feedback
import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Textarea } from '@/components/ui/textarea'; // To display text

// Specify the worker source for pdf.js
// Adjust the path based on where pdf.js worker ends up in your build output (usually node_modules)
// Try this path first, may need adjustment depending on your bundler/framework setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
// Alternative if serving from node_modules (might require bundler config):
// pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';


interface PdfTextExtractorClientProps {
    // Callback function to pass the extracted text up to the parent
    onTextExtracted: (text: string) => void;
}

export default function PdfTextExtractorClient({ onTextExtracted }: PdfTextExtractorClientProps) {
    const [extractedText, setExtractedText] = useState<string>("");
    const [isParsing, setIsParsing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [progress, setProgress] = useState(0); // Progress percentage

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            setError("No file selected.");
            return;
        }

        // Basic validation
        if (file.type !== "application/pdf") {
            setError("Invalid file type. Please select a PDF.");
            setFileName("");
            // Reset file input value to allow re-selection of the same file if needed
            event.target.value = '';
            return;
        }

        // Optional: Add a size limit (e.g., 10MB)
        const maxSize = 10 * 1024 * 1024; // 10 MB in bytes
        if (file.size > maxSize) {
            setError(`File is too large (Max: ${maxSize / 1024 / 1024} MB).`);
            setFileName("");
            event.target.value = '';
            return;
        }

        setFileName(file.name);
        setError(null);
        setIsParsing(true);
        setExtractedText(""); // Clear previous text
        setProgress(0);

        try {
            const reader = new FileReader();

            reader.onload = async (e) => {
                if (!e.target?.result) {
                    setError("Failed to read file.");
                    setIsParsing(false);
                    return;
                }

                try {
                    const typedArray = new Uint8Array(e.target.result as ArrayBuffer);

                    // Load the PDF document
                    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
                    const pdf = await loadingTask.promise;
                    console.log('PDF loaded');

                    let fullText = '';
                    setProgress(10); // Initial progress after loading

                    // Iterate through each page
                    for (let i = 1; i <= pdf.numPages; i++) {
                        console.log(`Processing page ${i} of ${pdf.numPages}`);
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();

                        // Join text items with spaces
                        const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
                        fullText += pageText + '\n\n'; // Add double newline between pages

                        // Update progress roughly based on pages processed
                        setProgress(10 + Math.round((i / pdf.numPages) * 80));
                    }

                    console.log("Text extraction complete. Length:", fullText.length);
                    setExtractedText(fullText);
                    setProgress(100);
                    // --- IMPORTANT: Pass text to parent component ---
                    onTextExtracted(fullText);
                    // ---

                } catch (pdfError: any) {
                    console.error('Error parsing PDF:', pdfError);
                    setError(`Failed to parse PDF: ${pdfError.message || 'Unknown error'}`);
                } finally {
                    setIsParsing(false);
                    // Reset file input value after processing
                    event.target.value = '';
                }
            };

            reader.onerror = () => {
                setError("Error reading file.");
                setIsParsing(false);
                 event.target.value = '';
            };

             // Start reading the file as ArrayBuffer
            reader.readAsArrayBuffer(file);

        } catch (err: any) {
            console.error('Error setting up file reader:', err);
            setError(`Error processing file: ${err.message}`);
            setIsParsing(false);
             event.target.value = '';
        }

    }, [onTextExtracted]); // Add onTextExtracted dependency

    return (
        <div className="w-full p-4 border rounded-lg shadow-sm space-y-4 bg-card text-card-foreground flex items-center justify-center">
            <div className="flex flex-col items-center justify-center w-full max-w-md p-6 border rounded-lg shadow-md bg-card text-card-foreground space-y-4">
                <Label htmlFor="pdf-upload" className="text-lg font-semibold">
                    Upload Your PDF
                </Label>
                <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={isParsing}
                    className="hidden" // Hide the default file input
                />
                <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-primary rounded-lg shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isParsing ? "Processing..." : "Choose File"}
                </label>
                {fileName && !isParsing && (
                    <p className="text-sm text-muted-foreground mt-2">
                        Selected File: <span className="font-medium">{fileName}</span>
                    </p>
                )}
            </div>

            {isParsing && (
                <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-muted-foreground text-center animate-pulse">
                        Parsing PDF... ({progress}%)
                    </p>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

        </div>
    );
}