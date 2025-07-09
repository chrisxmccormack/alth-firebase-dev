
import type { Timestamp } from "firebase/firestore";

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  companyId: string | null;
  createdAt: Timestamp;
  companyIsApproved?: boolean;
  perms: {
    admin: boolean;
    buyer: boolean;
    seller: boolean;
  };
}

export interface Company {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postcode: string;
  country: string;
  vatId?: string;
  website?: string;
  logoUrl?: string;
  status: 'Pending' | 'Approved';
  createdAt: Timestamp;
  ownerUid?: string | null;
  ownerEmail?: string;
  ownerFirstName?: string;
  ownerLastName?: string;

  // Admin-only fields
  creditLimit?: number;
  creditUsage?: number;
  rate14day?: number;
  rate30day?: number;
  rate60day?: number;
}

// --- ORDERS ---

export type Currency = "GBP" | "EUR" | "USD";
export type PaymentMethod = "BankTransfer" | "Escrow" | "Crypto";
export type OrderStatus =
  | "Draft"
  | "Agreed"
  | "Paid"
  | "Dispatched"
  | "Delivered"
  | "Completed"
  | "InQuery"
  | "Cancelled"
  | "Disputed"
  | "Accepted"
  | "Rejected";

export interface OrderLine {
  productName: string;
  qty: number;
  unitPrice: number;
  vatTreatment: string; // For now, this is a simple text field
  amountExVat: number;
  amountIncVat: number;
}

export interface OrderTotals {
  exVat: number;
  vat: number;
  incVat: number;
}

export interface Order {
  id: string;
  sellerCompanyId: string;
  buyerCompanyId: string;
  members: string[];
  currency: Currency;
  paymentMethod: PaymentMethod;
  tradeFinanceOption?: "None" | "14Days" | "30Days" | "60Days";
  platformFeePct: number;
  lines: OrderLine[];
  totals: OrderTotals;
  status: OrderStatus;
  trackingId?: string | null;
  escrowDeadline?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PopulatedOrder extends Order {
    buyerCompany: Company;
    sellerCompany: Company;
}
