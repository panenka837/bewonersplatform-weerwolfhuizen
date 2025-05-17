"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: 'TE_KOOP' | 'AANGEBODEN' | 'GEZOCHT' | 'DIENSTEN';
  condition?: 'NIEUW' | 'ALS_NIEUW' | 'GOED' | 'GEBRUIKT' | 'BESCHADIGD';
  images?: string[];
  userId: string;
  userName: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
};

type User = {
  id: string;
  name: string;
  role: string;
};

export default function BoardPage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<'TE_KOOP' | 'AANGEBODEN' | 'GEZOCHT' | 'DIENSTEN'>('AANGEBODEN');
  const [condition, setCondition] = useState<'NIEUW' | 'ALS_NIEUW' | 'GOED' | 'GEBRUIKT' | 'BESCHADIGD' | ''>('');
  const [contactInfo, setContactInfo] = useState('');

  // Haal huidige gebruiker op (in een echte app zou dit via een auth systeem gaan)
  useEffect(() => {
    // Voor demonstratiedoeleinden, simuleren we een ingelogde gebruiker
    const mockUser = {
      id: '1',
      name: 'Jan Bewoner',
      role: 'USER'
    };
    
    setCurrentUser(mockUser);
  }, []);

  // Haal marktplaats items op
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/board');
        
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van marktplaats items');
        }
        
        const data = await response.json();
        setItems(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching marketplace items:', error);
        setError('Kon geen marktplaats items ophalen. Probeer het later opnieuw.');
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Reset formulier
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('AANGEBODEN');
    setCondition('');
    setContactInfo('');
    setEditingItem(null);
  };

  // Toon formulier voor bewerken
  const handleEdit = (item: MarketplaceItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description);
    setPrice(item.price !== null ? item.price.toString() : '');
    setCategory(item.category);
    setCondition(item.condition || '');
    setContactInfo(item.contactInfo || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Verwijder item
  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    
    if (!window.confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/board?id=${id}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fout bij het verwijderen van het item');
      }
      
      // Verwijder het item uit de lokale state
      setItems(items.filter(item => item.id !== id));
      setSuccessMessage('Item succesvol verwijderd!');
      
      // Verberg het succesbericht na 3 seconden
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Fout bij het verwijderen van het item');
      
      // Verberg het foutbericht na 3 seconden
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Verstuur formulier
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('Je moet ingelogd zijn om een item te plaatsen');
      return;
    }
    
    try {
      const itemData = {
        id: editingItem?.id,
        title,
        description,
        price: price === '' ? null : parseFloat(price),
        category,
        condition: condition || undefined,
        contactInfo: contactInfo || undefined,
        userId: currentUser.id,
        userName: currentUser.name
      };
      
      const method = editingItem ? 'PUT' : 'POST';
      const response = await fetch('/api/board', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(itemData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Fout bij het ${editingItem ? 'bijwerken' : 'plaatsen'} van het item`);
      }
      
      const newItem = await response.json();
      
      if (editingItem) {
        // Update het item in de lijst
        setItems(items.map(item => item.id === newItem.id ? newItem : item));
        setSuccessMessage('Item succesvol bijgewerkt!');
      } else {
        // Voeg het nieuwe item toe aan de lijst
        setItems([newItem, ...items]);
        setSuccessMessage('Item succesvol geplaatst!');
      }
      
      // Reset het formulier
      resetForm();
      setShowAddForm(false);
      
      // Verberg het succesbericht na 3 seconden
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      setError(error.message || `Fout bij het ${editingItem ? 'bijwerken' : 'plaatsen'} van het item`);
      
      // Verberg het foutbericht na 3 seconden
      setTimeout(() => {
        setError(null);
      }, 3000);
    }
  };

  // Filter items op categorie
  const filteredItems = selectedCategory === 'ALL' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  // Render categorie label
  const renderCategoryLabel = (category: string) => {
    switch (category) {
      case 'TE_KOOP': return 'Te koop';
      case 'AANGEBODEN': return 'Aangeboden';
      case 'GEZOCHT': return 'Gezocht';
      case 'DIENSTEN': return 'Diensten';
      default: return category;
    }
  };

  // Render conditie label
  const renderConditionLabel = (condition?: string) => {
    if (!condition) return null;
    
    switch (condition) {
      case 'NIEUW': return 'Nieuw';
      case 'ALS_NIEUW': return 'Als nieuw';
      case 'GOED': return 'Goed';
      case 'GEBRUIKT': return 'Gebruikt';
      case 'BESCHADIGD': return 'Beschadigd';
      default: return condition;
    }
  };

  return (
    <main className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Marktplaats</h1>
      
      {/* Foutmelding en succesbericht */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Knop om item toe te voegen */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
        >
          {showAddForm ? 'Annuleren' : 'Nieuw item plaatsen'}
        </button>
        
        {/* Categorie filter */}
        <div>
          <label htmlFor="categoryFilter" className="mr-2 font-medium">Filter op categorie:</label>
          <select
            id="categoryFilter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="ALL">Alle categorieën</option>
            <option value="TE_KOOP">Te koop</option>
            <option value="AANGEBODEN">Aangeboden</option>
            <option value="GEZOCHT">Gezocht</option>
            <option value="DIENSTEN">Diensten</option>
          </select>
        </div>
      </div>
      
      {/* Formulier voor toevoegen/bewerken */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? 'Item bewerken' : 'Nieuw item plaatsen'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="title" className="block text-gray-700 mb-1">Titel *</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-gray-700 mb-1">Categorie *</label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="TE_KOOP">Te koop</option>
                  <option value="AANGEBODEN">Aangeboden</option>
                  <option value="GEZOCHT">Gezocht</option>
                  <option value="DIENSTEN">Diensten</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="price" className="block text-gray-700 mb-1">Prijs (leeg laten voor gratis)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2">€</span>
                  <input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2 pl-7 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="condition" className="block text-gray-700 mb-1">Conditie</label>
                <select
                  id="condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Selecteer conditie --</option>
                  <option value="NIEUW">Nieuw</option>
                  <option value="ALS_NIEUW">Als nieuw</option>
                  <option value="GOED">Goed</option>
                  <option value="GEBRUIKT">Gebruikt</option>
                  <option value="BESCHADIGD">Beschadigd</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 mb-1">Beschrijving *</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows={4}
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="contactInfo" className="block text-gray-700 mb-1">Contactinformatie</label>
              <input
                type="text"
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Bijv. telefoonnummer, appartementnummer, etc."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editingItem ? 'Bijwerken' : 'Plaatsen'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Items lijst */}
      {loading ? (
        <p>Items laden...</p>
      ) : filteredItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
              <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-blue-700 mr-2">{item.title}</h3>
                  <div>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {renderCategoryLabel(item.category)}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">{item.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.price !== null && (
                    <span className="inline-block px-2 py-1 text-sm font-medium rounded bg-green-100 text-green-800">
                      € {item.price.toFixed(2)}
                    </span>
                  )}
                  
                  {item.price === null && (
                    <span className="inline-block px-2 py-1 text-sm rounded bg-green-100 text-green-800">
                      Gratis
                    </span>
                  )}
                  
                  {item.condition && (
                    <span className="inline-block px-2 py-1 text-sm rounded bg-gray-100 text-gray-800">
                      {renderConditionLabel(item.condition)}
                    </span>
                  )}
                </div>
                
                {item.contactInfo && (
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Contact:</strong> {item.contactInfo}
                  </p>
                )}
              </div>
              
              <div className="bg-gray-50 px-4 py-3 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <div>Geplaatst door: {item.userName}</div>
                  <div>{format(parseISO(item.createdAt), 'd MMMM yyyy', { locale: nl })}</div>
                </div>
                
                {/* Toon bewerken/verwijderen knoppen als de gebruiker de eigenaar is */}
                {currentUser && (currentUser.id === item.userId || currentUser.role === 'ADMIN') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Bewerken"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Verwijderen"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">Geen items gevonden in deze categorie.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Plaats het eerste item
          </button>
        </div>
      )}
    </main>
  );
}
