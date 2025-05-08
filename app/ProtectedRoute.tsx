"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem("user_role") : null;
    // Sta alleen toegang tot /login toe als niet ingelogd
    if (!role && pathname !== "/login") {
      router.replace("/login");
    }
    // Als je wel ingelogd bent en op /login zit, ga naar home
    if (role && pathname === "/login") {
      router.replace("/");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
