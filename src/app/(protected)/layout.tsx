import React from 'react';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar'; 

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);


  if (!session?.user?.id) {
    console.log("Protected Layout: No valid session found. Redirecting to /login.");
    redirect('/login'); 

  }

  // --- User is Authenticated ---
  console.log(`Protected Layout: User ${session.user.id} authenticated. Rendering layout.`);
  return (
    <div className="flex flex-col min-h-screen"> 
      <Navbar />
      <main className="flex-grow"> 
        {children}
      </main>

    </div>
  );
}