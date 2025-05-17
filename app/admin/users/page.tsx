'use client';

import { useState, useEffect } from 'react';
import ClientProtectedRoute from '../../components/ClientProtectedRoute';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Nieuwe gebruiker formulier state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER'
  });
  
  // Bewerk gebruiker state
  const [editUser, setEditUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: string;
    password: string;
  } | null>(null);
  
  // Bevestiging modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    userId: string;
    userName: string;
  }>({ show: false, userId: '', userName: '' });
  
  // State voor paginering
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // State voor zoeken en filteren
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Haal alle gebruikers op met paginering, zoeken en filteren
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Bouw de query parameters
      const queryParams = new URLSearchParams();
      if (pagination.page) queryParams.append('page', pagination.page.toString());
      if (pagination.limit) queryParams.append('limit', pagination.limit.toString());
      if (searchTerm) queryParams.append('search', searchTerm);
      if (roleFilter) queryParams.append('role', roleFilter);
      if (sortBy) queryParams.append('sortBy', sortBy);
      if (sortOrder) queryParams.append('sortOrder', sortOrder);
      
      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Kon gebruikers niet ophalen');
      }
      
      const data = await response.json();
      
      // Controleer of de response het nieuwe formaat heeft (met users en pagination)
      if (data.users && data.pagination) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        // Fallback voor het oude formaat (direct array van gebruikers)
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fout bij ophalen gebruikers:', error);
      setError('Er is een fout opgetreden bij het ophalen van gebruikers');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Formulier input handler voor nieuw gebruiker
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  // Formulier input handler voor bewerk gebruiker
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editUser) return;
    
    const { name, value } = e.target;
    setEditUser(prev => prev ? ({ ...prev, [name]: value }) : null);
  };
  
  // Nieuwe gebruiker aanmaken
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Valideer invoer
      if (!newUser.email || !newUser.password || !newUser.name) {
        setError('Vul alle verplichte velden in');
        return;
      }
      
      // Valideer e-mail formaat
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        setError('Ongeldig e-mailadres formaat');
        return;
      }
      
      // Valideer wachtwoord sterkte
      if (newUser.password.length < 8) {
        setError('Wachtwoord moet minimaal 8 tekens bevatten');
        return;
      }
      
      // Verstuur registratie verzoek naar de API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Er is een fout opgetreden bij het aanmaken van de gebruiker');
        return;
      }
      
      // Toon succes bericht en reset formulier
      setSuccessMessage(`Gebruiker ${data.email} is succesvol aangemaakt`);
      setNewUser({
        email: '',
        password: '',
        name: '',
        role: 'USER'
      });
      
      // Ververs de gebruikerslijst
      fetchUsers();
    } catch (error) {
      console.error('Fout bij aanmaken gebruiker:', error);
      setError('Er is een fout opgetreden bij het aanmaken van de gebruiker');
    }
  };
  
  // Gebruiker bewerken
  const handleEditClick = (user: User) => {
    setEditUser({
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      password: '' // Leeg wachtwoord veld voor bewerken
    });
  };
  
  // Gebruiker verwijderen bevestiging
  const handleDeleteClick = (user: User) => {
    setDeleteConfirmation({
      show: true,
      userId: user.id,
      userName: user.name || user.email
    });
  };
  
  // Gebruiker bewerken submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Valideer invoer
      if (!editUser.email || !editUser.name) {
        setError('Vul alle verplichte velden in');
        return;
      }
      
      // Valideer e-mail formaat
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editUser.email)) {
        setError('Ongeldig e-mailadres formaat');
        return;
      }
      
      // Valideer wachtwoord sterkte als het is opgegeven
      if (editUser.password && editUser.password.length < 8) {
        setError('Wachtwoord moet minimaal 8 tekens bevatten');
        return;
      }
      
      // Verstuur update verzoek naar de API
      const response = await fetch(`/api/users?id=${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: editUser.email,
          name: editUser.name,
          role: editUser.role,
          ...(editUser.password ? { password: editUser.password } : {})
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Er is een fout opgetreden bij het bijwerken van de gebruiker');
        return;
      }
      
      // Toon succes bericht en sluit modal
      setSuccessMessage(`Gebruiker ${data.email} is succesvol bijgewerkt`);
      setEditUser(null);
      
      // Ververs de gebruikerslijst
      fetchUsers();
    } catch (error) {
      console.error('Fout bij bijwerken gebruiker:', error);
      setError('Er is een fout opgetreden bij het bijwerken van de gebruiker');
    }
  };
  
  // Gebruiker verwijderen
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.show || !deleteConfirmation.userId) return;
    
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Verstuur verwijder verzoek naar de API
      const response = await fetch(`/api/users?id=${deleteConfirmation.userId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Er is een fout opgetreden bij het verwijderen van de gebruiker');
        return;
      }
      
      // Toon succes bericht en sluit modal
      setSuccessMessage(`Gebruiker is succesvol verwijderd`);
      setDeleteConfirmation({ show: false, userId: '', userName: '' });
      
      // Ververs de gebruikerslijst
      fetchUsers();
    } catch (error) {
      console.error('Fout bij verwijderen gebruiker:', error);
      setError('Er is een fout opgetreden bij het verwijderen van de gebruiker');
    }
  };
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Gebruikersbeheer</h1>
      
      {/* Nieuwe gebruiker formulier */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Nieuwe gebruiker aanmaken</h2>
        
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
        
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">E-mail *</label>
              <input
                type="email"
                name="email"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.email}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium text-gray-700">Wachtwoord *</label>
              <input
                type="password"
                name="password"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.password}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium text-gray-700">Naam *</label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.name}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium text-gray-700">Rol *</label>
              <select
                name="role"
                required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newUser.role}
                onChange={handleInputChange}
              >
                <option value="USER">Bewoner</option>
                <option value="COACH">Wooncoach</option>
                <option value="ADMIN">Beheerder</option>
              </select>
            </div>
          </div>
          
          <div className="mt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Gebruiker aanmaken
            </button>
          </div>
        </form>
      </div>
      
      {/* Gebruikerslijst */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Gebruikers</h2>
        
        {/* Zoek- en filterbalk */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Zoeken</label>
            <input
              type="text"
              placeholder="Zoek op naam of e-mail"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Filter op rol</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Alle rollen</option>
              <option value="USER">Bewoner</option>
              <option value="COACH">Wooncoach</option>
              <option value="ADMIN">Beheerder</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Sorteer op</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Naam</option>
              <option value="email">E-mail</option>
              <option value="role">Rol</option>
              <option value="createdAt">Aangemaakt op</option>
              <option value="updatedAt">Laatst bijgewerkt</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Volgorde</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Oplopend</option>
              <option value="desc">Aflopend</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4 flex justify-end">
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => {
              // Reset pagination to page 1 when applying filters
              setPagination({...pagination, page: 1});
              fetchUsers();
            }}
          >
            Filters toepassen
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Naam</th>
                    <th className="py-2 px-4 text-left">E-mail</th>
                    <th className="py-2 px-4 text-left">Rol</th>
                    <th className="py-2 px-4 text-left">Aangemaakt op</th>
                    <th className="py-2 px-4 text-left">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{user.name || '-'}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'COACH' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'ADMIN' ? 'Beheerder' :
                           user.role === 'COACH' ? 'Wooncoach' : 'Bewoner'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(user.createdAt).toLocaleDateString('nl-NL')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Bewerken"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user)}
                            className="text-red-600 hover:text-red-800"
                            title="Verwijderen"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginering */}
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Toont {users.length} van {pagination.total} gebruikers (Pagina {pagination.page} van {pagination.totalPages})
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (pagination.page > 1) {
                      setPagination({...pagination, page: pagination.page - 1});
                      fetchUsers();
                    }
                  }}
                  disabled={pagination.page <= 1}
                  className={`px-3 py-1 rounded ${pagination.page <= 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Vorige
                </button>
                <button
                  onClick={() => {
                    if (pagination.page < pagination.totalPages) {
                      setPagination({...pagination, page: pagination.page + 1});
                      fetchUsers();
                    }
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className={`px-3 py-1 rounded ${pagination.page >= pagination.totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  Volgende
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Geen gebruikers gevonden
          </div>
        )}
      </div>
      
      {/* Bewerk gebruiker modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Gebruiker bewerken</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium text-gray-700">E-mail *</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.email}
                  onChange={handleEditInputChange}
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium text-gray-700">Naam *</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.name}
                  onChange={handleEditInputChange}
                />
              </div>
              
              <div>
                <label className="block mb-1 font-medium text-gray-700">Rol *</label>
                <select
                  name="role"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.role}
                  onChange={handleEditInputChange}
                >
                  <option value="USER">Bewoner</option>
                  <option value="COACH">Wooncoach</option>
                  <option value="ADMIN">Beheerder</option>
                </select>
              </div>
              
              <div>
                <label className="block mb-1 font-medium text-gray-700">Nieuw wachtwoord</label>
                <input
                  type="password"
                  name="password"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editUser.password}
                  onChange={handleEditInputChange}
                  placeholder="Laat leeg om ongewijzigd te laten"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={() => setEditUser(null)}
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Verwijder bevestiging modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Gebruiker verwijderen</h2>
            
            <p className="mb-4">Weet je zeker dat je de gebruiker <strong>{deleteConfirmation.userName}</strong> wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.</p>
            
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => setDeleteConfirmation({ show: false, userId: '', userName: '' })}
              >
                Annuleren
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={handleDeleteConfirm}
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <ClientProtectedRoute requireAdmin={true}>
      <UserManagementContent />
    </ClientProtectedRoute>
  );
}
