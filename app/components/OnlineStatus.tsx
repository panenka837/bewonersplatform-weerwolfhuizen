'use client';

import React, { useState, useEffect } from 'react';

type OnlineStatusProps = {
  userId: string;
  className?: string;
};

// In een echte applicatie zou dit worden bijgehouden via een websocket of een andere realtime service
// Voor nu simuleren we dit met een willekeurige status
export default function OnlineStatus({ userId, className = '' }: OnlineStatusProps) {
  const [isOnline, setIsOnline] = useState(false);
  
  useEffect(() => {
    // Simuleer online status op basis van gebruikers-ID
    // In een echte applicatie zou dit worden bijgehouden via een websocket of een andere realtime service
    const checkOnlineStatus = () => {
      // Gebruik een deterministische functie op basis van gebruikers-ID en tijd
      // zodat de status niet constant verandert, maar wel varieert tussen gebruikers
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hourOfDay = new Date().getHours();
      const isUserOnline = (hash + hourOfDay) % 4 !== 0; // 75% kans om online te zijn
      
      setIsOnline(isUserOnline);
    };
    
    checkOnlineStatus();
    
    // Controleer elke 30 seconden opnieuw (in een echte app zou dit via websockets gebeuren)
    const interval = setInterval(checkOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);
  
  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`w-2.5 h-2.5 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
      />
      <span className="text-xs text-gray-600">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
