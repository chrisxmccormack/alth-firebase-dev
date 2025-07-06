"use client";

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4 border-b">
         <div className="flex items-center gap-2">
            <AlethiumLogo />
            <h1 className="text-xl font-bold font-headline text-foreground/80">
              AlethiumCore
            </h1>
         </div>
        <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Welcome!</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Hi {user?.displayName || user?.email}! You’re logged in.
          </p>
        </div>
      </main>
    </div>
  );
}
