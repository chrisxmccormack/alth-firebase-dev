
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { useAuth } from "@/context/auth-context";
import { createDirectContact } from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const createContactSchema = z
  .object({
    // Company
    name: z.string().min(2, { message: "Company name is required." }),
    addressLine1: z.string().min(2, { message: "Address is required." }),
    addressLine2: z.string().optional(),
    city: z.string().min(2, { message: "City is required." }),
    postcode: z.string().min(2, { message: "Postcode is required." }),
    country: z.string().min(2, { message: "Country is required." }),
    vatId: z.string().optional(),
    website: z
      .string()
      .url({ message: "Please enter a valid URL." })
      .optional()
      .or(z.literal("")),

    // Contact Person
    contactEmail: z.string().email({ message: "A valid email is required." }),

    // Relationship
    isBuyer: z.boolean().default(false),
    isSeller: z.boolean().default(false),
  })
  .refine((data) => data.isBuyer || data.isSeller, {
    message: "Please select at least one relationship.",
    path: ["isBuyer"],
  });

type CreateContactFormValues = z.infer<typeof createContactSchema>;

interface CreateContactPanelProps {
  onContactCreated: () => void;
}

const countries = [
    { value: "GB", label: "United Kingdom" },
    { value: "US", label: "United States" },
    { value: "CA", label: "Canada" },
    { value: "DE", label: "Germany" },
    { value: "FR", label: "France" },
  ];

export function InviteContactPanel({ onContactCreated }: CreateContactPanelProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateContactFormValues>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: "",
      vatId: "",
      website: "",
      contactEmail: "",
      isBuyer: false,
      isSeller: false,
    },
  });

  const onSubmit = async (data: CreateContactFormValues) => {
    if (!userData?.companyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not find your company to associate with.",
      });
      return;
    }
    setIsLoading(true);
    try {
        const { isBuyer, isSeller, ...companyAndContactData } = data;
      const result = await createDirectContact(
        userData.companyId,
        companyAndContactData,
        { buyer: isBuyer, seller: isSeller }
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "New contact has been created.",
        });
        onContactCreated();
      } else {
        throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create contact",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SheetHeader className="p-6">
        <SheetTitle>Create a New Contact</SheetTitle>
        <SheetDescription>
          Manually enter the details for a new business partner.
        </SheetDescription>
      </SheetHeader>
      <ScrollArea className="h-[calc(100%-150px)]">
        <div className="px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Company Details</h3>
                <p className="text-sm text-muted-foreground">Information about the partner company.</p>
              </div>
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl><Input placeholder="Partner Corp." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl><Input placeholder="contact@partner.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="addressLine1" render={({ field }) => (
                     <FormItem>
                       <FormLabel>Address Line 1</FormLabel>
                       <FormControl><Input placeholder="100 Business Rd" {...field} /></FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField control={form.control} name="addressLine2" render={({ field }) => (
                     <FormItem>
                       <FormLabel>Address Line 2 <span className="text-muted-foreground">(Optional)</span></FormLabel>
                       <FormControl><Input placeholder="Floor 5" {...field} /></FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField control={form.control} name="city" render={({ field }) => (
                     <FormItem>
                       <FormLabel>City</FormLabel>
                       <FormControl><Input placeholder="Tradetown" {...field} /></FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 <FormField control={form.control} name="postcode" render={({ field }) => (
                     <FormItem>
                       <FormLabel>Postcode / ZIP</FormLabel>
                       <FormControl><Input placeholder="W1A 1AA" {...field} /></FormControl>
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
                      <FormLabel>VAT ID <span className="text-muted-foreground">(Optional)</span></FormLabel>
                      <FormControl><Input placeholder="GB123456789" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="website" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website <span className="text-muted-foreground">(Optional)</span></FormLabel>
                      <FormControl><Input placeholder="https://partner.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>

              <div>
                <h3 className="text-lg font-medium">Relationship</h3>
                <p className="text-sm text-muted-foreground">How are you connected to this company?</p>
              </div>

              <div className="space-y-4">
                <FormField control={form.control} name="isBuyer" render={({ field }) => (
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label htmlFor="is-buyer">They are my Buyer</Label>
                      <p className="text-xs text-muted-foreground">You sell goods or services to this company.</p>
                    </div>
                    <FormControl>
                      <Switch id="is-buyer" checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </div>
                )} />
                 <FormField control={form.control} name="isSeller" render={({ field }) => (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                        <Label htmlFor="is-seller">They are my Seller</Label>
                        <p className="text-xs text-muted-foreground">You buy goods or services from this company.</p>
                        </div>
                        <FormControl>
                            <Switch id="is-seller" checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </div>
                 )} />
                 <FormMessage>{form.formState.errors.isBuyer?.message}</FormMessage>
              </div>
            </form>
          </Form>
        </div>
      </ScrollArea>
      <SheetFooter className="p-6 bg-background border-t absolute bottom-0 w-full">
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Contact
        </Button>
      </SheetFooter>
    </>
  );
}
