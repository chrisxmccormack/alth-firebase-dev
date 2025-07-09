
"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { createOrder } from "@/actions/orders";
import {
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { calculateTotals, getPlatformFeePct } from "@/lib/orders";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import type { Company } from "@/types";

const orderLineSchema = z.object({
  productName: z.string().min(1, "Product name is required."),
  qty: z.coerce.number().min(0.01, "Quantity must be positive."),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative."),
  vatTreatment: z.string().min(1, "VAT Treatment is required."),
});

const orderSchema = z.object({
  buyerCompanyId: z.string().min(1, "A buyer must be selected."),
  currency: z.enum(["GBP", "EUR", "USD"]),
  paymentMethod: z.enum(["BankTransfer", "Escrow", "Crypto"]),
  lines: z.array(orderLineSchema).min(1, "At least one order line is required.").max(50),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface OrderBookingPanelProps {
  onOrderCreated: () => void;
}

export function OrderBookingPanel({ onOrderCreated }: OrderBookingPanelProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [buyers, setBuyers] = useState<Company[]>([]);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      buyerCompanyId: "",
      currency: "GBP",
      paymentMethod: "BankTransfer",
      lines: [{ productName: "", qty: 1, unitPrice: 0, vatTreatment: "Standard" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  const watchedLines = useWatch({ control: form.control, name: "lines" });
  const productTotals = calculateTotals(watchedLines.map(l => ({...l, amountExVat: 0, amountIncVat: 0})));

  const paymentMethod = useWatch({ control: form.control, name: "paymentMethod" });
  const platformFeePct = getPlatformFeePct(paymentMethod as any);
  const platformFeeAmount = productTotals.exVat * (platformFeePct / 100);

  const finalExVatTotal = productTotals.exVat + platformFeeAmount;
  const finalIncVatTotal = productTotals.incVat + platformFeeAmount;


  const fetchBuyers = useCallback(async () => {
    if (!userData?.companyId) return;

    const companyId = userData.companyId;
    const companiesRef = collection(firestore!, "companies");
    
    // Fetch all companies except the current user's own company
    const q = query(
        companiesRef, 
        where(documentId(), "!=", companyId)
    );
    const companiesSnapshot = await getDocs(q);
    const companies = companiesSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as Company);
    
    setBuyers(companies);
  }, [userData?.companyId]);

  useEffect(() => {
    fetchBuyers();
  }, [fetchBuyers]);


  const onSubmit = async (data: OrderFormValues) => {
    if (!userData?.companyId) return;
    setIsLoading(true);
    try {
      // Re-calculate totals on the server, but client-side data is good enough for creation
      const result = await createOrder(userData.companyId, data);
      if (result.success) {
        toast({ title: "Success", description: "Draft order has been created." });
        onOrderCreated();
      } else {
        throw new Error(result.error || "An unknown error occurred.");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to create order", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SheetHeader className="p-6">
        <SheetTitle>Add New Order</SheetTitle>
        <SheetDescription>Create a new sales order. It will be saved as a draft.</SheetDescription>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
          <ScrollArea className="flex-1">
            <div className="px-6 pb-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="buyerCompanyId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buyer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a buyer" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {buyers.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="currency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                        <SelectContent>
                           <SelectItem value="GBP">GBP</SelectItem>
                           <SelectItem value="USD">USD</SelectItem>
                           <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              <h3 className="text-lg font-medium">Order Lines</h3>
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const line = watchedLines[index];
                  const qty = Number(line?.qty) || 0;
                  const unitPrice = Number(line?.unitPrice) || 0;
                  const netAmount = qty * unitPrice;
                  const grossAmount = line?.vatTreatment === 'Standard' ? netAmount * 1.20 : netAmount;

                  return (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-start p-2 border rounded-md">
                       <div className="col-span-11 grid grid-cols-12 gap-x-2 gap-y-1">
                          <FormField control={form.control} name={`lines.${index}.productName`} render={({ field }) => (
                              <FormItem className="col-span-12">
                                 <FormLabel className={index !== 0 ? 'sr-only' : ''}>Product Name</FormLabel>
                                 <FormControl><Input placeholder="Product Description" {...field} /></FormControl>
                                 <FormMessage />
                              </FormItem>
                           )}/>
                          <FormField control={form.control} name={`lines.${index}.qty`} render={({ field }) => (
                             <FormItem className="col-span-2">
                                <FormLabel className={index !== 0 ? 'sr-only' : ''}>Qty</FormLabel>
                                <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                                <FormMessage />
                             </FormItem>
                          )}/>
                          <FormField control={form.control} name={`lines.${index}.unitPrice`} render={({ field }) => (
                             <FormItem className="col-span-2">
                                <FormLabel className={index !== 0 ? 'sr-only' : ''}>Unit Price</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="100.00" {...field} /></FormControl>
                                <FormMessage />
                             </FormItem>
                          )}/>
                           <FormField control={form.control} name={`lines.${index}.vatTreatment`} render={({ field }) => (
                             <FormItem className="col-span-3">
                                <FormLabel className={index !== 0 ? 'sr-only' : ''}>VAT</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue placeholder="VAT" /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="Standard">Standard</SelectItem>
                                          <SelectItem value="Zero">Zero-rated</SelectItem>
                                          <SelectItem value="Exempt">Exempt</SelectItem>
                                      </SelectContent>
                                  </Select>
                                <FormMessage />
                             </FormItem>
                          )}/>
                          <div className="col-span-2">
                            <FormLabel className={index !== 0 ? 'sr-only' : ''}>Net Amount</FormLabel>
                            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm">
                              {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                          <div className="col-span-3">
                            <FormLabel className={index !== 0 ? 'sr-only' : ''}>Gross Amount</FormLabel>
                            <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
                              {grossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </div>
                       </div>
                       <div className="col-span-1 flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="mt-8">
                             <Trash2 className="h-4 w-4" />
                          </Button>
                       </div>
                    </div>
                  );
                })}
                 <FormMessage>{form.formState.errors.lines?.message}</FormMessage>

                 {platformFeeAmount > 0 && (
                  <div className="grid grid-cols-12 gap-2 items-start p-2 border rounded-md bg-muted/50">
                      <div className="col-span-11 grid grid-cols-12 gap-x-2 gap-y-1">
                          <div className="col-span-12">
                              <div className="flex h-10 w-full items-center rounded-md border-input bg-background px-3 py-2 text-sm font-medium">Platform Fee</div>
                          </div>
                          <div className="col-span-2">
                              <div className="flex h-10 w-full items-center rounded-md border-input bg-background px-3 py-2 text-sm">1</div>
                          </div>
                          <div className="col-span-2">
                              <div className="flex h-10 w-full items-center rounded-md border-input bg-background px-3 py-2 text-sm">
                                  {platformFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                          </div>
                          <div className="col-span-3">
                              <div className="flex h-10 w-full items-center rounded-md border-input bg-background px-3 py-2 text-sm">Exempt</div>
                          </div>
                          <div className="col-span-2">
                              <div className="flex h-10 w-full items-center rounded-md border-input bg-background px-3 py-2 text-sm">
                                  {platformFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                          </div>
                          <div className="col-span-3">
                              <div className="flex h-10 w-full items-center rounded-md border-input bg-background px-3 py-2 text-sm font-medium">
                                  {platformFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                          </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                          {/* Empty div for alignment, as there's no delete button */}
                      </div>
                  </div>
                )}

                <Button type="button" variant="outline" size="sm" onClick={() => append({ productName: "", qty: 1, unitPrice: 0, vatTreatment: 'Standard' })}>
                  Add Line
                </Button>
              </div>

              <Separator />
              <h3 className="text-lg font-medium">Payment</h3>
                <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                        <FormItem>
                            <FormControl><RadioGroupItem value="BankTransfer" id="r1" className="peer sr-only" /></FormControl>
                            <Label htmlFor="r1" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Bank Transfer <span className="text-xs text-muted-foreground">(0% Fee)</span>
                            </Label>
                        </FormItem>
                        <FormItem>
                            <FormControl><RadioGroupItem value="Escrow" id="r2" className="peer sr-only" /></FormControl>
                             <Label htmlFor="r2" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Escrow <span className="text-xs text-muted-foreground">(1% Fee)</span>
                             </Label>
                        </FormItem>
                        <FormItem>
                            <FormControl><RadioGroupItem value="Crypto" id="r3" className="peer sr-only" /></FormControl>
                             <Label htmlFor="r3" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Crypto <span className="text-xs text-muted-foreground">(3% Fee)</span>
                             </Label>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          </ScrollArea>
          <SheetFooter className="p-6 bg-background border-t w-full">
            <div className="flex justify-between items-center w-full">
                <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total (ex. VAT): {finalExVatTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-lg font-bold">Total (inc. VAT): {finalIncVatTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <Button type="submit" disabled={isLoading} size="lg">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Draft Order
                </Button>
            </div>
          </SheetFooter>
        </form>
      </Form>
    </>
  );
}
