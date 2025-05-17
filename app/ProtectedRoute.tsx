"use client";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    // Markeer component als gemount
    setIsMounted(true);
    
    // Controleer of we op de login pagina zijn
    // We willen altijd toegang geven tot de login pagina
    if (pathname === "/login") {
      return;
    }
    
    // Veilige toegangscontrole met try-catch
    try {
      const role = localStorage.getItem("user_role");
      
      // Controleer of de gebruiker is ingelogd
      if (!role) {
        // Niet ingelogd, stuur naar login
        router.push("/login");
        return;
      }
      
      // Controleer toegang tot admin pagina's
      if (pathname.startsWith("/admin")) {
        // Alleen ADMIN en COACH rollen hebben toegang tot admin pagina's
        if (role !== "ADMIN" && role !== "COACH") {
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
      }
    } catch (error) {
      console.error("Fout bij het controleren van gebruikersrechten:", error);
      // Bij fouten, stuur naar login maar crash niet
      setIsAuthorized(false);
    }
  }, [pathname, router]);

  // Toon loading spinner tijdens client-side hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Als er een autorisatiefout is, toon een foutmelding
  if (!isAuthorized && pathname !== "/login") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Er is een probleem opgetreden bij het controleren van uw toegangsrechten.</p>
        </div>
        <button 
          onClick={() => router.push("/login")} 
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
