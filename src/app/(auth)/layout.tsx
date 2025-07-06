import type { ReactNode } from "react";
import { AlethiumLogo } from "@/components/icons";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex items-center gap-2 mb-6">
        <AlethiumLogo />
        <h1 className="text-2xl font-bold font-headline text-foreground/80">
          AlethiumCoreAuth
        </h1>
      </div>
      {children}
    </main>
  );
}
