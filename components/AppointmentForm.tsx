import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

type User = {
  id: string;
  name: string;
  role: string;
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
};

type AppointmentData = {
  title: string;
  description: string;
  location: string;
  hostId: string;
  startTime: string;
  endTime: string;
  type: 'MEETING' | 'ACTIVITY' | 'CONSULTATION';
};

type AppointmentFormProps = {
  selectedDate: Date;
  onSubmit: (appointmentData: AppointmentData) => void;
  onCancel: () => void;
};

const AppointmentForm: React.FC<AppointmentFormProps> = ({ selectedDate, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedHost, setSelectedHost] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [appointmentType, setAppointmentType] = useState<'MEETING' | 'ACTIVITY' | 'CONSULTATION'>('CONSULTATION');
  
  const [hosts, setHosts] = useState<User[]>([]);
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setLoading(true);
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch(`/api/availability?userId=${selectedHost}&date=${dateString}`);
        
        if (!response.ok) {
          throw new Error('Fout bij het ophalen van beschikbaarheid');
        }
        
        const data = await response.json();
        setAvailability(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setError('Kon geen beschikbaarheid ophalen. Probeer het later opnieuw.');
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedHost, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
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

    onSubmit(appointmentData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Nieuwe afspraak</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Datum</label>
          <div className="p-2 bg-gray-100 rounded">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
          </div>
        </div>
        
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
            onChange={(e) => {
              setSelectedHost(e.target.value);
              setSelectedTimeSlot(null);
            }}
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
            {loading ? (
              <p>Beschikbaarheid laden...</p>
            ) : availability.length > 0 && availability[0].availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availability[0].availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={`p-2 border rounded text-center ${
                      selectedTimeSlot === slot
                        ? 'bg-blue-100 border-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {slot.startTime} - {slot.endTime}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                Geen beschikbare tijdslots voor deze datum
              </p>
            )}
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
          >
            Annuleren
          </button>
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
  );
};

export default AppointmentForm;
