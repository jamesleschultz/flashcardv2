import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from 'next/navigation';
import prisma from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }
  const userId = session.user.id;


  const decks = await prisma.deck.findMany({ where: { userId } });


  return (
    <div>
      <DashboardClient initialDecks={decks} userId={userId} />;
    </div>
  );
}