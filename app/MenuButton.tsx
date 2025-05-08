"use client";
import React from "react";
import Link from "next/link";

const menuItems = [
  { href: "/notices", label: "Mededelingen" },
  { href: "/reports", label: "Meldingen" },
  { href: "/calendar", label: "Kalender" },
  { href: "/documents", label: "Documenten" },
  { href: "/board", label: "Prikbord" },
];

export default function MenuButton() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        aria-label="Open navigatiemenu"
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-700 text-white font-semibold shadow-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-blue-600"
        onClick={() => setOpen(v => !v)}
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect y="4" width="24" height="2" rx="1" fill="#fff"/><rect y="11" width="24" height="2" rx="1" fill="#fff"/><rect y="18" width="24" height="2" rx="1" fill="#fff"/></svg>
        Menu
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border-2 border-blue-200 z-50 animate-fade-in">
          <ul className="py-2">
            {menuItems.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-gray-800 font-medium hover:bg-blue-100 hover:text-blue-900 rounded-lg transition-colors my-1 mx-1"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
