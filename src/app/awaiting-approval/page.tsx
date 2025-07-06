"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { firestore } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Company } from "@/types";

export default function AwaitingApprovalPage() {
  const router = useRouter();
  const { userData, loading } = useAuth();

  useEffect(() => {
    if (loading || !userData) return;

    if (!userData.companyId) {
      // Should not happen if routed correctly, but as a safeguard:
      router.push("/company-setup");
      return;
    }

    const companyRef = doc(firestore!, "companies", userData.companyId);
    const unsubscribe = onSnapshot(companyRef, (docSnap) => {
      if (docSnap.exists()) {
        const companyData = docSnap.data() as Company;
        if (companyData.status === "Approved") {
          router.push("/dashboard");
        }
      } else {
        // Company deleted or error, send back to setup
        router.push("/company-setup");
      }
    });

    return () => unsubscribe();
  }, [userData, loading, router]);

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Application Received</CardTitle>
        <CardDescription>Your company profile is pending approval.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
                We are reviewing your submission. You will be redirected automatically
                once your account is approved.
            </p>
            <p className="text-sm text-muted-foreground">This can take up to 24 hours.</p>
        </div>
      </CardContent>
    </Card>
  );
}
