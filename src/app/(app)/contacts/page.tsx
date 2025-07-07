"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  documentId,
} from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import { firestore } from "@/lib/firebase";
import type { Company, Contact, PopulatedContact } from "@/types";

import { Button } from "@/components/ui/button";
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
import { PlusCircle, UserPlus } from "lucide-react";
import Loading from "./loading";

export default function ContactsPage() {
  const { userData } = useAuth();
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
      where("status", "==", "Connected"),
      where("companyAId", "==", companyId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allContacts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Contact)
      );

      const q2 = query(
        collection(firestore!, "contacts"),
        where("status", "==", "Connected"),
        where("companyBId", "==", companyId),
      );
      const snapshot2 = await getDocs(q2);
      const contactsAsB = snapshot2.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Contact)
      );
      
      const userContacts = [...allContacts, ...contactsAsB].filter(
          c => c.companyAId === companyId || c.companyBId === companyId
      );

      const partnerCompanyIds = userContacts
        .map((c) =>
          c.companyAId === companyId ? c.companyBId : c.companyAId
        )
        .filter((id): id is string => !!id);

      if (partnerCompanyIds.length === 0) {
        setContacts([]);
        setIsLoading(false);
        return;
      }
      
      const uniquePartnerIds = [...new Set(partnerCompanyIds)];

      const companiesQuery = query(
        collection(firestore!, "companies"),
        where(documentId(), "in", uniquePartnerIds)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      const companiesMap = new Map<string, Company>();
      companiesSnapshot.forEach((doc) => {
        companiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Company);
      });

      const populatedContacts: PopulatedContact[] = userContacts
        .map((contact) => {
          const partnerId =
            contact.companyAId === companyId
              ? contact.companyBId
              : contact.companyAId;
          if (!partnerId) return null;

          const partnerCompany = companiesMap.get(partnerId);
          if (!partnerCompany) return null;

          return {
            id: contact.id,
            status: contact.status,
            relationship: contact.relationship,
            createdAt: contact.createdAt,
            partnerCompany,
          };
        })
        .filter((c): c is PopulatedContact => c !== null);

      setContacts(populatedContacts);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [userData?.companyId]);

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
        <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/contacts/new">
                <PlusCircle className="mr-2" />
                Invite
              </Link>
            </Button>
            <Button asChild>
              <Link href="/contacts/new">
                <UserPlus className="mr-2" />
                Create
              </Link>
            </Button>
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
              <Button variant="link" asChild>
                <Link href="/contacts/new">Invite your first contact</Link>
              </Button>
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
                      {contact.createdAt.toDate().toLocaleDateString()}
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
