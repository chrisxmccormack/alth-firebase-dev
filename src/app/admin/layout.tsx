"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlethiumLogo } from "@/components/icons";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_SYSTEM_ADMIN_UID;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
        <Button asChild className="mt-4">
            <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
       <header className="flex items-center justify-between p-4 border-b">
         <div className="flex items-center gap-2">
            <AlethiumLogo />
            <h1 className="text-xl font-bold font-headline text-foreground/80">
              Admin Panel
            </h1>
         </div>
         <Button asChild variant="outline">
            <Link href="/dashboard">Exit Admin</Link>
         </Button>
      </header>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
