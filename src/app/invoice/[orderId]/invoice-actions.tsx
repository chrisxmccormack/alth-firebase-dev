
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { updateOrder } from '@/actions/orders';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Order } from '@/types';

interface InvoiceActionsProps {
  order: Order;
}

export function InvoiceActions({ order }: InvoiceActionsProps) {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  const handleUpdateStatus = async (status: 'Accepted' | 'Rejected') => {
    setLoading(status === 'Accepted' ? 'accept' : 'reject');
    const result = await updateOrder(order.id, { status });

    if (result.success) {
      toast({ title: 'Success', description: `Order status updated to ${status}.` });
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update order status.' });
    }
    setLoading(null);
  };

  if (authLoading) {
    return null; // Don't show anything while auth state is loading
  }

  const isBuyer = userData?.companyId === order.buyerCompanyId;

  if (order.status !== 'Draft' || !isBuyer) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => handleUpdateStatus('Accepted')}
        disabled={!!loading}
      >
        {loading === 'accept' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Accept
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleUpdateStatus('Rejected')}
        disabled={!!loading}
      >
        {loading === 'reject' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Reject
      </Button>
    </div>
  );
}
