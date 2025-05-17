"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ClientProtectedRoute({ 
  children,
  requireAdmin = false 
}: { 
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    
    try {
      // Controleer of er een auth token is
      const token = localStorage.getItem("auth_token");
      const role = localStorage.getItem("user_role");
      
      // Controleer of de gebruiker is ingelogd
      if (!token || !role) {
        // Niet ingelogd, stuur naar login
        router.push("/login");
        return;
      }
      
      // Controleer admin rechten indien nodig
      if (requireAdmin && role !== "ADMIN" && role !== "COACH") {
        console.log("Geen toegang tot admin pagina's met rol:", role);
        router.push("/");
        return;
      }
      
      // Specifieke controle voor bepaalde admin pagina's
      if (pathname.startsWith("/admin/users") && role !== "ADMIN") {
        // Alleen ADMIN heeft toegang tot gebruikersbeheer
        router.push("/admin/appointments");
        return;
      }
      
      // Alles is in orde
      setIsAuthorized(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Fout bij het controleren van gebruikersrechten:", error);
      setIsAuthorized(false);
      setIsLoading(false);
    }
  }, [pathname, router, requireAdmin]);

  // Toon loading spinner tijdens client-side hydration of laden
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Als er een autorisatiefout is, toon een foutmelding
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Er is een probleem opgetreden bij het controleren van uw toegangsrechten.</p>
        </div>
        <button 
          onClick={() => {
            // Verwijder alle auth gegevens
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_role");
            localStorage.removeItem("user_email");
            localStorage.removeItem("user_name");
            router.push("/login");
          }} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Ga naar inlogpagina
        </button>
      </div>
    );
  }

  // Alles is in orde, toon de kinderen
  return <>{children}</>;
}
