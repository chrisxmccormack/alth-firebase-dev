
"use client";

import * as React from "react";
import type { PopulatedOrder } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateOrder } from "@/actions/orders";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
  
interface OrdersTableProps {
    data: PopulatedOrder[];
    role: "seller" | "buyer";
}

const statusColors: { [key: string]: string } = {
    Draft: "bg-gray-200 text-gray-800",
    Agreed: "bg-blue-200 text-blue-800",
    Paid: "bg-green-200 text-green-800",
    Dispatched: "bg-purple-200 text-purple-800",
    Delivered: "bg-indigo-200 text-indigo-800",
    Completed: "bg-teal-200 text-teal-800",
    InQuery: "bg-yellow-200 text-yellow-800",
    Cancelled: "bg-red-200 text-red-800",
    Disputed: "bg-orange-200 text-orange-800",
};

const ActionCell = ({ order, role }: { order: PopulatedOrder, role: "seller" | "buyer" }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleUpdateStatus = async (status: PopulatedOrder['status']) => {
        setIsLoading(true);
        const result = await updateOrder(order.id, { status });
        if (result.success) {
            toast({ title: "Success", description: `Order status updated to ${status}.` });
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
        setIsLoading(false);
    };

    const isDisputePeriodActive = () => {
        if (order.paymentMethod !== 'Escrow' || !order.escrowDeadline) return false;
        return order.escrowDeadline.toDate() > new Date();
    }

    const renderBuyerActions = () => {
        switch (order.status) {
            case 'Draft':
                return <Button onClick={() => handleUpdateStatus('Agreed')} disabled={isLoading}>Agree</Button>;
            case 'Dispatched':
                return <Button onClick={() => handleUpdateStatus('Delivered')} disabled={isLoading}>Mark as Delivered</Button>;
            case 'Delivered':
                 if (isDisputePeriodActive()) {
                    return <Button variant="destructive" onClick={() => handleUpdateStatus('Disputed')} disabled={isLoading}>Dispute</Button>;
                 }
                 return null;
            default:
                return null;
        }
    };
    
    const renderSellerActions = () => {
        // Sellers can manage status via dropdown
        return null;
    }

    const relevantAction = role === 'buyer' ? renderBuyerActions() : renderSellerActions();
    if (!relevantAction && role === 'seller' && order.status !== 'Completed' && order.status !== 'Cancelled') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Show</DropdownMenuItem>
                    <DropdownMenuItem>Send</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {order.status === 'Agreed' && <DropdownMenuItem onClick={() => handleUpdateStatus('Paid')}>Mark as Paid</DropdownMenuItem>}
                    {order.status === 'Paid' && <DropdownMenuItem onClick={() => handleUpdateStatus('Dispatched')}>Mark as Dispatched</DropdownMenuItem>}
                    {(order.status === 'Draft' || order.status === 'Agreed') && <DropdownMenuItem onClick={() => handleUpdateStatus('Cancelled')}>Cancel Order</DropdownMenuItem>}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }
    
    return relevantAction ? <div className="w-28 text-right">{relevantAction}</div> : null;
};


export function OrdersTable({ data, role }: OrdersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Orders</CardTitle>
        <CardDescription>
            A list of all {role === 'seller' ? 'outgoing' : 'incoming'} orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">You have no {role} orders yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Total (inc. VAT)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {role === 'seller' ? order.buyerCompany?.name : order.sellerCompany?.name}
                  </TableCell>
                  <TableCell>{order.paymentMethod}</TableCell>
                  <TableCell>{order.currency}</TableCell>
                  <TableCell>{order.totals.incVat.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[order.status] || 'bg-gray-200 text-gray-800'}`}>
                        {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionCell order={order} role={role} />
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
