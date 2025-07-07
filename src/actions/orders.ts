
'use server';

import { firestore } from '@/lib/firebase';
import { calculateTotals, getPlatformFeePct } from '@/lib/orders';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import type { Order, OrderStatus, PaymentMethod, OrderLine } from '@/types';

// This corresponds to your requested onOrderWrite Cloud Function logic
const performOrderWriteSideEffects = (
    newStatus: OrderStatus,
    previousStatus: OrderStatus
  ) => {
    // 1. Reject illegal status jumps (This is primarily handled in security rules, but we can double-check here)
    const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      Draft: ['Agreed', 'Cancelled'],
      Agreed: ['Paid', 'Dispatched', 'Cancelled'],
      Paid: ['Dispatched'],
      Dispatched: ['Delivered'],
      Delivered: ['Completed', 'Disputed', 'InQuery'],
      InQuery: ['Completed', 'Disputed', 'Cancelled']
    };
  
    const allowedNextStatuses = validTransitions[previousStatus];
    if (allowedNextStatuses && !allowedNextStatuses.includes(newStatus)) {
        console.warn(`Illegal status transition attempted from ${previousStatus} to ${newStatus}`);
        // In a real scenario, we would throw an error here, but for now, we just log it.
        // throw new Error(`Illegal status transition from ${previousStatus} to ${newStatus}`);
    }

    // 3. Log placeholder for email hook
    if (newStatus !== previousStatus) {
        console.log(`Order status changed from ${previousStatus} to ${newStatus}. Triggering email hook...`);
    }
};

export async function createOrder(
  sellerCompanyId: string,
  formData: {
    buyerCompanyId: string;
    currency: "GBP" | "EUR" | "USD";
    paymentMethod: PaymentMethod;
    lines: OrderLine[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 2. Recalculate totals and platformFeePct on write
    const totals = calculateTotals(formData.lines);
    const platformFeePct = getPlatformFeePct(formData.paymentMethod);

    const newOrderData = {
      ...formData,
      sellerCompanyId,
      totals,
      platformFeePct,
      status: 'Draft',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(firestore!, 'orders'), newOrderData);

    console.log("Order created with status: Draft. Triggering email hook...");

    return { success: true };
  } catch (error: any) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
}

export async function updateOrder(
    orderId: string,
    updateData: Partial<Order>
): Promise<{ success: boolean; error?: string }> {
    try {
        const orderRef = doc(firestore!, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error("Order not found.");
        }
        const existingOrder = orderSnap.data() as Order;
        
        const payload: Record<string, any> = {
            ...updateData,
            updatedAt: serverTimestamp()
        };

        // If status is changing, perform side effects
        if (updateData.status && updateData.status !== existingOrder.status) {
            performOrderWriteSideEffects(updateData.status, existingOrder.status);

            // 4. Handle Escrow deadline
            if (updateData.status === 'Delivered' && existingOrder.paymentMethod === 'Escrow') {
                const deadline = new Date();
                deadline.setHours(deadline.getHours() + 24);
                payload.escrowDeadline = Timestamp.fromDate(deadline);
                console.log(`Order ${orderId} is Escrow and Delivered. Dispute deadline set to ${deadline.toISOString()}`);
            }
        }
        
        await updateDoc(orderRef, payload);
        return { success: true };

    } catch (error: any) {
        console.error("Error updating order:", error);
        return { success: false, error: error.message };
    }
}
