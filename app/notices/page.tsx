'use client';

import React, { useState, useEffect } from "react";

// Format datum voor weergave
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

type Notice = {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  userId?: string; // Optioneel veld voor ID van de gebruiker die het bericht heeft geplaatst
  userName?: string; // Optioneel veld voor naam van de gebruiker die het bericht heeft geplaatst
};

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        // Voeg timestamp toe om caching te voorkomen
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/notices?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setNotices(data);
      } catch (err) {
        console.error('Error fetching notices:', err);
        setError('Er is een fout opgetreden bij het laden van de mededelingen.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotices();
  }, []);
  
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">Mededelingen</h1>
      
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Mededelingen laden...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      ) : notices.length === 0 ? (
        <p className="text-gray-600">Er zijn momenteel geen mededelingen.</p>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${notice.important ? 'border-red-500' : 'border-blue-500'} hover:shadow-lg transition-shadow`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-900 text-lg">{notice.title}</span>
                <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-medium">
                  {formatDate(notice.createdAt)}
                </span>
              </div>
              <div className="text-gray-800 leading-relaxed">{notice.content}</div>
              {notice.important && (
                <div className="mt-2 inline-block bg-red-50 text-red-800 px-2 py-1 rounded-md text-sm font-medium">
                  Belangrijk
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
