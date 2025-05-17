"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

const menuItems = [
  { href: "/notices", label: "Mededelingen" },
  { href: "/reports", label: "Meldingen" },
  { href: "/calendar", label: "Kalender" },
  { href: "/documents", label: "Documenten" },
  { href: "/bulletin", label: "Bewoners Prikbord" },
  { href: "/board", label: "Marktplaats" },
  { href: "/chat", label: "Chat" },
];

export default function MenuButton() {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setUserRole(localStorage.getItem('user_role'));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isMounted) {
    return (
      <div className="w-24 h-10"></div> // Placeholder during hydration
    );
  }

  return (
    <div className="relative">
      <button
        aria-label="Open navigatiemenu"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-400"
        onClick={() => setOpen(v => !v)}
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect y="4" width="24" height="2" rx="1" fill="#fff"/><rect y="11" width="24" height="2" rx="1" fill="#fff"/><rect y="18" width="24" height="2" rx="1" fill="#fff"/></svg>
        Menu
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 animate-fade-in">
          <ul className="py-2">
            {menuItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-gray-800 font-medium hover:bg-blue-500 hover:text-white rounded-lg transition-colors my-1 mx-1"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            
            {/* Beheerdersfunctionaliteit toevoegen voor ADMIN en COACH */}
            {userRole && (userRole === 'ADMIN' || userRole === 'COACH') && (
              <>
                <li className="border-t border-gray-300 mt-2 pt-2">
                  <div className="px-4 py-1 text-sm font-bold text-blue-600">Beheer</div>
                </li>
                <li>
                  <Link
                    href="/admin/appointments"
                    className="block px-4 py-2 text-gray-800 font-medium hover:bg-blue-500 hover:text-white rounded-lg transition-colors my-1 mx-1"
                    onClick={() => setOpen(false)}
                  >
                    Afspraken controleren
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/notices"
                    className="block px-4 py-2 text-gray-800 font-medium hover:bg-blue-500 hover:text-white rounded-lg transition-colors my-1 mx-1"
                    onClick={() => setOpen(false)}
                  >
                    Mededelingen beheren
                  </Link>
                </li>
                {userRole === 'ADMIN' && (
                  <li>
                    <Link
                      href="/admin/users"
                      className="block px-4 py-2 text-gray-800 font-medium hover:bg-blue-500 hover:text-white rounded-lg transition-colors my-1 mx-1"
                      onClick={() => setOpen(false)}
                    >
                      Gebruikersbeheer
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
