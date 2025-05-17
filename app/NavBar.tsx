"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import MenuButton from "./MenuButton";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const [role, setRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();

  // Update role on mount and whenever the route changes
  useEffect(() => {
    setIsMounted(true);
    setRole(localStorage.getItem('user_role'));
  }, [pathname]);

  // Listen for storage events (cross-tab login/logout)
  useEffect(() => {
    function handleStorage() {
      setRole(localStorage.getItem('user_role'));
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function handleLogout() {
    // Verwijder alle auth gegevens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    window.location.href = '/login';
  }

  return (
    <nav className="bg-[#222222] shadow-lg rounded-b-xl px-6 py-3 flex items-center justify-between mb-8 border-b-2 border-gray-700">
      <div className="flex gap-4 items-center">
        {isMounted && role && <MenuButton />}
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.svg"
            alt="Stichting Weerwolfhuizen"
            height={40}
            width={40}
            className="h-10 w-10"
            priority
          />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {isMounted && role && (
          <span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold border border-blue-400 shadow-sm">{role}</span>
        )}
        {isMounted ? (
          role ? (
            <button onClick={handleLogout} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm border border-blue-400">Uitloggen</button>
          ) : (
            <a href="/login" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm border border-blue-400">Inloggen</a>
          )
        ) : (
          <div className="w-20 h-8"></div> /* Placeholder during hydration */
        )}
      </div>
    </nav>
  );
}
