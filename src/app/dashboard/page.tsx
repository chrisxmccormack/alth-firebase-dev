
"use client";

import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <div className="text-left">
        <h1 className="text-4xl font-bold font-headline">Welcome!</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Hi {user?.displayName || user?.email}! You’re logged in.
        </p>
        <p className="mt-1 text-base text-muted-foreground">Your company is approved and you're all set.</p>
      </div>
    </div>
  );
}
