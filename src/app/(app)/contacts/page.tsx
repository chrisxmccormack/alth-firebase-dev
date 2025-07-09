
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import { firestore } from "@/lib/firebase";
import type { PopulatedContact } from "@/types";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Loading from "./loading";

export default function ContactsPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<PopulatedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getRelationshipType = (contact: PopulatedContact) => {
    const { buyer, seller } = contact.relationship;
    if (buyer && seller) return "Buyer & Seller";
    if (buyer) return "Buyer";
    if (seller) return "Seller";
    return "N/A";
  };

  const fetchContacts = useCallback(async () => {
    if (!userData?.companyId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    const companyId = userData.companyId;

    const q = query(
      collection(firestore!, "contacts"),
      where("members", "array-contains", companyId),
      where("status", "==", "Connected")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const populatedContacts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as PopulatedContact)
      );
      
      // Safer sorting
      populatedContacts.sort((a,b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      setContacts(populatedContacts);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching contacts:", error);
        toast({
            variant: "destructive",
            title: "Error fetching contacts",
            description: error.message,
        });
        setIsLoading(false);
    });

    return unsubscribe;
  }, [userData?.companyId, toast]);

  useEffect(() => {
    const unsubscribePromise = fetchContacts();
    return () => {
      unsubscribePromise?.then((unsub) => unsub && unsub());
    };
  }, [fetchContacts]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Contacts</h1>
          <p className="text-muted-foreground">Manage your business connections.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Connections</CardTitle>
          <CardDescription>
            A list of all companies you are connected with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">You have no connections yet.</p>
              <p className="text-sm text-muted-foreground">Contacts can be added manually in the Firebase Console.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Relationship</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Connected On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.partnerCompany.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getRelationshipType(contact)}</Badge>
                    </TableCell>
                    <TableCell>{contact.partnerCompany.country}</TableCell>
                    <TableCell>
                      {contact.createdAt?.toDate ? contact.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
