
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
    
    // Convert any `undefined` values from the form into `null` so they can be
    // stored in Firestore. This allows users to clear a field by emptying the input.
    const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value === undefined ? null : value])
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
