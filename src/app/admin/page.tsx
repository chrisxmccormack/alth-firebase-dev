
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { firestore } from "@/lib/firebase";
import { collection, query, orderBy, doc, writeBatch, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Company } from "@/types";
import { Loader2 } from "lucide-react";
import { updateCompanyAdminDetails } from "@/actions/companies";

// Preprocess empty strings or nulls to undefined for optional number fields
const numberPreprocess = (val: any) => (val === "" || val === null ? undefined : val);

const adminCompanySchema = z.object({
  creditLimit: z.preprocess(numberPreprocess, z.number({ coerce: true }).optional()),
  creditUsage: z.preprocess(numberPreprocess, z.number({ coerce: true }).optional()),
  rate14day: z.preprocess(numberPreprocess, z.number({ coerce: true }).optional()),
  rate30day: z.preprocess(numberPreprocess, z.number({ coerce: true }).optional()),
  rate60day: z.preprocess(numberPreprocess, z.number({ coerce: true }).optional()),
});

type AdminCompanyFormValues = z.infer<typeof adminCompanySchema>;

export default function AdminPage() {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<AdminCompanyFormValues>({
    resolver: zodResolver(adminCompanySchema),
    defaultValues: {
      creditLimit: undefined,
      creditUsage: undefined,
      rate14day: undefined,
      rate30day: undefined,
      rate60day: undefined,
    }
  });

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

  const selectedCompany = allCompanies.find(c => c.id === selectedCompanyId);
  
  useEffect(() => {
    if (selectedCompany) {
      form.reset({
        creditLimit: selectedCompany.creditLimit ?? undefined,
        creditUsage: selectedCompany.creditUsage ?? undefined,
        rate14day: selectedCompany.rate14day ?? undefined,
        rate30day: selectedCompany.rate30day ?? undefined,
        rate60day: selectedCompany.rate60day ?? undefined,
      });
    }
  }, [selectedCompany, form]);


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

  const onSubmitAdminDetails = async (data: AdminCompanyFormValues) => {
    if (!selectedCompanyId) return;
    setIsSaving(true);
    const result = await updateCompanyAdminDetails(selectedCompanyId, data);
    if (result.success) {
      toast({ title: "Success", description: "Company details have been updated." });
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSaving(false);
  };
  
  const pendingCompanies = allCompanies.filter(c => c.status === "Pending");

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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitAdminDetails)} className="mt-6 p-4 border rounded-md bg-muted/50 space-y-6">
                <h3 className="font-medium text-lg mb-4">Admin Fields for {selectedCompany.name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Limit</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="creditUsage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Usage</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="rate14day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>14 Day Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0.0" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="rate30day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>30 Day Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0.0" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="rate60day"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>60 Day Rate (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0.0" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
