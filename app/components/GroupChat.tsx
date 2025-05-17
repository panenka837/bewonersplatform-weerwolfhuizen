'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/lib/types';


type GroupChatProps = {
  currentUser: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export default function GroupChat({ currentUser }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Laad groepsberichten
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        // Haal alleen groepsberichten op (waar recipientId expliciet null is)
        // We specificeren ook het type=group om ervoor te zorgen dat alleen groepsberichten worden opgehaald
        const response = await fetch(`/api/messages?recipientId=null&type=group`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Combineer de nieuwe berichten van de server met de bestaande berichten
        // maar behoud lokaal toegevoegde berichten die nog niet in de database zitten
        setMessages(prevMessages => {
          // Gebruik een Set om dubbele berichten te voorkomen op basis van ID
          const messageIds = new Set(data.map((msg: Message) => msg.id));
          
          // Filter bestaande berichten die niet in de nieuwe data zitten
          // Deze zijn mogelijk lokaal toegevoegd maar nog niet gesynchroniseerd met de server
          const localOnlyMessages = prevMessages.filter((msg: Message) => !messageIds.has(msg.id));
          
          // Berichten zijn al gesorteerd door de API (oudste eerst)
          // We voegen alleen lokale berichten toe en behouden de sortering
          const combinedMessages = [...data, ...localOnlyMessages];
          
          return combinedMessages;
        });
      } catch (err) {
        setError('Er is een fout opgetreden bij het laden van de berichten');
        console.error('Error fetching group messages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Polling voor nieuwe berichten elke 5 seconden
    const interval = setInterval(fetchMessages, 5000);
    
    return () => clearInterval(interval);
  }, [currentUser]);
  
  // Scroll naar het laatste bericht
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Verstuur een nieuw groepsbericht
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !newMessage.trim()) return;
    
    try {
      console.log('Sending group message with data:', {
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: null,
        content: newMessage,
        type: 'group'
      });
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.name,
          recipientId: null, // null betekent een groepsbericht
          content: newMessage,
          type: 'group' // Expliciet aangeven dat dit een groepsbericht is
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Voeg het nieuwe bericht toe aan de lijst
      setMessages(prev => [...prev, data]);
      
      // Reset het invoerveld
      setNewMessage('');
    } catch (err) {
      setError('Er is een fout opgetreden bij het versturen van het bericht');
      console.error('Error sending group message:', err);
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
  
  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-500">
        Je moet ingelogd zijn om deel te nemen aan de groepschat.
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">Groepschat</h3>
          <div className="text-xs text-blue-600 font-medium">
            Alle gebruikers
          </div>
        </div>
      </div>
      
      {/* Berichten */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col">
        {loading && messages.length === 0 ? (
          <p className="text-gray-600">Berichten laden...</p>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-3 rounded-md">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <p className="text-gray-600 text-center">Geen berichten. Stuur een bericht om de groepschat te starten.</p>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
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
                  {message.senderId !== currentUser.id && (
                    <div className="font-medium text-xs mb-1">
                      {message.senderName}
                    </div>
                  )}
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
            placeholder="Typ een bericht voor iedereen..."
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
    </div>
  );
}
