"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { AlethiumLogo } from "@/components/icons";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth!);
    router.push("/login");
  };

  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_SYSTEM_ADMIN_UID;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4 border-b">
         <div className="flex items-center gap-2">
            <AlethiumLogo />
            <h1 className="text-xl font-bold font-headline text-foreground/80">
              AlethiumCore
            </h1>
         </div>
         <div className="flex items-center gap-2">
            {isAdmin && (
                <Button asChild variant="ghost">
                    <Link href="/admin">Admin Panel</Link>
                </Button>
            )}
            <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
         </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Welcome!</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Hi {user?.displayName || user?.email}! You’re logged in.
          </p>
          <p className="mt-1 text-base text-muted-foreground">Your company is approved and you're all set.</p>
        </div>
      </main>
    </div>
  );
}
