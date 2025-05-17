'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Format datum voor weergave
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

type BulletinPost = {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userName: string;
};

export default function BulletinPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BulletinPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    important: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);  // ID van bericht dat verwijderd wordt
  
  // Haal de huidige gebruiker op uit localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('user_id');
      const userName = localStorage.getItem('user_name');
      
      if (userId && userName) {
        setCurrentUser({
          id: userId,
          name: userName
        });
      }
    }
  }, []);

  useEffect(() => {
    const fetchBulletinPosts = async () => {
      try {
        setLoading(true);
        // Voeg timestamp toe om caching te voorkomen
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/bulletin?t=${timestamp}`, {
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
        setPosts(data);
      } catch (err) {
        console.error('Error fetching bulletin posts:', err);
        setError('Er is een fout opgetreden bij het laden van de prikbord berichten.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBulletinPosts();
  }, []);

  // Handler voor het toevoegen van een nieuw bericht
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Je moet ingelogd zijn om een bericht te plaatsen');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await fetch('/api/bulletin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: currentUser.id,
          userName: currentUser.name
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newPost = await response.json();
      
      // Voeg het nieuwe bericht toe aan de lijst
      setPosts(prev => [newPost, ...prev]);
      
      // Reset het formulier
      setFormData({
        title: '',
        content: '',
        important: false
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating bulletin post:', err);
      setError('Er is een fout opgetreden bij het plaatsen van het bericht.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler voor het verwijderen van een bericht
  const handleDelete = async (id: string) => {
    if (!currentUser) {
      setError('Je moet ingelogd zijn om een bericht te verwijderen');
      return;
    }
    
    try {
      const response = await fetch(`/api/bulletin?id=${id}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Verwijder het bericht uit de lijst
      setPosts(prev => prev.filter(post => post.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting bulletin post:', err);
      setError(`Er is een fout opgetreden bij het verwijderen van het bericht: ${err instanceof Error ? err.message : 'Onbekende fout'}`);
    }
  };

  // Handler voor het starten van een chat met de gebruiker
  const startChat = (userId: string, userName: string) => {
    if (!currentUser) {
      setError('Je moet ingelogd zijn om te chatten');
      return;
    }
    
    // Navigeer naar de chat pagina met de juiste gebruiker
    router.push(`/messages?recipientId=${userId}&recipientName=${encodeURIComponent(userName)}`);
  };
  
  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b-2 border-blue-200 pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Bewoners Prikbord</h1>
        {currentUser && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            {showForm ? 'Annuleren' : 'Bericht plaatsen'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
          {error}
          <button 
            className="ml-2 text-red-600 hover:text-red-800" 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nieuw bericht plaatsen</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Bericht</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                required
              />
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="important"
                checked={formData.important}
                onChange={(e) => setFormData({...formData, important: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="important" className="text-sm font-medium text-gray-700">Markeren als belangrijk</label>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-blue-300"
              >
                {submitting ? 'Bezig met plaatsen...' : 'Plaatsen'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Berichten laden...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-600">Er zijn momenteel geen berichten op het prikbord.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div 
              key={post.id} 
              className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${post.important ? 'border-red-500' : 'border-blue-500'} hover:shadow-lg transition-shadow`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-900 text-lg">{post.title}</span>
                <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-medium">
                  {formatDate(post.createdAt)}
                </span>
              </div>
              <div className="text-gray-800 leading-relaxed mb-3">{post.content}</div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600">Geplaatst door: </span>
                  <span 
                    className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={() => post.userId !== 'anonymous' && startChat(post.userId, post.userName)}
                    title={post.userId !== 'anonymous' ? 'Klik om te chatten' : ''}
                  >
                    {post.userName}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {post.important && (
                    <div className="inline-block bg-red-50 text-red-800 px-2 py-1 rounded-md text-sm font-medium">
                      Belangrijk
                    </div>
                  )}
                  
                  {currentUser && (currentUser.id === post.userId || currentUser.id === 'admin') && (
                    deleteConfirm === post.id ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Zeker weten?</span>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          className="text-sm bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Ja
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(null)}
                          className="text-sm bg-gray-200 text-gray-800 px-2 py-1 rounded hover:bg-gray-300"
                        >
                          Nee
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeleteConfirm(post.id)}
                        className="text-sm text-gray-500 hover:text-red-500"
                      >
                        Verwijderen
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
