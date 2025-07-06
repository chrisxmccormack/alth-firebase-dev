
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { validateInvite, acceptInvite } from "@/actions/contacts";
import type { Company, Contact } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Handshake } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, userData, loading: authLoading } = useAuth();

  const [status, setStatus] = useState<"loading" | "error" | "success" | "prompt">("loading");
  const [error, setError] = useState<string | null>(null);
  const [invitingCompany, setInvitingCompany] = useState<Company | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setError("No invite token provided.");
      setStatus("error");
      return;
    }
    
    if (!user) {
        // Save the token and redirect to login
        const loginUrl = `/login?redirect=/accept-invite?token=${token}`;
        router.push(loginUrl);
        return;
    }

    if (!userData?.companyId) {
        // User is logged in but has no company
        toast({ variant: 'destructive', title: 'Company required', description: 'Please complete company setup to accept an invite.'});
        router.push('/company-setup');
        return;
    }

    const processInvite = async () => {
      const result = await validateInvite(token);
      if (result.error || !result.data) {
        setError(result.error || "Failed to validate invite.");
        setStatus("error");
      } else {
        setInvitingCompany(result.data.invitingCompany);
        if (result.data.invitingCompany.id === userData.companyId) {
            setError("You cannot accept an invitation from your own company.");
            setStatus("error");
        } else {
            setStatus("prompt");
        }
      }
    };

    processInvite();
  }, [token, user, userData, authLoading, router, toast]);

  const handleAccept = async () => {
    if (!token || !userData?.companyId) return;
    setStatus("loading");
    const result = await acceptInvite(token, userData.companyId);
    if (result.success) {
      setStatus("success");
      toast({ title: "Success!", description: "You are now connected." });
    } else {
      setError(result.error || "An unknown error occurred.");
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Validating Invite</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><XCircle className="text-destructive"/> Invite Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full" variant="outline"><Link href="/dashboard">Go to Dashboard</Link></Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "success") {
    return (
        <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2"><CheckCircle className="text-green-500"/> Connection Established!</CardTitle>
          <CardDescription>You are now connected with {invitingCompany?.name}.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">You can now view them in your contacts list.</p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full"><Link href="/contacts">View Contacts</Link></Button>
        </CardFooter>
      </Card>
    );
  }

  if (status === "prompt") {
    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader>
            <CardTitle className="text-2xl font-headline">You're Invited!</CardTitle>
            <CardDescription>
                <span className="font-semibold">{invitingCompany?.name}</span> has invited you to connect.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <Handshake className="h-16 w-16 mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">
                    By accepting, you agree to share your company profile information with {invitingCompany?.name}.
                </p>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button className="w-full" onClick={handleAccept}>Accept Invitation</Button>
                <Button className="w-full" variant="ghost" asChild><Link href="/dashboard">Decline</Link></Button>
            </CardFooter>
        </Card>
    )
  }

  return null;
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center py-8"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <AcceptInviteContent />
        </Suspense>
    )
}
