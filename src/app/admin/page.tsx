
"use client";

import { useState, useEffect, useCallback } from "react";
import { firestore } from "@/lib/firebase";
import { collection, query, where, doc, writeBatch, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/types";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const [pendingCompanies, setPendingCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingCompanies = useCallback(async () => {
    setIsLoading(true);
    const q = query(collection(firestore!, "companies"), where("status", "==", "Pending"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const companies: Company[] = [];
        querySnapshot.forEach((doc) => {
            companies.push({ id: doc.id, ...doc.data() } as Company);
        });
        setPendingCompanies(companies);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching pending companies:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch companies." });
        setIsLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchPendingCompanies();
    return () => {
        unsubscribe.then(unsub => unsub());
    }
  }, [fetchPendingCompanies]);


  const handleApprove = async (companyId: string, ownerUid: string | null | undefined) => {
    if (!ownerUid) {
      toast({ variant: "destructive", title: "Error", description: "Company has no owner and cannot be approved." });
      return;
    }
    
    try {
      const batch = writeBatch(firestore!);

      const companyRef = doc(firestore!, "companies", companyId);
      batch.update(companyRef, { status: "Approved" });

      const userRef = doc(firestore!, "users", ownerUid);
      batch.update(userRef, { companyIsApproved: true });

      await batch.commit();
      toast({ title: "Success", description: "Company has been approved." });
    } catch (error: any) {
      console.error("Error approving company:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not approve company." });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Company Approvals</CardTitle>
        <CardDescription>Review and approve new company registrations.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : pendingCompanies.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No pending companies.</p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Owner Email</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Registered On</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.ownerEmail}</TableCell>
                <TableCell>{company.country}</TableCell>
                <TableCell>
                  {company.createdAt?.toDate().toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleApprove(company.id, company.ownerUid)}>Approve</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
