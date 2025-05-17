'use client';

import React, { useState, useEffect } from 'react';

import ClientProtectedRoute from '@/app/components/ClientProtectedRoute';

type Notice = {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

export default function AdminNoticesPage() {
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [important, setImportant] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // Laad alle mededelingen
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notices');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setNotices(data);
      } catch (err) {
        setError('Er is een fout opgetreden bij het laden van de mededelingen.');
        console.error('Error fetching notices:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotices();
  }, []);
  
  // Maak een nieuwe melding aan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset form statussen
    setFormError(null);
    setFormSuccess(null);
    
    // Valideer form
    if (!title.trim() || !content.trim()) {
      setFormError('Titel en inhoud zijn verplicht.');
      return;
    }
    
    try {
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          important,
          expiresAt: expiresAt || undefined, // Als leeg, gebruik de standaard waarde in de API
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newNotice = await response.json();
      
      // Update de lijst met mededelingen
      setNotices(prev => [...prev, newNotice]);
      
      // Reset form
      setTitle('');
      setContent('');
      setImportant(false);
      setExpiresAt('');
      
      // Toon succes bericht
      setFormSuccess('Mededeling is succesvol aangemaakt!');
      
      // Refresh de pagina na 2 seconden
      setTimeout(() => {
        // Forceer een volledige pagina refresh in plaats van alleen de router cache
        window.location.reload();
      }, 2000);
      
    } catch (err) {
      setFormError('Er is een fout opgetreden bij het aanmaken van de mededeling.');
      console.error('Error creating notice:', err);
    }
  };
  
  // Verwijder een mededeling
  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze mededeling wilt verwijderen?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/notices?id=${id}`, {
        method: 'DELETE',
        // Voorkom caching
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Verwijder de mededeling uit de lijst
      setNotices(prev => prev.filter(notice => notice.id !== id));
      
      // Toon succes bericht
      setFormSuccess('Mededeling is succesvol verwijderd!');
      
      // Refresh de pagina na 1 seconde om de wijzigingen persistent te maken
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      setError('Er is een fout opgetreden bij het verwijderen van de mededeling.');
      console.error('Error deleting notice:', err);
    }
  };
  
  // Format datum voor weergave
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <ClientProtectedRoute requireAdmin>
      <main className="p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">Mededelingen beheren</h1>
        
        {/* Formulier voor nieuwe mededeling */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Nieuwe mededeling aanmaken</h2>
          
          {formError && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4">
              {formSuccess}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-1">
                Titel
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="content" className="block text-gray-700 font-medium mb-1">
                Inhoud
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="expiresAt" className="block text-gray-700 font-medium mb-1">
                Vervaldatum (optioneel, standaard 30 dagen)
              </label>
              <input
                type="date"
                id="expiresAt"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={important}
                  onChange={(e) => setImportant(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">Markeren als belangrijk</span>
              </label>
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Melding aanmaken
            </button>
          </form>
        </div>
        
        {/* Lijst met bestaande meldingen */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Bestaande meldingen</h2>
          
          {loading ? (
            <p className="text-gray-600">Meldingen laden...</p>
          ) : error ? (
            <div className="bg-red-50 text-red-800 p-3 rounded-md">
              {error}
            </div>
          ) : notices.length === 0 ? (
            <p className="text-gray-600">Er zijn geen actieve meldingen.</p>
          ) : (
            <div className="space-y-4">
              {notices.map(notice => (
                <div 
                  key={notice.id} 
                  className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${notice.important ? 'border-red-500' : 'border-blue-500'} hover:shadow-lg transition-shadow`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-blue-900 text-lg">{notice.title}</span>
                    <div className="flex space-x-2 items-center">
                      <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-medium">
                        Verloopt: {formatDate(notice.expiresAt)}
                      </span>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Verwijderen"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-800 leading-relaxed">{notice.content}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    Aangemaakt: {formatDate(notice.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </ClientProtectedRoute>
  );
}
