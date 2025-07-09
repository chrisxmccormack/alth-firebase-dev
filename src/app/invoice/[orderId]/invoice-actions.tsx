
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { updateOrder } from '@/actions/orders';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { OrderStatus } from '@/types';

interface InvoiceActionsProps {
  order: {
    id: string;
    status: OrderStatus;
    buyerCompanyId: string;
  };
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

  // The component should render nothing if the order is not in a "Draft" state.
  if (order.status !== 'Draft') {
    return null;
  }

  // While checking the user's auth status, don't show the buttons.
  // This also handles the case where a user is not logged in (`userData` will be null).
  if (authLoading || !userData) {
    return null;
  }

  // At this point, we know the user is logged in.
  // Now, check if the logged-in user is the buyer for this specific order.
  const isBuyer = userData.companyId === order.buyerCompanyId;

  if (!isBuyer) {
    return null;
  }

  // If all checks pass, render the buttons.
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
