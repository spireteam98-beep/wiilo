"use client";

import { useFirebaseAuth } from "@/contexts/firebase-auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userProfile, loading } = useFirebaseAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      // 1. Define public pages that don't need a RoyalPay ID
      const isPublicPage = pathname === "/login" || pathname === "/signup";

      if (!user) {
        // If not logged in, only allow the login page
        if (pathname !== "/login") router.push("/login");
      } 
      else if (!userProfile?.royalPayId) {
        // If logged in but NO RoyalPay ID, force them to signup
        if (pathname !== "/signup") router.push("/signup");
      } 
      else if (isPublicPage && userProfile?.royalPayId) {
        // If they have an ID and try to go to signup/login, send to dashboard
        router.push("/dashboard");
      }
    }
  }, [user, userProfile, loading, router, pathname]);

  // Show a clean dark loader while checking the identity
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#F97316] border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
};