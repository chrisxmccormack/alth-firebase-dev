"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { AlethiumLogo } from "@/components/icons";

export default function CompanySetupLayout({ children }: { children: ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    }
    // If user already has a company, they shouldn't be here
    if (userData?.companyId) {
      router.push("/dashboard");
    }
  }, [user, userData, loading, router]);

  if (loading || !user || userData?.companyId) {
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
