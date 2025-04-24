// src/components/FormComponent.tsx
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect } from "react"; // Removed unused useState

// --- Import React DOM hooks and Server Action ---
import { useFormState, useFormStatus } from 'react-dom';
// --- Import Action and State Type ---
import { createDeckAction, type DeckFormState } from '@/lib/actions'; // Adjust path

// Schema for client-side validation (names match form fields)
const formSchema = z.object({
  deckname: z.string().min(2, "Min 2 chars.").max(50, "Max 50 chars."),
  description: z.string().min(2, "Min 2 chars.").max(200, "Max 200 chars.").optional().or(z.literal("")),
});

// Submit button using useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Creating...' : 'Create Deck'}
    </Button>
  );
}

interface FormComponentProps {
  onDeckCreated: () => void; // Callback on success
}

export default function FormComponent({ onDeckCreated }: FormComponentProps) {
  // Setup react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { deckname: "", description: "" },
    mode: "onChange",
  });

  // --- Setup useFormState ---
  // Define initialState matching the FormState type from actions.ts
  const initialState: DeckFormState = {
      message: null,
      errors: null,
      status: 'idle' // Set initial status
  };
  // Pass the action and initialState
  const [state, formAction] = useFormState(createDeckAction, initialState);

  // --- Effect to handle action result ---
  useEffect(() => {
    // Check status from the server action's response
    if (state?.status === 'success') {
      console.log("Action Success:", state.message);
      form.reset(); // Clear form fields
      onDeckCreated(); // Trigger parent callback (e.g., close dialog)
    } else if (state?.status === 'error') {
      console.error("Action Error:", state.message);
      // Reset previous server errors first
      form.clearErrors();
      // Set field errors based on the response from the server action
      if (state.errors) {
          // Map 'name' error from Zod schema (in action) to 'deckname' field in form
          if (state.errors.name) {
               form.setError('deckname', { type: 'server', message: state.errors.name[0] });
          }
          // Map 'description' error
          if (state.errors.description) {
               form.setError('description', { type: 'server', message: state.errors.description[0] });
          }
      }
      // Display general message if no specific field errors were mapped/returned
      // (You could add a dedicated <p> tag below the form for this)
      // Example: setGeneralError(state.message);
    }
    // Intentionally don't reset status to idle here, let the next action call do that implicitly
    // if needed, or add manual reset logic elsewhere if required.
  }, [state, onDeckCreated, form]); // Dependencies


  return (
    <Form {...form}>
      {/* Pass formAction to the form's action prop */}
      <form action={formAction} className="space-y-4">
        {/* Form Fields remain the same */}
        <FormField
          control={form.control}
          name="deckname" // Matches FormData key expected by action via Zod schema
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deck Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., React Basics" {...field} />
              </FormControl>
              <FormDescription> Min 2, Max 50 chars. </FormDescription>
              <FormMessage /> {/* Shows react-hook-form errors (client & server) */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description" // Matches FormData key expected by action via Zod schema
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Key concepts..." {...field} />
              </FormControl>
              <FormDescription> Max 200 chars. </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display general server errors ONLY if no field errors were mapped */}
        {state?.status === 'error' && !state.errors && state.message && (
             <p className="text-sm font-medium text-destructive">{state.message}</p>
        )}

        {/* Submit button using useFormStatus */}
        <SubmitButton />
      </form>
    </Form>
  );
}