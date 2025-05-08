"use client";
import React from "react";
import Link from "next/link";
import MenuButton from "./MenuButton";

export default function NavBar() {
  const [role, setRole] = React.useState<string | null>(null);
  React.useEffect(() => {
    setRole(typeof window !== 'undefined' ? localStorage.getItem('user_role') : null);
  }, []);

  function handleLogout() {
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    window.location.href = '/login';
  }

  return (
    <nav className="bg-white shadow-lg rounded-b-xl px-6 py-3 flex items-center justify-between mb-8 border-b-2 border-blue-200">
      <div className="flex gap-4 items-center">
        {role && <MenuButton />}
        <Link href="/" className="text-blue-900 font-bold text-lg hover:underline">Weerwolfhuizen</Link>
      </div>
      <div className="flex items-center gap-4">
        {role && (
          <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-bold border border-blue-200 shadow-sm">{role}</span>
        )}
        {role ? (
          <button onClick={handleLogout} className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition text-sm">Uitloggen</button>
        ) : (
          <a href="/login" className="bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition text-sm">Inloggen</a>
        )}
      </div>
    </nav>
  );
}
