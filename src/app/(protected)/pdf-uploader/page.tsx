'use client';

import PdfTextExtractorClient from "@/components/PdfExtractor";
import { useState } from "react";
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft} from "lucide-react";
export default function PdfUploaderPage() {
    const [extractedPdfText, setExtractedPdfText] = useState<string | null>(null);
    const router = useRouter();

    const handlePdfTextExtracted = (text: string) => {
        console.log("Received extracted text in parent. Length:", text.length);
        setExtractedPdfText(text);
    };

    return (
        <div className="container mx-auto p-4 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">PDF Uploader</h1>
                    <p className="text-md text-muted-foreground mt-1">
                    Upload a PDF file to extract its text content.                    
                    </p>
                </div>
                <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
                </Button>
            </div>

            {/* PDF Upload Section */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Extract Text from PDF</h2>
                <p className="text-sm text-muted-foreground">
                    Select a PDF file to extract its text content. The text will be displayed below.
                </p>
                <PdfTextExtractorClient onTextExtracted={handlePdfTextExtracted} />
                <hr className="border-muted" /> {/* Separating line */}
            </div>

            {/* Extracted Text Section */}
            {extractedPdfText && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Extracted Text</h2>
                    <Textarea
                        readOnly
                        value={extractedPdfText}
                        className="h-40 text-sm bg-muted/50"
                    />
                    <div className="text-center">
                        <Button onClick={() => setExtractedPdfText(null)}>
                            Clear Extracted Text
                        </Button>
                    </div>
                    <hr className="border-muted" /> {/* Separating line */}
                </div>
            )}

        </div>
    );
}