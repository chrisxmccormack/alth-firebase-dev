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
