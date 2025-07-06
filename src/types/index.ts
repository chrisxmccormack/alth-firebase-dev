import type { Timestamp } from "firebase/firestore";

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  companyId: string | null;
  createdAt: Timestamp;
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
  ownerUid: string;
  ownerEmail: string;
}

export interface Contact {
  id: string;
  companyAId: string;
  companyBId: string | null;
  relationship: {
    buyer: boolean;
    seller: boolean;
  };
  status: "Pending" | "Connected";
  inviteToken?: string;
  expiresAt?: Timestamp;
  createdAt: Timestamp;
}

export interface PopulatedContact {
  id: string;
  status: "Pending" | "Connected";
  relationship: {
    buyer: boolean;
    seller: boolean;
  };
  partnerCompany: Company;
  createdAt: Timestamp;
}
