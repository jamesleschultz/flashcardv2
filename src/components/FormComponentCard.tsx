"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase-config';
import { useState, useEffect } from "react"; // Import useEffect

// --- Define Flashcard type used for initialData ---
interface Flashcard {
  id: string;
  question: string;
  answer: string;
  deckId: string;
  userId?: string;
}

// Schema remains the same
const formSchema = z.object({
    question: z.string().min(2, "Question must be >= 2 chars.").max(200, "Question must be <= 200 chars."),
    answer: z.string().min(2, "Answer must be >= 2 chars.").max(500, "Answer must be <= 500 chars."),
})

// --- Updated Props Interface ---
interface FormComponentCardProps {
  deckId: string;
  mode: 'create' | 'edit'; // Determine form behavior
  initialData?: Flashcard | null; // Optional data for editing
  onActionComplete: () => void; // Generic callback for success (create or update)
}

export default function FormComponentCard({
    deckId,
    mode,
    initialData = null, // Default to null if not provided
    onActionComplete
}: FormComponentCardProps) {

    const [user, userLoading, userError] = useAuthState(auth);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Initialize the form
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        // Set defaultValues based on mode and initialData
        defaultValues: {
            question: initialData?.question || "",
            answer: initialData?.answer || "",
        },
    });

    // --- Effect to reset form when initialData changes (for editing) ---
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            console.log("Resetting form with initial data:", initialData);
            form.reset({
                question: initialData.question,
                answer: initialData.answer,
            });
        } else if (mode === 'create') {
             console.log("Resetting form for create mode");
             form.reset({ question: "", answer: ""}); // Ensure form is clear for create
        }
        // Reset errors when mode/data changes
        setSubmitError(null);
    // Depend on initialData (or its ID) and mode to trigger reset
    }, [mode, initialData, form]);


    // --- onSubmit Handler (handles both create and update) ---
    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Auth checks remain the same
        if (userLoading) { setSubmitError("Verifying..."); return; }
        if (userError) { setSubmitError(`Auth error: ${userError.message}`); return; }
        if (!user?.uid) { setSubmitError('Please log in.'); return; }
        if (!deckId) { setSubmitError('Internal Error: Deck ID missing.'); return; }
        if (mode === 'edit' && !initialData?.id) { setSubmitError('Internal Error: Flashcard ID missing for edit.'); return;}


        setIsSubmitting(true);
        setSubmitError(null);

        const commonData = {
            question: values.question.trim(),
            answer: values.answer.trim(),
            userId: user.uid,
        };

        try {
            let response;
            if (mode === 'edit') {
                // --- UPDATE Logic ---
                const updateData = {
                    ...commonData,
                    flashcardId: initialData!.id, // Use non-null assertion as we checked above
                };
                console.log('Submitting flashcard UPDATE data:', updateData);
                response = await axios.put('/api/flashcard', updateData); // Use PUT
                console.log('Flashcard updated successfully:', response.data);

            } else {
                // --- CREATE Logic ---
                const createData = {
                    ...commonData,
                    deckId: deckId,
                };
                console.log('Submitting flashcard CREATE data:', createData);
                response = await axios.post('/api/flashcard', createData); // Use POST
                console.log('Flashcard created successfully:', response.data);
            }

            form.reset(); // Reset form on success for both modes
            onActionComplete(); // Call the generic success callback

        } catch (error: any) {
            console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} flashcard:`, error.response?.data || error.message);
            const apiErrorMessage = error.response?.data?.message;
            const displayError = apiErrorMessage || `Failed to ${mode === 'edit' ? 'update' : 'create'} flashcard.`;
            setSubmitError(`Error: ${displayError}`);
        } finally {
            setIsSubmitting(false);
        }
      }

      // Determine button text based on mode
      const buttonText = mode === 'edit' ? 'Update Flashcard' : 'Create Flashcard';
      const submittingText = mode === 'edit' ? 'Updating...' : 'Creating...';

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Question Field */}
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question *</FormLabel>
                  <FormControl>
                    <Textarea
                         placeholder="e.g., What is the main purpose of useEffect?"
                         {...field}
                         disabled={isSubmitting || userLoading}
                         rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Answer Field */}
             <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer *</FormLabel>
                  <FormControl>
                     <Textarea
                         placeholder="e.g., To perform side effects..."
                         {...field}
                         disabled={isSubmitting || userLoading}
                         rows={5}
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Errors */}
            {submitError && <p className="text-sm font-medium text-destructive">{submitError}</p>}
            {userLoading && <p className="text-sm text-muted-foreground">Checking auth...</p>}

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting || userLoading || !user} className="w-full">
              {isSubmitting ? submittingText : buttonText}
            </Button>
          </form>
        </Form>
      )
}