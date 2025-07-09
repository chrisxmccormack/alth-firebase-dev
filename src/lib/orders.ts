
import type { OrderLine, OrderTotals, PaymentMethod } from "@/types";

/**
 * Calculates the platform fee percentage based on the payment method.
 */
export function getPlatformFeePct(paymentMethod: PaymentMethod): number {
    switch (paymentMethod) {
      case "Escrow":
        return 1;
      case "Crypto":
        return 3;
      case "BankTransfer":
      default:
        return 0;
    }
}

/**
 * Calculates the total amounts from an array of order lines.
 * Assumes a standard VAT rate of 20% for calculation simplicity.
 */
export function calculateTotals(lines: OrderLine[]): OrderTotals {
    const VAT_RATE = 0.20;
  
    const totals = lines.reduce(
      (acc, line) => {
        const qty = Number(line.qty) || 0;
        const unitPrice = Number(line.unitPrice) || 0;
        const lineTotalExVat = qty * unitPrice;
        
        // This is a simplified VAT calculation. A real app would have more complex logic.
        const lineVat = line.vatTreatment === 'Standard' ? lineTotalExVat * VAT_RATE : 0;
        const lineTotalIncVat = lineTotalExVat + lineVat;
        
        acc.exVat += lineTotalExVat;
        acc.vat += lineVat;
        acc.incVat += lineTotalIncVat;
        
        return acc;
      },
      { exVat: 0, vat: 0, incVat: 0 }
    );
  
    // Round to 2 decimal places to avoid floating point issues
    return {
        exVat: Math.round(totals.exVat * 100) / 100,
        vat: Math.round(totals.vat * 100) / 100,
        incVat: Math.round(totals.incVat * 100) / 100,
    };
}
