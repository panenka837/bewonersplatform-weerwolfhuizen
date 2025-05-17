import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { User } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Type definities


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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
};

// Availability type definities
type TimeSlot = {
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  slots: TimeSlot[];
};

type Exception = {
  date: string;
  available: boolean;
  reason: string;
};

type Availability = {
  id: string;
  userId: string;
  userName: string;
  role: 'ADMIN' | 'COACH';
  weeklySchedule: DaySchedule[];
  exceptions: Exception[];
};

// Helper functie om te controleren of een tijdslot beschikbaar is
function isTimeSlotAvailable(
  hostId: string,
  startTime: string,
  endTime: string,
  existingAppointments: Appointment[],
  availabilityList: Availability[]
): { available: boolean; reason?: string } {
  const appointmentDate = new Date(startTime);
  const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][appointmentDate.getDay()];
  const dateString = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Zoek de beschikbaarheid van de host
  const hostAvailability = availabilityList.find(a => a.userId === hostId);
  
  if (!hostAvailability) {
    return { available: false, reason: 'Host niet gevonden in beschikbaarheidslijst' };
  }
  
  // Controleer of er een uitzondering is voor deze datum
  const exception = hostAvailability.exceptions.find(e => e.date === dateString);
  
  if (exception && !exception.available) {
    return { available: false, reason: `Host is niet beschikbaar op deze datum: ${exception.reason}` };
  }
  
  // Zoek het schema voor deze dag van de week
  const daySchedule = hostAvailability.weeklySchedule.find(d => d.day === dayOfWeek);
  
  if (!daySchedule || daySchedule.slots.length === 0) {
    return { available: false, reason: 'Host heeft geen beschikbare tijdslots op deze dag' };
  }
  
  // Controleer of het gevraagde tijdslot binnen een beschikbaar tijdslot valt
  const appointmentStartTime = appointmentDate.getHours() * 60 + appointmentDate.getMinutes();
  const appointmentEndTime = new Date(endTime).getHours() * 60 + new Date(endTime).getMinutes();
  
  let isWithinAvailableSlot = false;
  
  for (const slot of daySchedule.slots) {
    const [slotStartHour, slotStartMinute] = slot.startTime.split(':').map(Number);
    const [slotEndHour, slotEndMinute] = slot.endTime.split(':').map(Number);
    
    const slotStartMinutes = slotStartHour * 60 + slotStartMinute;
    const slotEndMinutes = slotEndHour * 60 + slotEndMinute;
    
    if (appointmentStartTime >= slotStartMinutes && appointmentEndTime <= slotEndMinutes) {
      isWithinAvailableSlot = true;
      break;
    }
  }
  
  if (!isWithinAvailableSlot) {
    return { available: false, reason: 'Afspraak valt buiten de beschikbare tijdslots van de host' };
  }
  
  // Controleer of er al een afspraak is in dit tijdslot
  const overlappingAppointment = existingAppointments.find(appointment => {
    // Alleen controleren op afspraken met dezelfde host die niet geannuleerd zijn
    if (appointment.hostId === hostId && appointment.status !== 'CANCELLED') {
      const existingStart = new Date(appointment.startTime);
      const existingEnd = new Date(appointment.endTime);
      const newStart = new Date(startTime);
      const newEnd = new Date(endTime);
      
      // Controleer op overlap
      return (
        (newStart >= existingStart && newStart < existingEnd) || // Nieuwe start valt binnen bestaande afspraak
        (newEnd > existingStart && newEnd <= existingEnd) || // Nieuwe einde valt binnen bestaande afspraak
        (newStart <= existingStart && newEnd >= existingEnd) // Nieuwe afspraak omvat bestaande afspraak
      );
    }
    return false;
  });
  
  if (overlappingAppointment) {
    return { 
      available: false, 
      reason: `Er is al een afspraak gepland in dit tijdslot: ${overlappingAppointment.title}` 
    };
  }
  
  return { available: true };
}

// GET alle afspraken
export async function GET(request: Request) {
  try {
    console.log('API: Attempting to fetch appointments from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const hostId = url.searchParams.get('hostId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    // Lees afspraken uit JSON bestand
    const appointments = await readJsonData<Appointment>('appointments');
    
    // Filter op basis van query parameters
    let filteredAppointments = appointments;
    
    if (hostId) {
      filteredAppointments = filteredAppointments.filter(a => a.hostId === hostId);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      
      filteredAppointments = filteredAppointments.filter(a => {
        const appointmentStart = new Date(a.startTime).getTime();
        return appointmentStart >= start && appointmentStart <= end;
      });
    }
    
    console.log(`API: Successfully fetched ${filteredAppointments.length} appointments from JSON database`);
    return NextResponse.json(filteredAppointments);
  } catch (error) {
    console.error('API ERROR fetching appointments:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe afspraak
// PATCH update afspraak status
export async function PATCH(request: Request) {
  try {
    console.log('API: Attempting to update appointment status');
    
    const data = await request.json();
    console.log('API: Received data for status update:', data);
    
    // Valideer verplichte velden
    if (!data.id || !data.status) {
      return NextResponse.json(
        { error: 'Afspraak ID en status zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Controleer of status geldig is
    if (!['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].includes(data.status)) {
      return NextResponse.json(
        { error: 'Ongeldige status. Geldige statussen zijn: PENDING, CONFIRMED, REJECTED, CANCELLED' },
        { status: 400 }
      );
    }
    
    // Lees bestaande afspraken
    const appointments: Appointment[] = await readJsonData('appointments');
    
    // Controleer of appointments een array is
    if (!Array.isArray(appointments)) {
      return NextResponse.json(
        { error: 'Fout bij het ophalen van afspraken' },
        { status: 500 }
      );
    }
    
    // Zoek de afspraak
    // Assuming Appointment type is imported
const appointmentIndex = appointments.findIndex((a: Appointment) => a.id === data.id);
    
    if (appointmentIndex === -1) {
      return NextResponse.json(
        { error: 'Afspraak niet gevonden' },
        { status: 404 }
      );
    }
    
    // Update de afspraak
    const currentAppointment = appointments[appointmentIndex] as Appointment;
    const updatedAppointment = {
      ...currentAppointment,
      status: data.status,
      updatedAt: new Date().toISOString(),
      rejectionReason: data.status === 'REJECTED' ? (data.rejectionReason || '') : undefined
    };
    
    // Vervang de oude afspraak met de bijgewerkte versie
    appointments[appointmentIndex] = updatedAppointment;
    
    // Schrijf terug naar het JSON bestand met de data-service functie
    await writeJsonData('appointments', appointments);
    
    console.log('API: Appointment status updated successfully:', updatedAppointment);
    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('API ERROR updating appointment status:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create an appointment in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Valideer verplichte velden
    if (!data.title || !data.startTime || !data.endTime || !data.hostId || !data.type) {
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }
    
    // Lees bestaande afspraken
    const existingAppointments = await readJsonData<Appointment>('appointments');
    
    // Lees beschikbaarheid
    const availabilityList = await readJsonData<Availability>('availability');
    
    // Controleer of het tijdslot beschikbaar is
    const availabilityCheck = isTimeSlotAvailable(
      data.hostId,
      data.startTime,
      data.endTime,
      existingAppointments,
      availabilityList
    );
    
    if (!availabilityCheck.available) {
      return NextResponse.json(
        { error: `Tijdslot is niet beschikbaar: ${availabilityCheck.reason}` },
        { status: 409 } // Conflict
      );
    }
    
    // Genereer een uniek ID en timestamps
    const now = new Date().toISOString();
    
    // Zoek de hostnaam op basis van hostId
    const usersData = await readJsonData('users');
    
    // Controleer of usersData een array is
    if (!Array.isArray(usersData)) {
      return NextResponse.json(
        { error: 'Fout bij het ophalen van gebruikers' },
        { status: 500 }
      );
    }
    
    // Zoek de host in de gebruikerslijst
    const hostUser = (usersData as User[]).find((user) => user.id === data.hostId);
    
    if (!hostUser) {
      return NextResponse.json(
        { error: 'Host niet gevonden' },
        { status: 404 }
      );
    }
    
    const hostName = (hostUser as User)?.name || 'Onbekende host';
    
    // Maak een nieuw appointment object
    const newAppointment: Appointment = {
      id: uuidv4(),
      title: data.title,
      description: data.description || '',
      location: data.location || '',
      startTime: data.startTime,
      endTime: data.endTime,
      createdAt: now,
      updatedAt: now,
      type: data.type,
      hostId: data.hostId,
      hostName: hostName, // We gebruiken de eerder opgehaalde hostnaam
      attendeeIds: data.attendeeIds || [],
      status: data.status || 'PENDING'
    };
    
    // Voeg de afspraak toe aan de JSON database
    existingAppointments.push(newAppointment);
    await fs.writeFile(
      path.join(process.cwd(), 'data', 'appointments.json'),
      JSON.stringify(existingAppointments, null, 2)
    );
    const appointment = newAppointment;
    
    if (!appointment) {
      throw new Error('Failed to add appointment to JSON database');
    }
    
    console.log('API: Appointment created successfully:', appointment);
    return NextResponse.json(appointment);
  } catch (error) {
    console.error('API ERROR creating appointment:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
