"use client";

import React from "react";
import Link from "next/link";
import ClientProtectedRoute from "./components/ClientProtectedRoute";

function HomePage() {
  return (
    <main className="p-8 max-w-5xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welkom bij het Bewonersplatform Weerwolfhuizen</h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          Uw online portaal voor alle informatie, meldingen en communicatie binnen onze woongemeenschap.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Laatste mededelingen</h2>
          <ul className="space-y-2">
            <li className="text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span>Brandalarmtest op vrijdag 10 mei</span>
            </li>
            <li className="text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span>Schoonmaak trappenhuis op maandag</span>
            </li>
            <li className="text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span>Nieuwe huismeester vanaf 15 mei</span>
            </li>
          </ul>
          <div className="mt-4">
            <Link href="/notices" className="text-blue-700 font-semibold hover:underline">Alle mededelingen →</Link>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Komende evenementen</h2>
          <ul className="space-y-2">
            <li className="text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>13 mei - Bingo-avond in de lounge</span>
            </li>
            <li className="text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>16 mei - Wekelijkse koffieochtend</span>
            </li>
            <li className="text-gray-800 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>20 mei - Informatiebijeenkomst energiebesparing</span>
            </li>
          </ul>
          <div className="mt-4">
            <Link href="/calendar" className="text-green-700 font-semibold hover:underline">Volledige kalender →</Link>
          </div>
        </div>
      </div>



      <div className="text-center text-gray-600 text-sm">
        <p>© 2025 Bewonersplatform Weerwolfhuizen. Alle rechten voorbehouden.</p>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ClientProtectedRoute>
      <HomePage />
    </ClientProtectedRoute>
  );
}
