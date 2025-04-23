"use client";

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import DeckList from "@/components/DeckList";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import FormComponent from './formcomponent';
import { LogOut, PlusCircle, FileUp } from "lucide-react";

interface Deck {
  id: string;
  name: string;
  description: string | null;
}

interface DashboardClientProps {
  initialDecks: Deck[];
  userId: string;
}

export default function DashboardClient({ initialDecks, userId }: DashboardClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    setDecks(initialDecks);
  }, [initialDecks]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleDeckActionComplete = () => {
    setIsCreateDialogOpen(false);
  }

  if (status === "loading") {
    return <div className="container mx-auto p-8 text-center">Loading Dashboard...</div>;
  }

  if (status === "unauthenticated") {
     router.push('/login');
     return <div className="container mx-auto p-8 text-center">Redirecting...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">

       {/* Header Section */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
          <div>
             <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
             <p className="text-md text-muted-foreground mt-1">
                Welcome back, {session?.user?.name || session?.user?.email || 'User'}! Manage your decks below.
             </p>
          </div>


          <div className="flex items-center gap-2">
             <Button asChild variant="secondary" size="sm">
                <Link href="/pdf-uploader">
                   <FileUp className="mr-2 h-4 w-4" />
                   Upload PDF
                </Link>
             </Button>

          </div>
       </div>

      <div className="text-left">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
               <Button>
                   <PlusCircle className="mr-2 h-4 w-4" />
                   Create New Deck
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create a New Deck</DialogTitle>
                <DialogDescription>Enter details for your new deck.</DialogDescription>
              </DialogHeader>
              <FormComponent
                  onDeckCreated={handleDeckActionComplete} 
              />
            </DialogContent>
          </Dialog>
      </div>

      <DeckList decks={decks} />
    </div>
  );
}