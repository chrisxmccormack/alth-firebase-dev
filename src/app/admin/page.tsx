
"use client";

import { useState, useEffect, useCallback } from "react";
import { firestore } from "@/lib/firebase";
import { collection, query, orderBy, doc, writeBatch, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/types";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    const q = query(collection(firestore!, "companies"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const companies: Company[] = [];
        querySnapshot.forEach((doc) => {
            companies.push({ id: doc.id, ...doc.data() } as Company);
        });
        setAllCompanies(companies);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching companies:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch companies." });
        setIsLoading(false);
    });

    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    const unsubscribe = fetchCompanies();
    return () => {
        unsubscribe.then(unsub => unsub && unsub());
    }
  }, [fetchCompanies]);


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
  
  const pendingCompanies = allCompanies.filter(c => c.status === "Pending");
  const selectedCompany = allCompanies.find(c => c.id === selectedCompanyId);

  return (
    <div className="space-y-8">
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

      <Card>
        <CardHeader>
          <CardTitle>Manage Company Details</CardTitle>
          <CardDescription>Select a company to view or edit admin-only fields.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select onValueChange={setSelectedCompanyId} value={selectedCompanyId}>
              <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Select a company..." />
              </SelectTrigger>
              <SelectContent>
                  {allCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                          {company.name}
                      </SelectItem>
                  ))}
              </SelectContent>
          </Select>

          {selectedCompany && (
              <div className="mt-6 p-4 border rounded-md bg-muted/50">
                  <h3 className="font-medium text-lg">Admin Fields for {selectedCompany.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                      Admin-only fields for this company will be added here.
                  </p>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
