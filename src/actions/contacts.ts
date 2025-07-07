
'use server';

import { firestore } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  deleteField,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import type { Company, Contact } from '@/types';

export async function generateInviteLink(
  companyId: string,
  relationship: { buyer: boolean; seller: boolean }
): Promise<string> {
  // Firestore Security Rules will verify that companyId belongs to the authenticated user.
  const inviteToken = nanoid(24);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // expires in 30 days

  const newContactData = {
    companyAId: companyId,
    companyBId: null,
    members: [companyId],
    relationship,
    status: 'Pending',
    inviteToken,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp(),
  };

  await addDoc(collection(firestore!, 'contacts'), newContactData);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
  return `${baseUrl}/accept-invite?token=${inviteToken}`;
}

export async function validateInvite(token: string) {
  const q = query(
    collection(firestore!, 'contacts'),
    where('inviteToken', '==', token)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { error: 'This invite link is invalid or has already been used.' };
  }

  const contactDoc = snapshot.docs[0];
  const contactData = { id: contactDoc.id, ...contactDoc.data() } as Contact;

  if (contactData.expiresAt && contactData.expiresAt.toDate() < new Date()) {
    // Optionally, you could delete the expired document
    // await deleteDoc(contactDoc.ref);
    return { error: 'This invite link has expired.' };
  }

  const companyDocRef = doc(firestore!, 'companies', contactData.companyAId);
  const companyDoc = await getDoc(companyDocRef);

  if (!companyDoc.exists()) {
    return { error: 'The inviting company could not be found.' };
  }

  const invitingCompany = {
    id: companyDoc.id,
    ...companyDoc.data(),
  } as Company;

  return { data: { contact: contactData, invitingCompany } };
}

export async function acceptInvite(
  token: string,
  acceptingCompanyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validationResult = await validateInvite(token);
    if (validationResult.error || !validationResult.data) {
      throw new Error(validationResult.error || 'Failed to validate invite.');
    }

    const { contact } = validationResult.data;

    if (contact.companyAId === acceptingCompanyId) {
      throw new Error('You cannot connect with your own company.');
    }

    const contactRef = doc(firestore!, 'contacts', contact.id);

    const batch = writeBatch(firestore!);
    batch.update(contactRef, {
      companyBId: acceptingCompanyId,
      status: 'Connected',
      members: [contact.companyAId, acceptingCompanyId],
      inviteToken: deleteField(),
      expiresAt: deleteField(),
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error('Error accepting invite:', error);
    return { success: false, error: error.message };
  }
}

export async function createDirectContact(
    currentCompanyId: string,
    formData: {
      name: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      postcode: string;
      country: string;
      vatId?: string;
      website?: string;
      firstName: string;
      lastName: string;
      contactEmail: string;
    },
    relationship: { buyer: boolean; seller: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { contactEmail, firstName, lastName, ...companyData } = formData;
      const batch = writeBatch(firestore!);
  
      // 1. Create the new company
      const newCompanyRef = doc(collection(firestore!, 'companies'));
      batch.set(newCompanyRef, {
        ...companyData,
        logoUrl: '', // No logo upload in this flow
        status: 'Approved', // Manually created contacts are pre-approved
        createdAt: serverTimestamp(),
        ownerUid: null, // No owner, as this is a manually created contact
        ownerEmail: contactEmail,
        ownerFirstName: firstName,
        ownerLastName: lastName,
      });
  
      // 2. Create the contact link
      const contactRef = doc(collection(firestore!, 'contacts'));
      batch.set(contactRef, {
        companyAId: currentCompanyId,
        companyBId: newCompanyRef.id,
        members: [currentCompanyId, newCompanyRef.id],
        relationship,
        status: 'Connected',
        createdAt: serverTimestamp(),
      });
  
      await batch.commit();
      return { success: true };
    } catch (error: any) {
      console.error('Error creating direct contact:', error);
      return { success: false, error: error.message };
    }
  }
