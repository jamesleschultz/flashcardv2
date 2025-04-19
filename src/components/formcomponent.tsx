"use client"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import axios from "axios"
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/config/firebase-config';
import { useState } from "react"; // Import useState

// Define the schema (you might want description optional)
const formSchema = z.object({
  deckname: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  // Make description optional and allow empty string, but validate length if provided
  description: z.string().min(2, "Description must be at least 2 characters.").max(200, "Description cannot exceed 200 characters.").optional().or(z.literal("")),
})

// Define props including the callback
interface FormComponentProps {
  onDeckCreated: () => void; // Callback function
}

export default function FormComponent({ onDeckCreated }: FormComponentProps) {
  const [user, userLoading, userError] = useAuthState(auth); // Use specific names
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deckname: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Ensure user is loaded and authenticated before submitting
    if (userLoading) {
        setSubmitError("Verifying user...");
        return;
    }
    if (userError) {
        setSubmitError(`Authentication error: ${userError.message}`);
        return;
    }
     if (!user?.uid) {
      console.error('User is not authenticated. Cannot create deck.');
      setSubmitError('You must be logged in to create a deck.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const deckData = {
      name: values.deckname,
      description: values.description || null, // Send null if description is empty/undefined
      userId: user.uid,
    };
    console.log('Submitting deck data:', deckData);

    try {
        const response = await axios.post('/api/deck', deckData);
        console.log('Deck created successfully:', response.data);
        form.reset(); // Clear the form
        onDeckCreated(); // <-- Call the callback function passed from Dashboard
    } catch (error: any) {
        console.error('Error creating deck:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Failed to create deck. Please try again.';
        setSubmitError(`Error: ${errorMessage}`);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      {/* Use async version of handleSubmit if needed, but standard usually works */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"> {/* Reduced space */}
        <FormField
          control={form.control}
          name="deckname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deck Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., React Basics" {...field} disabled={isSubmitting || userLoading} />
              </FormControl>
              <FormDescription>
                Choose a clear name (2-50 chars).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Key concepts for beginners" {...field} disabled={isSubmitting || userLoading} />
              </FormControl>
              <FormDescription>
                Add a short description (2-200 chars).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display submission errors */}
        {submitError && <p className="text-sm font-medium text-destructive">{submitError}</p>}
        {userLoading && <p className="text-sm text-muted-foreground">Checking auth...</p>}

        <Button type="submit" disabled={isSubmitting || userLoading || !user} className="w-full">
          {isSubmitting ? 'Creating...' : 'Create Deck'}
        </Button>
      </form>
    </Form>
  )
}