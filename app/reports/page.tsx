'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientProtectedRoute from '@/app/components/ClientProtectedRoute';
import { Report } from '@/lib/types';

const categoryLabels = {
  'MAINTENANCE': 'Onderhoud',
  'COMPLAINT': 'Klacht',
  'SUGGESTION': 'Suggestie',
  'OTHER': 'Overig'
};

const statusLabels = {
  'NEW': 'Nieuw',
  'IN_PROGRESS': 'In behandeling',
  'RESOLVED': 'Opgelost',
  'CLOSED': 'Gesloten'
};

const priorityLabels = {
  'LOW': 'Laag',
  'MEDIUM': 'Gemiddeld',
  'HIGH': 'Hoog'
};

const priorityColors = {
  'LOW': 'bg-green-100 text-green-800',
  'MEDIUM': 'bg-yellow-100 text-yellow-800',
  'HIGH': 'bg-red-100 text-red-800'
};

const statusColors = {
  'NEW': 'bg-blue-100 text-blue-800',
  'IN_PROGRESS': 'bg-purple-100 text-purple-800',
  'RESOLVED': 'bg-green-100 text-green-800',
  'CLOSED': 'bg-gray-100 text-gray-800'
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, email: string, role?: string} | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'MAINTENANCE' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER'>('MAINTENANCE');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // Laad huidige gebruiker en meldingen bij het laden van de pagina
  useEffect(() => {
    // Wacht tot de component is gemount om localStorage te gebruiken
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('user_id') || '';
      const userName = localStorage.getItem('user_name') || '';
      const userEmail = localStorage.getItem('user_email') || '';
      const userRole = localStorage.getItem('user_role');
      
      // Als er een userRole is, dan is de gebruiker ingelogd
      if (userRole) {
        // Als userId ontbreekt maar er is wel een userRole, gebruik dan een persistente ID
        let persistentId = userId;
        
        // Als er nog geen persistente ID is, maak er dan een aan en sla deze op
        if (!persistentId) {
          persistentId = `user-${Date.now()}`;
          localStorage.setItem('user_id', persistentId);
        }
        
        setCurrentUser({
          id: persistentId,
          name: userName || 'Gebruiker',
          email: userEmail || 'gebruiker@weerwolfhuizen.nl',
          role: userRole
        });
        
        // Laad meldingen op basis van de rol van de gebruiker
        if (userRole === 'ADMIN' || userRole === 'COACH') {
          // Beheerders en wooncoaches zien alle meldingen
          fetchAllReports();
        } else {
          // Bewoners zien alleen hun eigen meldingen
          fetchUserReports(persistentId);
        }
      } else {
        setError('Je moet ingelogd zijn om meldingen te bekijken');
        setLoading(false);
      }
    }
  }, []);
  
  // Haal alle meldingen op van de API (voor beheerders en wooncoaches)
  const fetchAllReports = async () => {
    try {
      setLoading(true);
      // Voeg timestamp toe om caching te voorkomen
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/reports?t=${timestamp}`, {
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
      setReports(data);
    } catch (err) {
      console.error('Error fetching all reports:', err);
      setError('Er is een fout opgetreden bij het laden van de meldingen.');
    } finally {
      setLoading(false);
    }
  };

  // Haal meldingen van een specifieke gebruiker op (voor bewoners)
  const fetchUserReports = async (userId: string) => {
    try {
      setLoading(true);
      // Voeg timestamp toe om caching te voorkomen
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/reports?reporterId=${userId}&t=${timestamp}`, {
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
      setReports(data);
    } catch (err) {
      console.error('Error fetching user reports:', err);
      setError('Er is een fout opgetreden bij het laden van de meldingen.');
    } finally {
      setLoading(false);
    }
  };
  
  // Dien een nieuwe melding in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setFormError('Je moet ingelogd zijn om een melding in te dienen');
      return;
    }
    
    setFormError(null);
    setFormSuccess(null);
    
    // Valideer form
    if (!title.trim() || !description.trim()) {
      setFormError('Titel en beschrijving zijn verplicht.');
      return;
    }
    
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          reporterId: currentUser.id,
          reporterName: currentUser.name,
          location: location || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newReport = await response.json();
      
      // Update de lijst met meldingen
      setReports(prev => [newReport, ...prev]);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('MAINTENANCE');
      setLocation('');
      
      // Toon succes bericht
      setFormSuccess('Melding is succesvol ingediend!');
      
      // Verberg het formulier na 2 seconden
      setTimeout(() => {
        setShowNewReportForm(false);
      }, 2000);
      
    } catch (err) {
      setFormError('Er is een fout opgetreden bij het indienen van de melding.');
      console.error('Error creating report:', err);
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
  
  // Bekijk details van een melding
  const viewReportDetails = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  // Update de status van een melding (alleen voor beheerders en wooncoaches)
  const updateReportStatus = async (reportId: string, newStatus: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'COACH')) {
      setError('Je hebt geen rechten om de status van meldingen te wijzigen');
      return;
    }

    try {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          assignedToId: currentUser.id,
          assignedToName: currentUser.name
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedReport = await response.json();
      
      // Update de lijst met meldingen
      setReports(prev => prev.map(report => 
        report.id === reportId ? updatedReport : report
      ));

    } catch (err) {
      console.error('Error updating report status:', err);
      setError('Er is een fout opgetreden bij het bijwerken van de status.');
    }
  };
  
  return (
    <ClientProtectedRoute>
      <main className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 border-b-2 border-yellow-200 pb-2">
            {currentUser?.role === 'ADMIN' || currentUser?.role === 'COACH' ? 'Alle meldingen' : 'Mijn meldingen'}
          </h1>
          <button
            onClick={() => setShowNewReportForm(!showNewReportForm)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {showNewReportForm ? 'Annuleren' : 'Nieuwe melding'}
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            <span className="ml-2 text-gray-600">Meldingen laden...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            {showNewReportForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Nieuwe melding indienen</h2>
                
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
                    <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Titel</label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Korte omschrijving van de melding"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="category" className="block text-gray-700 font-medium mb-2">Categorie</label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as "MAINTENANCE" | "COMPLAINT" | "SUGGESTION" | "OTHER")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="MAINTENANCE">Onderhoud</option>
                      <option value="COMPLAINT">Klacht</option>
                      <option value="SUGGESTION">Suggestie</option>
                      <option value="OTHER">Overig</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="location" className="block text-gray-700 font-medium mb-2">Locatie (optioneel)</label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="Bijv. Appartement 3B, gemeenschappelijke tuin, etc."
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700 font-medium mb-2">Beschrijving</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[120px]"
                      placeholder="Geef een duidelijke beschrijving van de melding"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                    >
                      Melding indienen
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {reports.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-600 mb-4">Je hebt nog geen meldingen ingediend.</p>
                <button
                  onClick={() => setShowNewReportForm(true)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Nieuwe melding indienen
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map(report => (
                  <div 
                    key={report.id} 
                    className="bg-white rounded-lg shadow-md p-5 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span 
                        className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-blue-600"
                        onClick={() => viewReportDetails(report.id)}
                      >
                        {report.title}
                      </span>
                      <div className="flex space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[report.status]}`}>
                          {statusLabels[report.status]}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[report.priority]}`}>
                          {priorityLabels[report.priority]}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-yellow-700 font-medium">
                        {categoryLabels[report.category]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                    <div 
                      className="text-gray-600 line-clamp-2 cursor-pointer hover:text-blue-600"
                      onClick={() => viewReportDetails(report.id)}
                    >
                      {report.description}
                    </div>
                    {report.location && (
                      <div className="mt-2 text-sm text-gray-500">
                        <span className="font-medium">Locatie:</span> {report.location}
                      </div>
                    )}
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'COACH') && (
                      <div className="mt-2 text-sm text-blue-600">
                        <span className="font-medium">Gemeld door:</span> {report.reporterName}
                      </div>
                    )}
                    
                    {/* Beheerders en wooncoaches kunnen de status wijzigen */}
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'COACH') && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateReportStatus(report.id, 'IN_PROGRESS');
                          }}
                          className={`text-xs px-3 py-1 rounded-md ${report.status === 'IN_PROGRESS' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200'}`}
                          disabled={report.status === 'IN_PROGRESS'}
                        >
                          In behandeling
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateReportStatus(report.id, 'RESOLVED');
                          }}
                          className={`text-xs px-3 py-1 rounded-md ${report.status === 'RESOLVED' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          disabled={report.status === 'RESOLVED'}
                        >
                          Opgelost
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateReportStatus(report.id, 'CLOSED');
                          }}
                          className={`text-xs px-3 py-1 rounded-md ${report.status === 'CLOSED' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                          disabled={report.status === 'CLOSED'}
                        >
                          Sluiten
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </ClientProtectedRoute>
  );
}
