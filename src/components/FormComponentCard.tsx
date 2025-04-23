// src/components/FormComponentCard.tsx
"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useTransition } from "react";

// --- Import Server Actions ---
import { createFlashcardAction, updateFlashcardAction } from '@/lib/actions'; // Adjust path

// Type used within the component
interface Flashcard { id: string; question: string; answer: string; deckId: string; userId?: string; }

// Schema for validation
const formSchema = z.object({
    question: z.string().min(2, "Min 2 chars").max(200, "Max 200 chars"),
    answer: z.string().min(2, "Min 2 chars").max(500, "Max 500 chars"),
});

interface FormComponentCardProps {
  deckId: string; // Required for 'create' mode
  mode: 'create' | 'edit';
  initialData?: Flashcard | null; // Optional for 'edit' mode
  onActionComplete: () => void; // Callback on success
}

export default function FormComponentCard({ deckId, mode, initialData = null, onActionComplete }: FormComponentCardProps) {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            question: initialData?.question || "",
            answer: initialData?.answer || "",
        },
    });

    // Effect to reset form when switching modes or editing different cards
    useEffect(() => {
        form.reset({
            question: initialData?.question || "",
            answer: initialData?.answer || "",
        });
        setSubmitError(null); // Clear previous errors
    }, [mode, initialData, form]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        setSubmitError(null); // Clear previous errors on new submission attempt

        const formData = new FormData();
        formData.append('question', values.question.trim());
        formData.append('answer', values.answer.trim());

        // Append IDs based on mode
        if (mode === 'edit') {
            if (!initialData?.id) {
                setSubmitError('Internal Error: Missing flashcard ID for edit.');
                return; // Prevent submission
            }
            formData.append('flashcardId', initialData.id);
        } else {
            formData.append('deckId', deckId);
        }

        startTransition(async () => {
            const action = mode === 'edit' ? updateFlashcardAction : createFlashcardAction;
            const result = await action(formData);

            if (result.status === 'error') {
                // Handle Zod errors specifically if they exist
                 if (result.errors) {
                    Object.entries(result.errors).forEach(([field, messages]) => {
                         if (field === 'question' || field === 'answer') { // Check if field exists in form
                             form.setError(field as 'question' | 'answer', {
                                type: 'server', message: (messages as string[])[0] ?? 'Invalid'
                             });
                         }
                    });
                 }
                // Set general error message regardless of specific field errors
                setSubmitError(result.message);
            } else {
                // Success!
                onActionComplete(); // Close dialog / trigger parent callback
                // Form reset is handled by useEffect when dialog closes / mode changes
            }
        });
      }

      const buttonText = mode === 'edit' ? 'Update Flashcard' : 'Create Flashcard';
      const submittingText = mode === 'edit' ? 'Updating...' : 'Creating...';

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="question" render={({ field }) => (
                <FormItem>
                    <FormLabel>Question *</FormLabel>
                    <FormControl><Textarea {...field} disabled={isPending} rows={3}/></FormControl>
                    <FormMessage />
                </FormItem>
            )}/>
            <FormField control={form.control} name="answer" render={({ field }) => (
                 <FormItem>
                    <FormLabel>Answer *</FormLabel>
                    <FormControl><Textarea {...field} disabled={isPending} rows={5}/></FormControl>
                    <FormMessage />
                 </FormItem>
             )}/>

            {submitError && <p className="text-sm font-medium text-destructive">{submitError}</p>}

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? submittingText : buttonText}
            </Button>
          </form>
        </Form>
      );
}