
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
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { OrderBookingPanel } from "./order-booking-panel";
import { OrdersTable } from "@/app/(app)/orders/orders-table";
import Loading from "./loading";

export default function SellingPage() {
  const { userData } = useAuth();
  const [orders, setOrders] = useState<PopulatedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPanelOpen, setPanelOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!userData?.companyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const companyId = userData.companyId;

    const q = query(
      collection(firestore!, "orders"),
      where("sellerCompanyId", "==", companyId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as PopulatedOrder)
      );

      const buyerCompanyIds = [
        ...new Set(fetchedOrders.map((o) => o.buyerCompanyId)),
      ];

      if (buyerCompanyIds.length === 0) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      
      const companiesQuery = query(
        collection(firestore!, "companies"),
        where(documentId(), "in", buyerCompanyIds)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      const companiesMap = new Map<string, Company>();
      companiesSnapshot.forEach((doc) => {
        companiesMap.set(doc.id, { id: doc.id, ...doc.data() } as Company);
      });

      const populatedOrders: PopulatedOrder[] = fetchedOrders
        .map((order) => {
          const buyerCompany = companiesMap.get(order.buyerCompanyId);
          if (!buyerCompany) return null; // Skip if company not found

          return {
            ...order,
            buyerCompany,
            sellerCompany: {id: companyId, name: 'Your Company'} as Company, // Placeholder for self
          };
        })
        .filter((o): o is PopulatedOrder => o !== null);


      setOrders(populatedOrders);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching selling orders:", error);
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
          <h1 className="text-3xl font-bold font-headline">Selling</h1>
          <p className="text-muted-foreground">Manage your outgoing orders.</p>
        </div>
        <Sheet open={isPanelOpen} onOpenChange={setPanelOpen}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle />
              Add Order
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-2xl p-0">
            <OrderBookingPanel onOrderCreated={() => setPanelOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <OrdersTable data={orders} role="seller" />
    </div>
  );
}
