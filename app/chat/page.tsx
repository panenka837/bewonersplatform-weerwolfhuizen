'use client';

import React, { useState, useEffect, useRef } from 'react';

import ClientProtectedRoute from '@/app/components/ClientProtectedRoute';
import OnlineStatus from '@/app/components/OnlineStatus';
import GroupChat from '@/app/components/GroupChat';
import { Message, UserWithoutPassword } from '@/lib/types';

export default function ChatPage() {

  const [users, setUsers] = useState<UserWithoutPassword[]>([]);
  // Gebruik een map om berichten per gebruiker op te slaan
  const [messagesMap, setMessagesMap] = useState<Map<string, Message[]>>(new Map());
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithoutPassword | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, email: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'private' | 'group'>('private');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Laad huidige gebruiker bij het laden van de pagina
  useEffect(() => {
    // Wacht tot de component is gemount om localStorage te gebruiken
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('user_id') || '';
      const userName = localStorage.getItem('user_name') || '';
      const userEmail = localStorage.getItem('user_email') || '';
      const userRole = localStorage.getItem('user_role');
      
      console.log('Auth check:', { userId, userName, userEmail, userRole });
      
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
          email: userEmail || 'gebruiker@weerwolfhuizen.nl'
        });
      } else {
        setError('Je moet ingelogd zijn om te chatten');
      }
    }
  }, []);
  
  // Laad alle gebruikers
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched users:', data);
        
        // Controleer of de response het nieuwe formaat heeft (met users en pagination)
        const usersArray = data.users ? data.users : (Array.isArray(data) ? data : []);
        console.log('Users array:', usersArray);
        
        // Filter de huidige gebruiker uit de lijst als deze bekend is
        let filteredUsers = usersArray;
        if (currentUser?.id) {
          filteredUsers = usersArray.filter((user: UserWithoutPassword) => 
            user.id !== currentUser.id
          );
        }
        
        setUsers(filteredUsers);
      } catch (err) {
        setError('Er is een fout opgetreden bij het laden van de gebruikers');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);
  
  // Laad berichten wanneer een gebruiker is geselecteerd
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser || !selectedUser) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/messages?userId=${currentUser.id}&recipientId=${selectedUser.id}&type=private`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update de berichten voor deze specifieke gebruiker in de map
        // maar behoud lokaal toegevoegde berichten die nog niet in de database zitten
        setMessagesMap(prevMap => {
          const newMap = new Map(prevMap);
          const currentMessages = newMap.get(selectedUser.id) || [];
          
          // Combineer de nieuwe berichten van de server met de bestaande berichten
          // Gebruik een Set om dubbele berichten te voorkomen op basis van ID
          const messageIds = new Set(data.map((msg: Message) => msg.id));
          
          // Filter bestaande berichten die niet in de nieuwe data zitten
          // Deze zijn mogelijk lokaal toegevoegd maar nog niet gesynchroniseerd met de server
          const localOnlyMessages = currentMessages.filter((msg: Message) => !messageIds.has(msg.id));
          
          // Berichten zijn al gesorteerd door de API (oudste eerst)
          // We voegen alleen lokale berichten toe en behouden de sortering
          const combinedMessages = [...data, ...localOnlyMessages];
          
          newMap.set(selectedUser.id, combinedMessages);
          return newMap;
        });
        
        // Markeer berichten als gelezen
        markMessagesAsRead();
      } catch (err) {
        setError('Er is een fout opgetreden bij het laden van de berichten');
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Polling voor nieuwe berichten elke 5 seconden
    const interval = setInterval(fetchMessages, 5000);
    
    return () => clearInterval(interval);
  }, [selectedUser, currentUser]);
  
  // Scroll naar het laatste bericht
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesMap, selectedUser]);
  
  // Markeer berichten als gelezen
  const markMessagesAsRead = async () => {
    if (!currentUser || !selectedUser) return;
    
    try {
      console.log('Marking messages as read with data:', {
        userId: currentUser.id,
        senderId: selectedUser.id
      });
      
      const response = await fetch('/api/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          senderId: selectedUser.id
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };
  
  // Verstuur een nieuw bericht
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !selectedUser || !newMessage.trim()) return;
    
    try {
      console.log('Sending message with data:', {
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: selectedUser.id,
        content: newMessage,
        type: 'private'
      });
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          recipientId: selectedUser.id,
          content: newMessage,
          type: 'private'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Voeg het nieuwe bericht toe aan de lijst voor deze specifieke gebruiker
      setMessagesMap(prevMap => {
        const newMap = new Map(prevMap);
        const currentMessages = newMap.get(selectedUser.id) || [];
        newMap.set(selectedUser.id, [...currentMessages, data]);
        return newMap;
      });
      
      // Reset het invoerveld
      setNewMessage('');
    } catch (err) {
      setError('Er is een fout opgetreden bij het versturen van het bericht');
      console.error('Error sending message:', err);
    }
  };
  
  // Selecteer een gebruiker om mee te chatten
  const selectUser = (user: UserWithoutPassword) => {
    setSelectedUser(user);
    setError(null);
    
    // Laad berichten voor deze gebruiker als ze nog niet geladen zijn
    if (!messagesMap.has(user.id)) {
      setMessagesMap(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(user.id, []);
        return newMap;
      });
    }
  };
  
  // Format datum voor weergave
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' - ' + date.toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Bereken ongelezen berichten voor een gebruiker
  const getUnreadCount = (userId: string): number => {
    const messages = messagesMap.get(userId) || [];
    return messages.filter(
      msg => msg.senderId === userId && !msg.isRead
    ).length;
  };
  
  return (
    <ClientProtectedRoute>
      <main className="p-4 md:p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b-2 border-blue-200 pb-2">Chat</h1>
        
        {!currentUser ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            Je moet ingelogd zijn om te chatten. <a href="/login" className="underline">Log in</a>
          </div>
        ) : (
          <>
            <div className="mb-4 border-b border-gray-200">
              <div className="flex">
                <button
                  className={`py-2 px-4 font-medium ${activeTab === 'private' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('private')}
                >
                  Privé chats
                </button>
                <button
                  className={`py-2 px-4 font-medium ${activeTab === 'group' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('group')}
                >
                  Groepschat
                </button>
              </div>
            </div>
            
            {activeTab === 'private' ? (
              <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-240px)]">
                {/* Gebruikerslijst */}
                <div className="w-full md:w-1/4 bg-white rounded-lg shadow-md p-4 overflow-y-auto">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">Gebruikers</h2>
                  
                  {loading && users.length === 0 ? (
                    <p className="text-gray-600">Gebruikers laden...</p>
                  ) : error ? (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md">
                      {error}
                    </div>
                  ) : users.length === 0 ? (
                    <p className="text-gray-600">Geen andere gebruikers gevonden.</p>
                  ) : (
                    <ul className="space-y-2">
                      {users.map(user => {
                        const unreadCount = getUnreadCount(user.id);
                        
                        return (
                          <li 
                            key={user.id}
                            className={`p-2 rounded-md cursor-pointer transition-colors ${
                              selectedUser?.id === user.id 
                                ? 'bg-blue-500 text-white' 
                                : 'hover:bg-gray-100 text-gray-800'
                            }`}
                            onClick={() => selectUser(user)}
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{user.name}</div>
                              <div className="flex items-center">
                                {unreadCount > 0 && (
                                  <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-bold ${
                                    selectedUser?.id === user.id 
                                      ? 'bg-white text-blue-600' 
                                      : 'bg-blue-600 text-white'
                                  } rounded-full mr-2`}>
                                    {unreadCount}
                                  </span>
                                )}
                                <OnlineStatus 
                                  userId={user.id} 
                                  className={selectedUser?.id === user.id ? 'text-white' : ''}
                                />
                              </div>
                            </div>
                            <div className="text-xs opacity-80">{user.email}</div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                
                {/* Chat venster */}
                <div className="flex-1 bg-white rounded-lg shadow-md flex flex-col">
                  {selectedUser ? (
                    <>
                      {/* Header */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-gray-800">{selectedUser.name}</h3>
                          <OnlineStatus userId={selectedUser.id} />
                        </div>
                        <div className="text-xs text-gray-500">{selectedUser.email}</div>
                      </div>
                      
                      {/* Berichten */}
                      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
                        {loading && (!messagesMap.has(selectedUser.id) || messagesMap.get(selectedUser.id)?.length === 0) ? (
                          <p className="text-gray-600">Berichten laden...</p>
                        ) : error ? (
                          <div className="bg-red-50 text-red-800 p-3 rounded-md">
                            {error}
                          </div>
                        ) : !messagesMap.has(selectedUser.id) || messagesMap.get(selectedUser.id)?.length === 0 ? (
                          <p className="text-gray-600 text-center">Geen berichten. Stuur een bericht om de conversatie te starten.</p>
                        ) : (
                          <div className="space-y-4">
                            {(messagesMap.get(selectedUser.id) || []).map((message: Message) => (
                              <div 
                                key={message.id} 
                                className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[80%] rounded-lg p-3 ${
                                    message.senderId === currentUser.id 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <div className="text-sm">{message.content}</div>
                                  <div className="text-xs mt-1 opacity-80">
                                    {formatDate(message.createdAt)}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </div>
                      
                      {/* Bericht invoer */}
                      <div className="p-4 border-t border-gray-200">
                        <form onSubmit={sendMessage} className="flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Typ een bericht..."
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={!newMessage.trim()}
                          >
                            Verstuur
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                      Selecteer een gebruiker om een gesprek te starten
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-[calc(100vh-240px)]">
                <GroupChat currentUser={currentUser} />
              </div>
            )}
          </>
        )}
      </main>
    </ClientProtectedRoute>
  );
}
