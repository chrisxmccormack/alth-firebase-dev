
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  onSnapshot,
  where,
  documentId
} from "firebase/firestore";
import { useAuth } from "@/context/auth-context";
import { firestore } from "@/lib/firebase";
import type { Company } from "@/types";
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
import Loading from "./loading";
import Link from "next/link";

export default function ContactsPage() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    if (!userData?.companyId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    const companyId = userData.companyId;

    // Query all companies except the user's own
    const q = query(
      collection(firestore!, "companies"),
      where(documentId(), "!=", companyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allCompanies = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Company)
      );
      
      allCompanies.sort((a,b) => a.name.localeCompare(b.name));

      setCompanies(allCompanies);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching companies:", error);
        toast({
            variant: "destructive",
            title: "Error fetching companies",
            description: error.message,
        });
        setIsLoading(false);
    });

    return unsubscribe;
  }, [userData?.companyId, toast]);

  useEffect(() => {
    const unsubscribePromise = fetchCompanies();
    return () => {
      unsubscribePromise?.then((unsub) => unsub && unsub());
    };
  }, [fetchCompanies]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Company Directory</h1>
          <p className="text-muted-foreground">A list of all other companies on the platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Companies</CardTitle>
          <CardDescription>
            Browse other companies to trade with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">There are no other companies on the platform yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Website</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell>{company.country}</TableCell>
                    <TableCell>
                      {company.website ? (
                        <Link href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {company.website}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
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
