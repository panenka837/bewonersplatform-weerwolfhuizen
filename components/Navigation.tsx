'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationCenter from './NotificationCenter';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'COACH' | 'USER';
};

export default function Navigation() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const pathname = usePathname();

  // Simuleer inloggen - in een echte app zou dit met een auth systeem werken
  useEffect(() => {
    // Voor demonstratiedoeleinden, simuleren we een ingelogde beheerder
    const mockUser = {
      id: '1',
      name: 'Beheerder',
      email: 'beheerder@woonwelhuizen.nl',
      role: 'ADMIN' as const
    };
    
    setIsLoggedIn(true);
    setCurrentUser(mockUser);
  }, []);

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : '';
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-wrap items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center group">
            <img 
              src="/images/logo.svg" 
              alt="Bewonersplatform Weerwolfhuizen Logo" 
              className="h-14 sm:h-16 md:h-20 w-auto mr-3 bg-white p-1 rounded shadow-sm group-hover:shadow-md transition-all"
            />
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-lg md:text-xl font-bold">Weerwolfhuizen</span>
              <span className="text-xs sm:text-sm text-blue-100 sm:ml-2">Bewonersplatform</span>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/board" className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/board')}`}>
            Prikbord
          </Link>
          <Link href="/notices" className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/notices')}`}>
            Mededelingen
          </Link>
          <Link href="/documents" className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/documents')}`}>
            Documenten
          </Link>
          <Link href="/calendar" className={`px-3 py-2 rounded hover:bg-blue-700 ${isActive('/calendar')}`}>
            Afspraken
          </Link>
          
          {/* Notificatie centrum */}
          {isLoggedIn && currentUser && (
            <div className="ml-2">
              <NotificationCenter userId={currentUser.id} />
            </div>
          )}
          
          {/* Admin links alleen tonen voor beheerders */}
          {isLoggedIn && currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'COACH') && (
            <div className="relative group">
              <button className="px-3 py-2 rounded hover:bg-blue-700 flex items-center">
                Beheer
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link href="/admin/appointments" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">
                  Afspraken beheren
                </Link>
                {currentUser.role === 'ADMIN' && (
                  <>
                    <Link href="/admin/users" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">
                      Gebruikers beheren
                    </Link>
                    <Link href="/admin/availability" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">
                      Beschikbaarheid instellen
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
          
          {isLoggedIn ? (
            <div className="relative group">
              <button className="px-3 py-2 rounded hover:bg-blue-700 flex items-center">
                {currentUser?.name || 'Gebruiker'}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link href="/profile" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">
                  Profiel
                </Link>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100"
                >
                  Uitloggen
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="px-3 py-2 rounded hover:bg-blue-700">
              Inloggen
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
