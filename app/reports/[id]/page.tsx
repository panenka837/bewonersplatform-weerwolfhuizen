'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ClientProtectedRoute from '@/app/components/ClientProtectedRoute';
import { Report, ReportUpdate, Message } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

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

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  // Gebruik React.use om de params Promise uit te pakken in Next.js 15.3.2
  const resolvedParams = params instanceof Promise ? React.use(params) : params;
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [updates, setUpdates] = useState<ReportUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, email: string, role?: string} | null>(null);
  const [newUpdate, setNewUpdate] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [showChatForm, setShowChatForm] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Laad huidige gebruiker en melding bij het laden van de pagina
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
        
        // Laad melding en updates
        fetchReport(resolvedParams.id);
        fetchUpdates(resolvedParams.id);
      } else {
        setError('Je moet ingelogd zijn om meldingen te bekijken');
        setLoading(false);
      }
    }
  }, [resolvedParams.id]);
  
  // Scroll naar beneden wanneer nieuwe berichten worden toegevoegd
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Haal melding op van de API
  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true);
      // Voeg timestamp toe om caching te voorkomen
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/reports?id=${reportId}&t=${timestamp}`, {
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
      setReport(data);
      
      // Als er een conversationId is, haal dan de berichten op
      if (data.conversationId) {
        fetchMessages(data.conversationId);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Er is een fout opgetreden bij het laden van de melding.');
    } finally {
      setLoading(false);
    }
  };
  
  // Haal updates op van de API
  const fetchUpdates = async (reportId: string) => {
    try {
      // Voeg timestamp toe om caching te voorkomen
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/reports/updates?reportId=${reportId}&t=${timestamp}`, {
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
      setUpdates(data);
    } catch (err) {
      console.error('Error fetching updates:', err);
      // We tonen geen foutmelding voor updates, alleen voor de melding zelf
    }
  };
  
  // Haal berichten op van de API
  const fetchMessages = async (conversationId: string) => {
    try {
      setChatLoading(true);
      // Voeg timestamp toe om caching te voorkomen
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/messages?conversationId=${conversationId}&t=${timestamp}`, {
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
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // We tonen geen foutmelding voor berichten, alleen voor de melding zelf
    } finally {
      setChatLoading(false);
    }
  };
  
  // Voeg een update toe aan de melding
  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !report) {
      setUpdateError('Je moet ingelogd zijn om een update toe te voegen');
      return;
    }
    
    setUpdateError(null);
    setUpdateSuccess(null);
    
    // Valideer form
    if (!newUpdate.trim()) {
      setUpdateError('Update tekst is verplicht.');
      return;
    }
    
    try {
      const response = await fetch('/api/reports/updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId: report.id,
          content: newUpdate,
          authorId: currentUser.id,
          authorName: currentUser.name,
          isPublic
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update de lijst met updates
      setUpdates(prev => [...prev, data]);
      
      // Reset form
      setNewUpdate('');
      setIsPublic(true);
      
      // Toon succes bericht
      setUpdateSuccess('Update is succesvol toegevoegd!');
      
      // Als de status van de melding nog 'NEW' is, update deze naar 'IN_PROGRESS'
      if (report.status === 'NEW') {
        updateReportStatus('IN_PROGRESS');
      }
      
    } catch (err) {
      setUpdateError('Er is een fout opgetreden bij het toevoegen van de update.');
      console.error('Error creating update:', err);
    }
  };
  
  // Update de status van de melding
  const updateReportStatus = async (newStatus: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!report) return;
    
    try {
      const response = await fetch(`/api/reports?id=${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          // Als de status naar 'IN_PROGRESS' gaat en er nog geen assignedToId is, wijs het toe aan de huidige gebruiker
          ...(newStatus === 'IN_PROGRESS' && !report.assignedToId && currentUser ? {
            assignedToId: currentUser.id,
            assignedToName: currentUser.name
          } : {})
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedReport = await response.json();
      setReport(updatedReport);
      
    } catch (err) {
      console.error('Error updating report status:', err);
    }
  };
  
  // Start een chat met de melder
  const startChat = async () => {
    if (!currentUser || !report) return;
    
    // Alleen beheerders en wooncoaches kunnen een chat starten
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'COACH') {
      return;
    }
    
    try {
      // Als er al een conversationId is, gebruik deze
      if (report.conversationId) {
        setShowChatForm(true);
        fetchMessages(report.conversationId);
        return;
      }
      
      // Maak een nieuwe conversatie
      const conversationId = uuidv4();
      
      // Update de melding met de conversationId
      const response = await fetch(`/api/reports?id=${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedReport = await response.json();
      setReport(updatedReport);
      setShowChatForm(true);
      
      // Stuur een welkomstbericht
      sendMessage(
        `Hallo ${report.reporterName}, ik ben ${currentUser.name} en ik ga je helpen met je melding "${report.title}". Hoe kan ik je helpen?`,
        conversationId
      );
      
    } catch (err) {
      console.error('Error starting chat:', err);
    }
  };
  
  // Stuur een bericht
  const sendMessage = async (content: string, conversationId: string) => {
    if (!currentUser || !content.trim()) return;
    
    try {
      const now = new Date().toISOString();
      const recipientId = currentUser.id === report?.reporterId ? report?.assignedToId : report?.reporterId;
      
      // Maak een nieuw bericht
      const newMsg: Message = {
        id: uuidv4(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: recipientId || null,
        content,
        createdAt: now,
        isRead: false,
        type: 'private'
      };
      
      // Voeg het bericht toe aan de lokale staat
      setMessages(prev => [...prev, newMsg]);
      
      // Reset het invoerveld
      setNewMessage('');
      
      // Stuur het bericht naar de API
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMsg,
          conversationId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  // Verstuur een bericht via het formulier
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!report?.conversationId || !newMessage.trim()) return;
    
    sendMessage(newMessage, report.conversationId);
  };
  
  // Format datum voor weergave
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Bepaal of de huidige gebruiker een beheerder of wooncoach is
  const isAdminOrCoach = currentUser?.role === 'ADMIN' || currentUser?.role === 'COACH';
  
  // Bepaal of de chat getoond moet worden
  const showChat = showChatForm && report?.conversationId;
  
  return (
    <ClientProtectedRoute>
      <main className="p-8 max-w-5xl mx-auto">
        <button
          onClick={() => router.push('/reports')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Terug naar meldingen
        </button>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            <span className="ml-2 text-gray-600">Melding laden...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            {error}
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Melding details */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                <div className="flex space-x-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${statusColors[report.status]}`}>
                    {statusLabels[report.status]}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${priorityColors[report.priority]}`}>
                    {priorityLabels[report.priority]}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Categorie</p>
                  <p className="font-medium text-yellow-700">{categoryLabels[report.category]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Datum</p>
                  <p className="font-medium">{formatDate(report.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Gemeld door</p>
                  <p className="font-medium">{report.reporterName}</p>
                </div>
                {report.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Locatie</p>
                    <p className="font-medium">{report.location}</p>
                  </div>
                )}
                {report.assignedToName && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Toegewezen aan</p>
                    <p className="font-medium">{report.assignedToName}</p>
                  </div>
                )}
                {report.resolvedAt && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Opgelost op</p>
                    <p className="font-medium">{formatDate(report.resolvedAt)}</p>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Beschrijving</p>
                <p className="text-gray-800 whitespace-pre-line">{report.description}</p>
              </div>
              
              {/* Acties voor beheerders en wooncoaches */}
              {isAdminOrCoach && (
                <div className="flex flex-wrap gap-2 mt-6 border-t pt-4">
                  {!showChatForm && (
                    <button
                      onClick={startChat}
                      className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Chat met melder
                    </button>
                  )}
                  
                  {report.status !== 'RESOLVED' && (
                    <button
                      onClick={() => updateReportStatus('RESOLVED')}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Markeer als opgelost
                    </button>
                  )}
                  
                  {report.status !== 'CLOSED' && report.status !== 'NEW' && (
                    <button
                      onClick={() => updateReportStatus('CLOSED')}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Sluit melding
                    </button>
                  )}
                  
                  {report.status === 'CLOSED' && (
                    <button
                      onClick={() => updateReportStatus('IN_PROGRESS')}
                      className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Heropen melding
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Chat sectie */}
            {showChat && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Chat met {isAdminOrCoach ? report.reporterName : report.assignedToName || 'beheerder'}</h2>
                
                <div className="border rounded-lg mb-4 h-80 overflow-y-auto p-4 bg-gray-50">
                  {chatLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                      <span className="ml-2 text-gray-600">Berichten laden...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-500">
                      Nog geen berichten. Stuur een bericht om de conversatie te starten.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.senderId === currentUser?.id
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="text-xs mb-1 font-medium">
                              {msg.senderId === currentUser?.id ? 'Jij' : msg.senderName}
                            </div>
                            <div>{msg.content}</div>
                            <div className="text-xs mt-1 opacity-70 text-right">
                              {new Date(msg.createdAt).toLocaleTimeString('nl-NL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Typ een bericht..."
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verstuur
                  </button>
                </form>
              </div>
            )}
            
            {/* Updates sectie */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Updates</h2>
              
              {/* Formulier voor nieuwe update (alleen voor beheerders en wooncoaches) */}
              {isAdminOrCoach && (
                <div className="mb-6 border-b pb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Nieuwe update toevoegen</h3>
                  
                  {updateError && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
                      {updateError}
                    </div>
                  )}
                  
                  {updateSuccess && (
                    <div className="bg-green-50 text-green-800 p-3 rounded-md mb-4">
                      {updateSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleAddUpdate}>
                    <div className="mb-4">
                      <textarea
                        value={newUpdate}
                        onChange={(e) => setNewUpdate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px]"
                        placeholder="Voeg een update toe over de voortgang van deze melding..."
                      />
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor="isPublic" className="text-gray-700">
                        Zichtbaar voor melder
                      </label>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Update toevoegen
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Lijst met updates */}
              {updates.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  Nog geen updates voor deze melding.
                </div>
              ) : (
                <div className="space-y-4">
                  {updates
                    // Filter updates die niet zichtbaar zijn voor de melder als de huidige gebruiker de melder is
                    .filter(update => isAdminOrCoach || update.isPublic)
                    .map(update => (
                      <div key={update.id} className="border-l-4 border-yellow-200 pl-4 py-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{update.authorName}</span>
                          <span className="text-sm text-gray-500">{formatDate(update.createdAt)}</span>
                        </div>
                        <div className="text-gray-800 whitespace-pre-line">{update.content}</div>
                        {!update.isPublic && isAdminOrCoach && (
                          <div className="mt-1 text-xs text-gray-500 italic">
                            Alleen zichtbaar voor beheerders en wooncoaches
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            Melding niet gevonden
          </div>
        )}
      </main>
    </ClientProtectedRoute>
  );
}
