"use client";

import React, { useState, useEffect } from 'react';
import { format, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isEqual } from 'date-fns';
import { nl } from 'date-fns/locale';

type Appointment = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  type: 'MEETING' | 'ACTIVITY' | 'CONSULTATION';
  hostId: string;
  hostName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
};

type TimeSlot = {
  startTime: string;
  endTime: string;
};

type AvailabilityData = {
  id: string;
  userId: string;
  userName: string;
  role: string;
  availableSlots: TimeSlot[];
  date: string;
  unavailableReason?: string;
};

type User = {
  id: string;
  name: string;
  role: string;
};

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hosts, setHosts] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<{[key: string]: AvailabilityData[]}>({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [appointmentType, setAppointmentType] = useState<'MEETING' | 'ACTIVITY' | 'CONSULTATION'>('CONSULTATION');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'COACH'>('ALL');

  // Haal afspraken op
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/appointments');
        
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van afspraken');
        }
        
        const data = await response.json();
        setAppointments(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Kon geen afspraken ophalen. Probeer het later opnieuw.');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Haal hosts op (beheerders en wooncoaches)
  useEffect(() => {
    const fetchHosts = async () => {
      try {
        // Haal specifiek ADMIN en COACH gebruikers op met rol filter
        const response = await fetch('/api/users?role=ADMIN&limit=100');
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van admin hosts');
        }
        
        const adminData = await response.json();
        console.log('Fetched admin users:', adminData);
        
        // Haal wooncoaches op
        const coachResponse = await fetch('/api/users?role=COACH&limit=100');
        if (!coachResponse.ok) {
          throw new Error('Fout bij het ophalen van coach hosts');
        }
        
        const coachData = await coachResponse.json();
        console.log('Fetched coach users:', coachData);
        
        // Combineer de resultaten en controleer of de response het nieuwe formaat heeft
        const adminUsers = adminData.users ? adminData.users : (Array.isArray(adminData) ? adminData : []);
        const coachUsers = coachData.users ? coachData.users : (Array.isArray(coachData) ? coachData : []);
        
        // Combineer alle hosts
        const allHosts = [...adminUsers, ...coachUsers];
        console.log('Combined hosts:', allHosts);
        
        setHosts(allHosts);
        setError(''); // Wis eventuele eerdere fouten
      } catch (error) {
        console.error('Error fetching hosts:', error);
        setError('Kon geen hosts ophalen. Probeer het later opnieuw.');
      }
    };

    fetchHosts();
  }, []);

  // Haal beschikbaarheid op wanneer een host wordt geselecteerd
  useEffect(() => {
    if (!selectedHost) return;

    const fetchAvailability = async () => {
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/availability?userId=${selectedHost}&date=${dateString}`);
        
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van beschikbaarheid');
        }
        
        const data = await response.json();
        setAvailability(data);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setError('Kon geen beschikbaarheid ophalen. Probeer het later opnieuw.');
      }
    };

    fetchAvailability();
  }, [selectedHost, selectedDate]);
  
  // Haal wekelijkse beschikbaarheid op voor alle hosts
  useEffect(() => {
    const fetchWeeklyAvailability = async () => {
      try {
        setLoading(true);
        
        // Bereken de week (7 dagen vanaf de geselecteerde datum)
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Week begint op maandag
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
        
        // Maak een object om de beschikbaarheid per dag op te slaan
        const weekData: {[key: string]: AvailabilityData[]} = {};
        
        // Haal voor elke dag de beschikbaarheid op
        for (const day of daysOfWeek) {
          const dateString = format(day, 'yyyy-MM-dd');
          const roleParam = roleFilter !== 'ALL' ? `&role=${roleFilter}` : '';
          const response = await fetch(`/api/availability?date=${dateString}${roleParam}`);
          
          if (!response.ok) {
            throw new Error(`Fout bij het ophalen van beschikbaarheid voor ${dateString}`);
          }
          
          const data = await response.json();
          weekData[dateString] = data;
        }
        
        setWeeklyAvailability(weekData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching weekly availability:', error);
        setError('Kon geen wekelijkse beschikbaarheid ophalen. Probeer het later opnieuw.');
        setLoading(false);
      }
    };

    fetchWeeklyAvailability();
  }, [selectedDate, roleFilter]);

  // Haal afspraken voor de geselecteerde datum
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return (
        appointmentDate.getDate() === date.getDate() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
    setSelectedTimeSlot(null);
  };

  const handleHostChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedHost(e.target.value);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    // Bereken de eindtijd als 1 uur na de starttijd
    const startHour = parseInt(slot.startTime.split(':')[0]);
    const startMinute = parseInt(slot.startTime.split(':')[1]);
    
    // Bereken de nieuwe eindtijd (1 uur later)
    const endHour = startHour + 1;
    const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    
    // Controleer of de nieuwe eindtijd niet later is dan de originele eindtijd
    const originalEndHour = parseInt(slot.endTime.split(':')[0]);
    const originalEndMinute = parseInt(slot.endTime.split(':')[1]);
    
    if (endHour > originalEndHour || (endHour === originalEndHour && startMinute > originalEndMinute)) {
      // Als de nieuwe eindtijd later is dan de originele eindtijd, gebruik dan de originele eindtijd
      setSelectedTimeSlot(slot);
    } else {
      // Anders gebruik de nieuwe eindtijd (1 uur na starttijd)
      setSelectedTimeSlot({
        startTime: slot.startTime,
        endTime: endTime
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedTimeSlot) {
      setError('Selecteer een tijdslot');
      return;
    }

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const startDateTime = `${formattedDate}T${selectedTimeSlot.startTime}:00`;
    const endDateTime = `${formattedDate}T${selectedTimeSlot.endTime}:00`;

    const appointmentData = {
      title,
      description,
      location,
      hostId: selectedHost,
      startTime: startDateTime,
      endTime: endDateTime,
      type: appointmentType,
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fout bij het maken van de afspraak');
      }

      const newAppointment = await response.json();
      
      // Voeg de nieuwe afspraak toe aan de lijst
      setAppointments([...appointments, newAppointment]);
      
      // Reset het formulier
      setTitle('');
      setDescription('');
      setLocation('');
      setSelectedTimeSlot(null);
      setSuccessMessage('Afspraak succesvol gemaakt!');
      
      // Toon het succesbericht voor 3 seconden
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: unknown) {
      console.error('Error creating appointment:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Fout bij het maken van de afspraak');
      }
    }
  };

  const todayAppointments = getAppointmentsForDate(selectedDate);

  // Render een beschikbaarheidscel voor de weekweergave
  const renderAvailabilityCell = (host: User, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayData = weeklyAvailability[dateString];
    
    if (!dayData) return <div className="h-8 bg-gray-100"></div>;
    
    const hostAvailability = dayData.find(a => a.userId === host.id);
    
    if (!hostAvailability) return <div className="h-8 bg-gray-100"></div>;
    
    // Niet beschikbaar vanwege uitzondering
    if (hostAvailability.unavailableReason) {
      return (
        <div 
          className="h-8 bg-red-100 flex items-center justify-center text-xs cursor-help"
          title={hostAvailability.unavailableReason}
        >
          Niet beschikbaar
        </div>
      );
    }
    
    // Beschikbaar met tijdslots
    if (hostAvailability.availableSlots && hostAvailability.availableSlots.length > 0) {
      return (
        <div 
          className="h-8 bg-green-100 flex items-center justify-center text-xs cursor-help"
          title={`Beschikbaar: ${hostAvailability.availableSlots.map(slot => `${slot.startTime}-${slot.endTime}`).join(', ')}`}
        >
          {hostAvailability.availableSlots.length} tijdslot(s)
        </div>
      );
    }
    
    // Geen tijdslots beschikbaar
    return <div className="h-8 bg-gray-200 flex items-center justify-center text-xs">Geen slots</div>;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Kalender</h1>
      
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
      
      {/* Weergave knoppen en filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="mr-2 font-medium">Weergave:</label>
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'day'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Dag
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Week
            </button>
          </div>
        </div>
        
        <div>
          <label className="mr-2 font-medium">Filter op rol:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ADMIN' | 'COACH')}
            className="px-4 py-2 border rounded-md shadow-sm text-sm"
          >
            <option value="ALL">Alle rollen</option>
            <option value="ADMIN">Alleen beheerders</option>
            <option value="COACH">Alleen wooncoaches</option>
          </select>
        </div>
      </div>
      
      {/* Week overzicht */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-lg shadow p-4 mb-6 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekoverzicht beschikbaarheid</h2>
          
          {loading ? (
            <p>Beschikbaarheid laden...</p>
          ) : (
            <div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Legenda:</p>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 mr-2"></div>
                    <span className="text-sm">Beschikbaar</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-100 mr-2"></div>
                    <span className="text-sm">Niet beschikbaar (uitzondering)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 mr-2"></div>
                    <span className="text-sm">Geen tijdslots</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Naam
                      </th>
                      {eachDayOfInterval({
                        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
                      }).map((day) => (
                        <th 
                          key={format(day, 'yyyy-MM-dd')} 
                          className={`px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            isEqual(day, selectedDate) ? 'bg-blue-50' : ''
                          }`}
                        >
                          {format(day, 'EEE d MMM', { locale: nl })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hosts
                      .filter(host => roleFilter === 'ALL' || host.role === roleFilter)
                      .map(host => (
                        <tr key={host.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{host.name}</div>
                                <div className="text-sm text-gray-500">
                                  {host.role === 'ADMIN' ? 'Beheerder' : 'Wooncoach'}
                                </div>
                              </div>
                            </div>
                          </td>
                          {eachDayOfInterval({
                            start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                            end: endOfWeek(selectedDate, { weekStartsOn: 1 })
                          }).map((day) => (
                            <td 
                              key={`${host.id}-${format(day, 'yyyy-MM-dd')}`} 
                              className={`px-2 py-2 ${isEqual(day, selectedDate) ? 'bg-blue-50' : ''}`}
                            >
                              {renderAvailabilityCell(host, day)}
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Datum selecteren</h2>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateChange}
              className="w-full p-2 border rounded mb-4"
            />
            
            <h3 className="font-medium text-gray-800 mb-2">
              Afspraken op {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
            </h3>
            
            {loading ? (
              <p>Afspraken laden...</p>
            ) : todayAppointments.length > 0 ? (
              <ul className="space-y-2">
                {todayAppointments.map(appointment => {
                  // Bepaal of het een algemeen evenement is (type ACTIVITY)
                  const isGeneralEvent = appointment.type === 'ACTIVITY';
                  
                  return (
                    <li 
                      key={appointment.id} 
                      className={`p-3 rounded border ${isGeneralEvent 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{appointment.title}</div>
                          <div className="text-sm text-gray-600">
                            {format(parseISO(appointment.startTime), 'HH:mm')} - 
                            {format(parseISO(appointment.endTime), 'HH:mm')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {isGeneralEvent ? 'Algemeen evenement' : `Met: ${appointment.hostName}`}
                          </div>
                          {appointment.location && (
                            <div className="text-sm text-gray-500">
                              Locatie: {appointment.location}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            appointment.status === 'CONFIRMED' 
                              ? 'bg-green-100 text-green-800' 
                              : appointment.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appointment.status === 'CONFIRMED' 
                              ? 'Bevestigd' 
                              : appointment.status === 'CANCELLED'
                              ? 'Geannuleerd'
                              : 'In afwachting'}
                          </span>
                          
                          {/* Type badge */}
                          <span className={`mt-1 text-xs px-2 py-1 rounded-full ${
                            isGeneralEvent
                              ? 'bg-blue-100 text-blue-800'
                              : appointment.type === 'MEETING'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isGeneralEvent
                              ? 'Evenement'
                              : appointment.type === 'MEETING'
                              ? 'Vergadering'
                              : 'Consult'}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500">Geen afspraken voor deze dag</p>
            )}
          </div>
          
          {/* Beschikbaarheid overzicht voor de geselecteerde dag */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Beschikbaarheid op {format(selectedDate, 'd MMMM', { locale: nl })}</h2>
            
            {loading ? (
              <p>Beschikbaarheid laden...</p>
            ) : (
              <div className="space-y-4">
                {hosts
                  .filter(host => roleFilter === 'ALL' || host.role === roleFilter)
                  .map(host => {
                    const dateString = format(selectedDate, 'yyyy-MM-dd');
                    const dayData = weeklyAvailability[dateString];
                    const hostAvailability = dayData?.find(a => a.userId === host.id);
                    
                    return (
                      <div key={host.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h3 className="font-medium">{host.name}</h3>
                            <p className="text-sm text-gray-600">{host.role === 'ADMIN' ? 'Beheerder' : 'Wooncoach'}</p>
                          </div>
                          
                          {hostAvailability ? (
                            <div>
                              {hostAvailability.unavailableReason ? (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                                  Niet beschikbaar
                                </span>
                              ) : hostAvailability.availableSlots && hostAvailability.availableSlots.length > 0 ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                                  Beschikbaar
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                                  Geen tijdslots
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                              Onbekend
                            </span>
                          )}
                        </div>
                        
                        {hostAvailability?.unavailableReason && (
                          <p className="text-sm text-red-600 mt-1">
                            Reden: {hostAvailability.unavailableReason}
                          </p>
                        )}
                        
                        {hostAvailability?.availableSlots && hostAvailability.availableSlots.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Beschikbare tijdslots:</p>
                            <div className="grid grid-cols-2 gap-1">
                              {hostAvailability.availableSlots.map((slot, idx) => (
                                <div key={idx} className="text-sm bg-green-50 p-1 rounded text-center">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Nieuwe afspraak maken</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 mb-2">Beschrijving</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="location" className="block text-gray-700 mb-2">Locatie</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="type" className="block text-gray-700 mb-2">Type afspraak</label>
                <select
                  id="type"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as 'MEETING' | 'ACTIVITY' | 'CONSULTATION')}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="CONSULTATION">Gesprek</option>
                  <option value="MEETING">Vergadering</option>
                  <option value="ACTIVITY">Activiteit</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label htmlFor="host" className="block text-gray-700 mb-2">Selecteer wooncoach/beheerder</label>
                <select
                  id="host"
                  value={selectedHost}
                  onChange={handleHostChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">-- Selecteer --</option>
                  {hosts.map(host => (
                    <option key={host.id} value={host.id}>
                      {host.name} ({host.role === 'ADMIN' ? 'Beheerder' : 'Wooncoach'})
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedHost && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Beschikbare tijdslots</label>
                  {availability.length > 0 && availability[0].availableSlots && availability[0].availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availability[0].availableSlots.map((slot, index) => {
                        // Bereken de eindtijd als 1 uur na de starttijd voor weergave
                        const startHour = parseInt(slot.startTime.split(':')[0]);
                        const startMinute = parseInt(slot.startTime.split(':')[1]);
                        const endHour = startHour + 1;
                        const displayEndTime = endHour > parseInt(slot.endTime.split(':')[0]) ? 
                          slot.endTime : 
                          `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
                        
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleTimeSlotSelect(slot)}
                            className={`p-2 border rounded text-center ${
                              selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime
                                ? 'bg-blue-100 border-blue-500'
                                : 'hover:bg-gray-100'
                            }`}
                            title={`Afspraak van 1 uur, van ${slot.startTime} tot ${displayEndTime}`}
                          >
                            {slot.startTime} - {displayEndTime}
                            {displayEndTime !== slot.endTime && (
                              <span className="text-xs block text-gray-500">(1 uur)</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Geen beschikbare tijdslots voor deze datum
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={!selectedTimeSlot || !title || !selectedHost}
                >
                  Afspraak maken
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
