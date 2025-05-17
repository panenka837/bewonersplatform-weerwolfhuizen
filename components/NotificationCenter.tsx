"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

// Notificatie type
type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'MESSAGE' | 'BOARD' | 'EVENT' | 'REPORT';
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

type NotificationCenterProps = {
  userId: string;
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Haal notificaties op
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Kon notificaties niet ophalen');
      }
      
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((notification: Notification) => !notification.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Er is een fout opgetreden bij het ophalen van notificaties');
    } finally {
      setLoading(false);
    }
  };

  // Markeer notificatie als gelezen
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: notificationId,
          userId,
          isRead: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Kon notificatie niet markeren als gelezen');
      }
      
      // Update lokale state
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Verwijder notificatie
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}&userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Kon notificatie niet verwijderen');
      }
      
      // Update lokale state
      const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count
      setUnreadCount(updatedNotifications.filter(notification => !notification.isRead).length);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Markeer alle notificaties als gelezen
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notification => !notification.isRead);
      
      // Update alle ongelezen notificaties
      await Promise.all(unreadNotifications.map(notification => 
        fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: notification.id,
            userId,
            isRead: true
          }),
        })
      ));
      
      // Update lokale state
      setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Haal notificaties op bij het laden van de component
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
    
    // Poll voor nieuwe notificaties elke 30 seconden
    const interval = setInterval(() => {
      if (userId) {
        fetchNotifications();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // Sluit dropdown als er buiten wordt geklikt
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Bepaal icoon op basis van type notificatie
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'WARNING':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'MESSAGE':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      case 'BOARD':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'EVENT':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      case 'REPORT':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notificatie knop */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 text-gray-700 hover:text-blue-600 focus:outline-none"
        aria-label="Notificaties"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge voor ongelezen notificaties */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2">
            <div className="px-4 py-2 bg-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Notificaties</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Alles als gelezen markeren
                </button>
              )}
            </div>
            
            {loading && (
              <div className="px-4 py-2 text-center text-sm text-gray-500">
                Notificaties laden...
              </div>
            )}
            
            {error && (
              <div className="px-4 py-2 text-center text-sm text-red-500">
                {error}
              </div>
            )}
            
            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Je hebt geen notificaties
              </div>
            )}
            
            <div className="max-h-72 overflow-y-auto">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-2 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Markeer als gelezen"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Verwijderen"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="mt-1 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {format(parseISO(notification.createdAt), 'd MMM HH:mm', { locale: nl })}
                        </span>
                        {notification.link && (
                          <Link 
                            href={notification.link}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              markAsRead(notification.id);
                              setIsOpen(false);
                            }}
                          >
                            Bekijken
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
