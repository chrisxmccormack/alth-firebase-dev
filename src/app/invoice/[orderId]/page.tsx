
import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import type { Order, Company } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlethiumLogo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { InvoiceActions } from './invoice-actions';

async function getInvoiceData(orderId: string) {
    // Return null if firebase is not initialized.
    // This can happen in a dev environment if env vars are not set.
    if (!firestore) return null;

    const orderRef = doc(firestore, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
        return null;
    }

    const order = { id: orderSnap.id, ...orderSnap.data() } as Order;

    const sellerRef = doc(firestore, 'companies', order.sellerCompanyId);
    const buyerRef = doc(firestore, 'companies', order.buyerCompanyId);

    const [sellerSnap, buyerSnap] = await Promise.all([
        getDoc(sellerRef),
        getDoc(buyerRef)
    ]);

    if (!sellerSnap.exists() || !buyerSnap.exists()) {
        // Data is inconsistent, treat as not found.
        return null;
    }

    const sellerCompany = { id: sellerSnap.id, ...sellerSnap.data() } as Company;
    const buyerCompany = { id: buyerSnap.id, ...buyerSnap.data() } as Company;
    
    return { order, sellerCompany, buyerCompany };
}

const statusColors: { [key: string]: string } = {
    Draft: "bg-gray-200 text-gray-800",
    Agreed: "bg-blue-200 text-blue-800",
    Accepted: "bg-blue-200 text-blue-800",
    Rejected: "bg-red-200 text-red-800",
    Paid: "bg-green-200 text-green-800",
    Dispatched: "bg-purple-200 text-purple-800",
    Delivered: "bg-indigo-200 text-indigo-800",
    Completed: "bg-teal-200 text-teal-800",
    InQuery: "bg-yellow-200 text-yellow-800",
    Cancelled: "bg-red-200 text-red-800",
    Disputed: "bg-orange-200 text-orange-800",
};


export default async function InvoicePage({ params }: { params: { orderId: string } }) {
    const data = await getInvoiceData(params.orderId);

    if (!data) {
        notFound();
    }
    
    const { order, sellerCompany, buyerCompany } = data;
    const { lines, totals, currency, createdAt, id, status } = order;

    const formatCurrency = (amount: number) => {
        return `${currency} ${amount.toFixed(2)}`;
    }

    const formatDate = (timestamp: any) => {
        if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString();
        }
        return 'N/A';
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-8 font-body">
            <div className="mx-auto max-w-4xl">
                <Card>
                    <CardHeader className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <AlethiumLogo />
                                    <h1 className="text-3xl font-bold font-headline text-foreground">Invoice</h1>
                                </div>
                                <InvoiceActions order={order} />
                            </div>
                            <Badge className={`${statusColors[order.status] || 'bg-gray-200 text-gray-800'}`}>
                                {order.status}
                            </Badge>
                        </div>
                        <CardDescription>Order ID: {id}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid sm:grid-cols-2 gap-8 text-sm">
                            <div>
                                <h3 className="font-semibold text-foreground mb-2">From:</h3>
                                <p className="font-medium text-foreground">{sellerCompany.name}</p>
                                <p>{sellerCompany.addressLine1}</p>
                                {sellerCompany.addressLine2 && <p>{sellerCompany.addressLine2}</p>}
                                <p>{sellerCompany.city}, {sellerCompany.postcode}</p>
                                <p>{sellerCompany.country}</p>
                            </div>
                            <div className="sm:text-right">
                                <h3 className="font-semibold text-foreground mb-2">To:</h3>
                                <p className="font-medium text-foreground">{buyerCompany.name}</p>
                                <p>{buyerCompany.addressLine1}</p>
                                {buyerCompany.addressLine2 && <p>{buyerCompany.addressLine2}</p>}
                                <p>{buyerCompany.city}, {buyerCompany.postcode}</p>
                                <p>{buyerCompany.country}</p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                                <span className="font-semibold text-foreground block">Order Date</span>
                                {formatDate(createdAt)}
                            </div>
                            <div>
                                <span className="font-semibold text-foreground block">Payment Method</span>
                                {order.paymentMethod}
                            </div>
                            <div>
                                <span className="font-semibold text-foreground block">Trade Finance</span>
                                {order.tradeFinanceOption?.replace('Days', ' Days') ?? 'None'}
                            </div>
                        </div>

                        <div className="mt-6 rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-1/2">Product</TableHead>
                                        <TableHead className="text-center">Quantity</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Amount (ex. VAT)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map((line, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{line.productName}</TableCell>
                                            <TableCell className="text-center">{line.qty}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(line.unitPrice)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(line.amountExVat)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div className="w-full max-w-xs space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal (ex. VAT)</span>
                                    <span className="font-medium text-foreground">{formatCurrency(totals.exVat)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total VAT</span>
                                    <span className="font-medium text-foreground">{formatCurrency(totals.vat)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-base">
                                    <span className="text-foreground">Total (inc. VAT)</span>
                                    <span className="text-foreground">{formatCurrency(totals.incVat)}</span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
