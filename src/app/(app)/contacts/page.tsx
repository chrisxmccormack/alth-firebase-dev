"use client";

import { useState, useEffect, useCallback } from "react";
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
      where("members", "array-contains", companyId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const userContacts = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Contact)
      );

      const connectedContacts = userContacts.filter(c => c.status === 'Connected');
      const unverifiedContacts = userContacts.filter(c => c.status === 'Unverified');
      
      const partnerCompanyIds = connectedContacts
        .map((c) =>
          c.companyAId === companyId ? c.companyBId : c.companyAId
        )
        .filter((id): id is string => !!id);

      let companiesMap = new Map<string, Company>();

      if (partnerCompanyIds.length > 0) {
        const uniquePartnerIds = [...new Set(partnerCompanyIds)];
        const companiesQuery = query(
          collection(firestore!, "companies"),
          where(documentId(), "in", uniquePartnerIds)
        );
        const companiesSnapshot = await getDocs(companiesQuery);
        companiesSnapshot.forEach((doc) => {
          companiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Company);
        });
      }

      const populatedConnectedContacts: PopulatedContact[] = connectedContacts
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

        const populatedUnverifiedContacts: PopulatedContact[] = unverifiedContacts
        .map(contact => {
          if (!contact.partnerCompanyDetails) return null;
          // Construct a Company-like object from the embedded details
          const partnerCompany: Company = {
            id: contact.id, // Use contact ID as a unique key for the row
            name: contact.partnerCompanyDetails.name,
            country: contact.partnerCompanyDetails.country,
            addressLine1: contact.partnerCompanyDetails.addressLine1,
            city: contact.partnerCompanyDetails.city,
            postcode: contact.partnerCompanyDetails.postcode,
            status: 'Approved', // Dummy status, not a real company
            createdAt: contact.createdAt,
          };
          return {
            id: contact.id,
            status: contact.status,
            relationship: contact.relationship,
            createdAt: contact.createdAt,
            partnerCompany,
          };
        })
        .filter((c): c is PopulatedContact => c !== null);
      
      const allContacts = [...populatedConnectedContacts, ...populatedUnverifiedContacts];
      allContacts.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());

      setContacts(allContacts);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching contacts:", error);
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
                  <TableHead>Status</TableHead>
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
                      <Badge variant={contact.status === 'Connected' ? 'secondary' : 'outline'}>{contact.status}</Badge>
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
