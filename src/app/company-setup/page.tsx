
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { firestore, storage } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const companySchema = z.object({
  name: z.string().min(2, { message: "Company name is required." }),
  addressLine1: z.string().min(2, { message: "Address is required." }),
  addressLine2: z.string().optional(),
  city: z.string().min(2, { message: "City is required." }),
  postcode: z.string().min(2, { message: "Postcode is required." }),
  country: z.string().min(2, { message: "Country is required." }),
  vatId: z.string().optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  logo: z.any().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const countries = [
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
];

export default function CompanySetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "", addressLine1: "", addressLine2: "", city: "",
      postcode: "", country: "", vatId: "", website: "",
    },
  });

  const onSubmit = async (data: CompanyFormValues) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
      return;
    }
    setIsLoading(true);

    try {
      let logoUrl = "";
      if (data.logo && data.logo.length > 0) {
        const file = data.logo[0];
        const storageRef = ref(storage!, `company-logos/${user.uid}/${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        logoUrl = await getDownloadURL(uploadResult.ref);
      }

      const batch = writeBatch(firestore!);
      
      const companyRef = doc(collection(firestore!, "companies"));
      batch.set(companyRef, {
        name: data.name,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || "",
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        vatId: data.vatId || "",
        website: data.website || "",
        logoUrl,
        status: "Pending",
        createdAt: serverTimestamp(),
        ownerUid: user.uid,
        ownerEmail: user.email,
        // Initialize admin-managed fields to null
        creditLimit: null,
        creditUsage: null,
        rate14day: null,
        rate30day: null,
        rate60day: null,
      });

      const userRef = doc(firestore!, "users", user.uid);
      batch.update(userRef, { companyId: companyRef.id });

      await batch.commit();
      router.push("/awaiting-approval");

    } catch (error: any) {
      console.error("Company setup error:", error);
      toast({
        variant: "destructive",
        title: "Setup Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Company Setup</CardTitle>
        <CardDescription>Just one more step. Please tell us about your company.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl><Input placeholder="Acme Inc." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="addressLine1" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="addressLine2" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2 (Optional)</FormLabel>
                      <FormControl><Input placeholder="Suite 4B" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="Metropolis" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="postcode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode / ZIP</FormLabel>
                      <FormControl><Input placeholder="12345" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="vatId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT ID (Optional)</FormLabel>
                      <FormControl><Input placeholder="GB123456789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl><Input placeholder="https://acme.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             <FormField control={form.control} name="logo" render={({ field: { value, onChange, ...fieldProps} }) => (
                <FormItem>
                  <FormLabel>Company Logo (Optional)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/png, image/jpeg, image/gif" 
                      onChange={(e) => onChange(e.target.files)}
                      {...fieldProps}
                    />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Approval
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
