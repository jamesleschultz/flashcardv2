
"use client";

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, UserCircle, LayoutDashboard, BrainCircuit } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    // Sticky header with background, blur, and bottom border
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Container limits width and centers content, added padding */}
      <div className="container flex h-16 items-center justify-between px-4 md:px-6"> {/* Increased height slightly, added padding */}

        {/* Left Side: Logo/Brand */}
        {/* Always visible, items centered */}
        <div className="flex items-center">
          <Link href={session ? "/dashboard" : "/"} className="flex items-center space-x-2">
             {/* Optional: Replace with your actual logo component/image */}
             <BrainCircuit className="h-6 w-6 text-primary" />
             {/* Renamed App Name */}
             <span className="font-bold text-lg sm:inline-block">Cardly</span>
          </Link>
          {/* Optional: Add main navigation links here if needed later */}
          {/* <nav className="hidden md:flex gap-6 ml-6">
             <Link href="/explore">Explore</Link>
          </nav> */}
        </div>

        {/* Right Side: User Info & Actions */}
        {/* Aligned to the end, items centered, spacing between items */}
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted"></div>
          )}

          {/* Authenticated State */}
          {status === 'authenticated' && session.user && (
            <>
              {/* User Name/Email - hidden on smaller screens */}
              <span className="hidden sm:inline-block text-sm font-medium text-muted-foreground truncate max-w-[150px]"> {/* Added truncate */}
                {session.user.name || session.user.email}
              </span>
               {/* Sign Out Button */}
               {/* Changed variant slightly */}
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 sm:mr-2" /> {/* Hide margin on small screens */}
                <span className="hidden sm:inline">Sign Out</span> {/* Hide text on small screens */}
              </Button>
            </>
          )}

          {/* Unauthenticated State */}
          {status === 'unauthenticated' && (
             <Button asChild variant="default" size="sm"> {/* Changed to default variant */}
                <Link href="/login">Login</Link>
             </Button>
          )}
        </div>
      </div>
    </header>
  );
}