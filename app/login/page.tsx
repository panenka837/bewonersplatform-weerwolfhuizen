"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const roles = [
  { value: "beheerder", label: "Beheerder" },
  { value: "wooncoach", label: "Wooncoach" },
  { value: "bewoner", label: "Bewoner" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[2].value);
  const router = useRouter();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Simpele role-based login (demo):
    if (email && role) {
      localStorage.setItem("user_role", role);
      localStorage.setItem("user_email", email);
      router.push("/");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <form
        onSubmit={handleLogin}
        className="bg-white/95 shadow-2xl rounded-xl p-8 w-full max-w-sm border-2 border-blue-300 relative"
      >
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 rounded-full p-3 shadow-md">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#2563eb" /><path d="M12 13c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z" fill="#fff"/></svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-800">Inloggen bewonersplatform</h1>
        <label className="block mb-2 font-semibold text-blue-900">E-mail</label>
        <input
          type="email"
          required
          className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 mb-4 bg-blue-50 placeholder-blue-300 text-blue-900 outline-none transition"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="jouw@email.nl"
        />
        <label className="block mb-2 font-semibold text-blue-900">Rol</label>
        <select
          className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 mb-6 bg-blue-50 text-blue-900 outline-none transition"
          value={role}
          onChange={e => setRole(e.target.value)}
        >
          {roles.map(r => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full bg-blue-700 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-800 transition border border-blue-800/30"
        >
          Inloggen
        </button>
      </form>
    </main>
  );
}
