"use client";

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from "@/components/ui/button"; 
import { LogOut, BrainCircuit, LogInIcon } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="w-full border-b">

      <div className="container mx-auto px-4 py-3 flex items-center">


        <div className="flex-shrink-0">
          <Link href={session ? "/dashboard" : "/"} className="flex items-center">
             <BrainCircuit className="h-6 w-6" />
             <span className="font-bold ml-2">Cardly</span>
          </Link>
        </div>

        <div className="flex-grow" />
        <div className="flex items-center space-x-3 flex-shrink-0">
            {status === 'loading' && (
               <span className="text-sm text-muted-foreground">Loading...</span>
            )}

            {status === 'authenticated' && session.user && (
               <>
                 <span className="text-sm text-muted-foreground hidden sm:inline"> 
                   {session.user.name || session.user.email}
                 </span>

                 <Button onClick={handleSignOut} variant="ghost" size="sm">
                    <LogOut className="h-4 w-4 sm:mr-1.5"/>
                    <span className="hidden sm:inline">Sign Out</span>
                 </Button>
               </>
            )}

            {status === 'unauthenticated' && (
               <Button asChild variant="link" size="sm">
                  <Link href="/login" className="flex items-center">
                     <LogInIcon className="h-4 w-4 mr-1.5"/> 
                     Login
                  </Link>
               </Button>
            )}
        </div>

      </div>
    </header>
  );
}