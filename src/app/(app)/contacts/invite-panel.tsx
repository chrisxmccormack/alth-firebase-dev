
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { generateInviteLink } from "@/actions/contacts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check } from "lucide-react";

interface InviteContactPanelProps {
    onInviteCreated: () => void;
}

export function InviteContactPanel({ onInviteCreated }: InviteContactPanelProps) {
  const { userData } = useAuth();
  const { toast } = useToast();

  const [isBuyer, setIsBuyer] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [hasCopied, setHasCopied] = useState(false);

  const handleCreateInvite = async () => {
    if (!isBuyer && !isSeller) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select at least one relationship type (Buyer or Seller).",
      });
      return;
    }
    if (!userData?.companyId) {
        toast({ variant: "destructive", title: "Error", description: "Could not find your company." });
        return;
    }

    setIsLoading(true);
    try {
      const link = await generateInviteLink(userData.companyId, {
        buyer: isBuyer,
        seller: isSeller,
      });
      setInviteLink(link);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create invite",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>Invite a Contact</SheetTitle>
        <SheetDescription>
          Generate a unique link to invite a new business partner to connect.
        </SheetDescription>
      </SheetHeader>

      <div className="py-8 space-y-6">
        {inviteLink ? (
          <div className="space-y-4 text-center">
            <p className="font-semibold text-lg">Invite Link Ready!</p>
            <p className="text-sm text-muted-foreground">Share this link with your contact. It will expire in 30 days.</p>
            <div className="relative">
                <Input value={inviteLink} readOnly />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={handleCopy}>
                    {hasCopied ? <Check className="text-green-500" /> : <Copy />}
                </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium">Define Relationship</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="is-buyer">They are my Buyer</Label>
                  <p className="text-xs text-muted-foreground">
                    You sell goods or services to this company.
                  </p>
                </div>
                <Switch id="is-buyer" checked={isBuyer} onCheckedChange={setIsBuyer} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="is-seller">They are my Seller</Label>
                  <p className="text-xs text-muted-foreground">
                    You buy goods or services from this company.
                  </p>
                </div>
                <Switch id="is-seller" checked={isSeller} onCheckedChange={setIsSeller} />
              </div>
            </div>
          </>
        )}
      </div>

      <SheetFooter>
      {inviteLink ? (
          <Button onClick={onInviteCreated} className="w-full">Done</Button>
      ) : (
        <Button onClick={handleCreateInvite} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Invite Link
        </Button>
      )}
      </SheetFooter>
    </>
  );
}
