'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import ClientProtectedRoute from '../../components/ClientProtectedRoute';

// Types
type Appointment = {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  type: 'MEETING' | 'ACTIVITY' | 'CONSULTATION';
  hostId: string;
  hostName: string;
  attendeeIds: string[];
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
};

function AdminAppointmentsContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Haal alle afspraken op
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
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Er is een fout opgetreden bij het ophalen van afspraken');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);

  // Functie om de status van een afspraak te wijzigen
  const updateAppointmentStatus = async (appointmentId: string, newStatus: 'CONFIRMED' | 'REJECTED' | 'CANCELLED', reason?: string) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: appointmentId,
          status: newStatus,
          rejectionReason: reason,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Fout bij het bijwerken van de afspraak');
      }
      
      const updatedAppointment = await response.json();
      
      // Update de lijst met afspraken
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment.id === appointmentId ? updatedAppointment : appointment
        )
      );
      
      setSuccessMessage(`Afspraak succesvol ${newStatus === 'CONFIRMED' ? 'geaccepteerd' : newStatus === 'REJECTED' ? 'afgewezen' : 'geannuleerd'}`);
      
      // Verberg het succesmelding na 3 seconden
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Reset de rejection dialog
      setShowRejectionDialog(false);
      setRejectionReason('');
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Er is een fout opgetreden bij het bijwerken van de afspraak');
    }
  };

  // Functie om een afspraak te accepteren
  const handleAccept = (appointment: Appointment) => {
    updateAppointmentStatus(appointment.id, 'CONFIRMED');
  };

  // Functie om het afwijzingsdialoog te tonen
  const handleShowRejectDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRejectionDialog(true);
  };

  // Functie om een afspraak af te wijzen met reden
  const handleReject = () => {
    if (selectedAppointment) {
      updateAppointmentStatus(selectedAppointment.id, 'REJECTED', rejectionReason);
    }
  };

  // Functie om een afspraak te annuleren
  const handleCancel = (appointment: Appointment) => {
    updateAppointmentStatus(appointment.id, 'CANCELLED');
  };

  // Functie om de datum en tijd te formatteren
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return format(date, 'dd MMMM yyyy HH:mm', { locale: nl });
  };

  // Functie om de status te vertalen naar Nederlands
  const translateStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'In afwachting';
      case 'CONFIRMED':
        return 'Bevestigd';
      case 'REJECTED':
        return 'Afgewezen';
      case 'CANCELLED':
        return 'Geannuleerd';
      default:
        return status;
    }
  };

  // Functie om de status kleur te bepalen
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Beheer Afspraken</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <p className="text-center py-4">Afspraken laden...</p>
      ) : appointments.length === 0 ? (
        <p className="text-center py-4">Geen afspraken gevonden</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Titel</th>
                <th className="px-4 py-2 border-b">Datum & Tijd</th>
                <th className="px-4 py-2 border-b">Locatie</th>
                <th className="px-4 py-2 border-b">Type</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Acties</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">
                    <div className="font-medium">{appointment.title}</div>
                    <div className="text-sm text-gray-500">{appointment.description}</div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <div>{formatDateTime(appointment.startTime)}</div>
                    <div className="text-sm text-gray-500">tot {formatDateTime(appointment.endTime)}</div>
                  </td>
                  <td className="px-4 py-2 border-b">{appointment.location}</td>
                  <td className="px-4 py-2 border-b">{appointment.type}</td>
                  <td className="px-4 py-2 border-b">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(appointment.status)}`}>
                      {translateStatus(appointment.status)}
                    </span>
                    {appointment.rejectionReason && (
                      <div className="text-sm text-red-500 mt-1">
                        Reden: {appointment.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 border-b">
                    {appointment.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAccept(appointment)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Accepteren
                        </button>
                        <button
                          onClick={() => handleShowRejectDialog(appointment)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Afwijzen
                        </button>
                      </div>
                    )}
                    {appointment.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancel(appointment)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Annuleren
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Afwijzingsdialoog */}
      {showRejectionDialog && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Afspraak afwijzen</h2>
            <p className="mb-4">
              Weet u zeker dat u de afspraak &quot;{selectedAppointment.title}&quot; wilt afwijzen?
            </p>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block mb-2">
                Reden voor afwijzing:
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Geef een reden voor de afwijzing"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectionDialog(false);
                  setRejectionReason('');
                  setSelectedAppointment(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                Annuleren
              </button>
              <button
                onClick={handleReject}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Afwijzen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAppointmentsPage() {
  return (
    <ClientProtectedRoute requireAdmin={true}>
      <AdminAppointmentsContent />
    </ClientProtectedRoute>
  );
}
