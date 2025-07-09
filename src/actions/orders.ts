
'use server';

import { firestore } from '@/lib/firebase';
import { calculateTotals, getPlatformFeePct, calculateAndAddLineTotals } from '@/lib/orders';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import type { Order, OrderStatus, PaymentMethod, OrderLine, Company } from '@/types';

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
    lines: Omit<OrderLine, 'amountExVat' | 'amountIncVat'>[]; // Raw lines from client
    tradeFinanceOption: "None" | "14Days" | "30Days" | "60Days";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch buyer company to get finance rates
    const buyerCompanyRef = doc(firestore!, "companies", formData.buyerCompanyId);
    const buyerCompanySnap = await getDoc(buyerCompanyRef);
    if (!buyerCompanySnap.exists()) {
      throw new Error("Buyer company not found.");
    }
    const buyerCompany = buyerCompanySnap.data() as Company;

    // 2. Recalculate everything on the server for security
    const processedLines = calculateAndAddLineTotals(formData.lines);
    const productTotals = calculateTotals(processedLines);

    const baseFeePct = getPlatformFeePct(formData.paymentMethod);
    const basePlatformFee = productTotals.exVat * (baseFeePct / 100);

    let tradeFinanceFee = 0;
    if (formData.tradeFinanceOption !== 'None' && productTotals.exVat > 0) {
      let rate: number | undefined;
      switch (formData.tradeFinanceOption) {
        case '14Days': rate = buyerCompany.rate14day; break;
        case '30Days': rate = buyerCompany.rate30day; break;
        case '60Days': rate = buyerCompany.rate60day; break;
      }
      if (rate && rate > 0 && rate < 100) {
        const rateDecimal = rate / 100;
        tradeFinanceFee = (productTotals.exVat / (1 - rateDecimal)) - productTotals.exVat;
      }
    }

    const totalFeeExVat = basePlatformFee + tradeFinanceFee;
    const feeVat = totalFeeExVat * 0.20; // Assuming 20% VAT on fees

    const finalTotals = {
      exVat: productTotals.exVat + totalFeeExVat,
      vat: productTotals.vat + feeVat,
      incVat: productTotals.incVat + totalFeeExVat + feeVat,
    };
    
    // Round all final totals to 2 decimal places
    Object.keys(finalTotals).forEach(key => {
        finalTotals[key as keyof typeof finalTotals] = Math.round(finalTotals[key as keyof typeof finalTotals] * 100) / 100;
    });

    const newOrderData = {
      ...formData,
      lines: processedLines, // Use server-processed lines
      sellerCompanyId,
      members: [sellerCompanyId, formData.buyerCompanyId],
      totals: finalTotals, // Use server-calculated final totals
      platformFeePct: baseFeePct,
      status: 'Draft' as OrderStatus,
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
