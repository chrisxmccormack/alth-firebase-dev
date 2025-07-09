
'use server';

import { firestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface CompanyAdminDetails {
  creditLimit?: number;
  creditUsage?: number;
  rate14day?: number;
  rate30day?: number;
  rate60day?: number;
}

export async function updateCompanyAdminDetails(
  companyId: string,
  data: CompanyAdminDetails
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!companyId) {
      throw new Error("Company ID is required.");
    }
    
    const companyRef = doc(firestore!, 'companies', companyId);
    
    // Firestore's updateDoc handles undefined fields gracefully.
    // We can clean the object to avoid sending empty fields, which is good practice.
    const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]).filter(([_, v]) => v !== undefined)
    );
      
    if (Object.keys(cleanedData).length === 0) {
        return { success: true }; // Nothing to update
    }

    await updateDoc(companyRef, cleanedData);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating company admin details:', error);
    return { success: false, error: error.message };
  }
}
