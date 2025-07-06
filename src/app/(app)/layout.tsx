
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

import { useAuth } from "@/context/auth-context";
import { auth, firestore } from "@/lib/firebase";
import type { Company } from "@/types";
import { AlethiumLogo } from "@/components/icons";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, LayoutDashboard, Users, LogOut, ShieldCheck, ChevronsUpDown } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [company, setCompany] = useState<Company | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (userData && !userData.companyId) {
      router.push("/company-setup");
      return;
    }

    if (userData?.companyId) {
      const checkCompanyStatus = async () => {
        setIsCheckingStatus(true);
        const companyRef = doc(firestore!, "companies", userData.companyId!);
        const companySnap = await getDoc(companyRef);
        if (companySnap.exists()) {
          const companyData = { id: companySnap.id, ...companySnap.data() } as Company;
          setCompany(companyData);
          if (companyData.status === "Pending") {
            router.push("/awaiting-approval");
          }
        } else {
          console.error("Company document not found for user's companyId.");
          router.push("/company-setup");
        }
        setIsCheckingStatus(false);
      };
      checkCompanyStatus();
    }
  }, [user, userData, loading, router]);

  const handleSignOut = async () => {
    await signOut(auth!);
    router.push("/login");
  };

  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_SYSTEM_ADMIN_UID;
  const isLoading = loading || isCheckingStatus || !company || company.status !== "Approved";
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/contacts", label: "Contacts", icon: Users },
  ]

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <AlethiumLogo />
            <h1 className="text-xl font-bold font-headline text-sidebar-primary">
              AlethiumCore
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                {navItems.map(item => (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto p-2">
                   <div className="flex items-center gap-2 w-full">
                    <Avatar className="h-9 w-9">
                        {company?.logoUrl && <AvatarImage src={company.logoUrl} alt={company.name} />}
                        <AvatarFallback>{company?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-medium truncate">{company?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">View Profile</p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                   </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <ShieldCheck className="mr-2" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
