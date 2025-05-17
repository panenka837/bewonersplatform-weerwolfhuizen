"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Controleer of de gebruiker al is ingelogd
    const token = localStorage.getItem("auth_token");
    if (token) {
      router.push("/");
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Valideer invoer
      if (!email || !password) {
        setError("Vul alle verplichte velden in");
        setLoading(false);
        return;
      }
      
      // Verstuur login verzoek naar de API
      const response = await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Er is een fout opgetreden bij het inloggen");
        setLoading(false);
        return;
      }
      
      // Sla de token en gebruikersgegevens op
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_role", data.user.role);
      localStorage.setItem("user_email", data.user.email);
      localStorage.setItem("user_name", data.user.name || "");
      localStorage.setItem("user_id", data.user.id || "");
      
      // Navigeer naar de homepage
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      setError("Er is een fout opgetreden bij het inloggen");
      setLoading(false);
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
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}
        
        <label className="block mb-2 font-semibold text-blue-900">E-mail</label>
        <input
          type="email"
          required
          className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 mb-4 bg-blue-50 placeholder-blue-300 text-blue-900 outline-none transition"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="jouw@email.nl"
          disabled={loading}
        />
        
        <label className="block mb-2 font-semibold text-blue-900">Wachtwoord</label>
        <input
          type="password"
          required
          className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded px-3 py-2 mb-6 bg-blue-50 placeholder-blue-300 text-blue-900 outline-none transition"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={loading}
        />
        
        <button
          type="submit"
          className={`w-full bg-blue-700 text-white font-semibold py-2 rounded-lg shadow hover:bg-blue-800 transition border border-blue-800/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Bezig met inloggen...' : 'Inloggen'}
        </button>
        
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">Nog geen account? Neem contact op met de beheerder.</p>
        </div>
      </form>
    </main>
  );
}
