"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { AlethiumLogo } from "@/components/icons";

export default function AwaitingApprovalLayout({ children }: { children: ReactNode }) {
    const { loading, user } = useAuth();

    if (loading || !user) {
        return (
          <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
       <div className="flex items-center gap-2 mb-6">
        <AlethiumLogo />
        <h1 className="text-2xl font-bold font-headline text-foreground/80">
          AlethiumCore
        </h1>
      </div>
      {children}
    </main>
  );
}
