
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  documentId,
  orderBy
} from "firebase/firestore";

import { useAuth } from "@/context/auth-context";
import { firestore } from "@/lib/firebase";
import type { Company, PopulatedOrder } from "@/types";
import { OrdersTable } from "@/app/(app)/orders/orders-table";
import Loading from "./loading";

export default function BuyingPage() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!userData?.companyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const companyId = userData.companyId;

    const q = query(
      collection(firestore!, "orders"),
      where("buyerCompanyId", "==", companyId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as PopulatedOrder)
      );

      const sellerCompanyIds = [
        ...new Set(fetchedOrders.map((o) => o.sellerCompanyId)),
      ];

      if (sellerCompanyIds.length === 0) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      const companiesQuery = query(
        collection(firestore!, "companies"),
        where(documentId(), "in", sellerCompanyIds)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      const companiesMap = new Map<string, Company>();
      companiesSnapshot.forEach((doc) => {
        companiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Company);
      });

      const populatedOrders: PopulatedOrder[] = fetchedOrders.map((order) => {
        return {
          ...order,
          sellerCompany: companiesMap.get(order.sellerCompanyId)!,
          buyerCompany: {id: companyId, name: 'Your Company'} as Company // Placeholder for self
        };
      });

      setOrders(populatedOrders);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching buying orders:", error);
        setIsLoading(false);
    });

    return unsubscribe;
  }, [userData?.companyId]);

  useEffect(() => {
    const unsubscribePromise = fetchOrders();
    return () => {
      unsubscribePromise?.then((unsub) => unsub && unsub());
    };
  }, [fetchOrders]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Buying</h1>
          <p className="text-muted-foreground">Manage your incoming orders.</p>
        </div>
      </div>
      <OrdersTable data={orders} role="buyer" />
    </div>
  );
}
