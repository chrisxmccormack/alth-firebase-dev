
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

const VAT_RATE = 0.20;

/**
 * Takes raw order lines and returns them with calculated amounts.
 */
export function calculateAndAddLineTotals(lines: Omit<OrderLine, 'amountExVat' | 'amountIncVat'>[]): OrderLine[] {
    return lines.map(line => {
        const qty = Number(line.qty) || 0;
        const unitPrice = Number(line.unitPrice) || 0;
        const amountExVat = qty * unitPrice;
        const lineVat = line.vatTreatment === 'Standard' ? amountExVat * VAT_RATE : 0;
        const amountIncVat = amountExVat + lineVat;

        return {
            ...line,
            amountExVat: Math.round(amountExVat * 100) / 100,
            amountIncVat: Math.round(amountIncVat * 100) / 100
        };
    });
}


/**
 * Calculates the total amounts from an array of processed order lines.
 * Assumes a standard VAT rate of 20% for calculation simplicity.
 */
export function calculateTotals(lines: OrderLine[]): OrderTotals {
    const totals = lines.reduce(
      (acc, line) => {
        const lineVat = line.vatTreatment === 'Standard' ? line.amountExVat * VAT_RATE : 0;
        
        acc.exVat += line.amountExVat;
        acc.vat += lineVat;
        acc.incVat += line.amountIncVat;
        
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
