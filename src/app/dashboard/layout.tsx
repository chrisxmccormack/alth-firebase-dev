"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Company } from "@/types";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [isCompanyApproved, setIsCompanyApproved] = useState(false);
  const [isCheckingCompany, setIsCheckingCompany] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    if (userData && !userData.companyId) {
      router.push("/company-setup");
      return;
    }
    if (userData && userData.companyId) {
      const checkCompanyStatus = async () => {
        setIsCheckingCompany(true);
        try {
            const companyRef = doc(firestore!, "companies", userData.companyId!);
            const companySnap = await getDoc(companyRef);
            if (companySnap.exists()) {
            const companyData = companySnap.data() as Company;
            if (companyData.status === "Pending") {
                router.push("/awaiting-approval");
            } else if (companyData.status === "Approved") {
                setIsCompanyApproved(true);
            }
            } else {
            // Company doc doesn't exist, something is wrong.
            // Send back to setup to re-create it.
            console.error("Company document not found for user's companyId.");
            router.push("/company-setup");
            }
        } catch (error) {
            console.error("Error checking company status:", error);
            // Handle error case, maybe show an error page or redirect to login
        } finally {
            setIsCheckingCompany(false);
        }
      };
      checkCompanyStatus();
    } else if (user && !userData) {
      // Still waiting for userData to load
      setIsCheckingCompany(true);
    } else {
      setIsCheckingCompany(false);
    }
  }, [user, userData, loading, router]);

  const showLoader = loading || isCheckingCompany || !isCompanyApproved || !user;

  if (showLoader) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
