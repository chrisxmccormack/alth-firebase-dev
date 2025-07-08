
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
}

export type ContactStatus = "Pending" | "Connected" | "Unverified";

export interface Contact {
  id: string;
  companyAId: string;
  companyBId: string | null;
  members: string[];
  relationship: {
    buyer: boolean;
    seller: boolean;
  };
  status: ContactStatus;
  inviteToken?: string;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
  ownerUid?: string;
  contactPerson?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  partnerCompanyDetails?: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    country: string;
    vatId?: string;
    website?: string;
  };
}

export interface PopulatedContact {
  id: string;
  status: ContactStatus;
  relationship: {
    buyer: boolean;
    seller: boolean;
  };
  partnerCompany: Company;
  createdAt: Timestamp;
}

// --- ORDERS ---

export type Currency = "GBP" | "EUR" | "USD";
export type PaymentMethod = "BankTransfer" | "Escrow" | "Crypto" | "TradeFinance";
export type OrderStatus =
  | "Draft"
  | "Agreed"
  | "Paid"
  | "Dispatched"
  | "Delivered"
  | "Completed"
  | "InQuery"
  | "Cancelled"
  | "Disputed";

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
