import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

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

// GET alle beschikbaarheid
export async function GET(request: Request) {
  try {
    console.log('API: Attempting to fetch availability from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const role = url.searchParams.get('role');
    const date = url.searchParams.get('date');
    
    // Lees beschikbaarheid uit JSON bestand
    const availabilityList = await readJsonData<Availability>('availability');
    
    // Filter op basis van query parameters
    let filteredAvailability = availabilityList;
    
    if (userId) {
      filteredAvailability = filteredAvailability.filter(a => a.userId === userId);
    }
    
    if (role) {
      filteredAvailability = filteredAvailability.filter(a => a.role === role.toUpperCase());
    }
    
    // Als een specifieke datum is opgevraagd, bereken de beschikbaarheid voor die dag
    if (date) {
      const requestedDate = new Date(date);
      const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][requestedDate.getDay()];
      const dateString = requestedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Bereken beschikbaarheid voor elke persoon op de gevraagde datum
      const availabilityForDate = filteredAvailability.map(person => {
        // Controleer of er een uitzondering is voor deze datum
        const exception = person.exceptions.find(e => e.date === dateString);
        
        if (exception && !exception.available) {
          // Persoon is niet beschikbaar op deze datum vanwege een uitzondering
          return {
            ...person,
            availableSlots: [],
            unavailableReason: exception.reason
          };
        }
        
        // Zoek het schema voor deze dag van de week
        const daySchedule = person.weeklySchedule.find(d => d.day === dayOfWeek);
        
        return {
          id: person.id,
          userId: person.userId,
          userName: person.userName,
          role: person.role,
          availableSlots: daySchedule ? daySchedule.slots : [],
          date: dateString
        };
      });
      
      return NextResponse.json(availabilityForDate);
    }
    
    console.log(`API: Successfully fetched ${filteredAvailability.length} availability records from JSON database`);
    return NextResponse.json(filteredAvailability);
  } catch (error) {
    console.error('API ERROR fetching availability:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe beschikbaarheid
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create availability in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Valideer verplichte velden
    if (!data.userId || !data.userName || !data.role || !data.weeklySchedule) {
      return NextResponse.json(
        { error: 'Gebruiker ID, naam, rol en weekschema zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Genereer een uniek ID
    const newAvailability: Availability = {
      id: uuidv4(),
      userId: data.userId,
      userName: data.userName,
      role: data.role.toUpperCase() as 'ADMIN' | 'COACH',
      weeklySchedule: data.weeklySchedule,
      exceptions: data.exceptions || []
    };
    
    // Voeg de beschikbaarheid toe aan de JSON database
    const availabilityList = await readJsonData<Availability>('availability');
    
    // Controleer of er al beschikbaarheid bestaat voor deze gebruiker
    const existingIndex = availabilityList.findIndex(a => a.userId === data.userId);
    
    if (existingIndex >= 0) {
      // Update bestaande beschikbaarheid
      availabilityList[existingIndex] = {
        ...availabilityList[existingIndex],
        ...newAvailability,
        id: availabilityList[existingIndex].id // Behoud het originele ID
      };
      console.log(`API: Updated availability for user ${data.userId}`);
    } else {
      // Voeg nieuwe beschikbaarheid toe
      availabilityList.push(newAvailability);
      console.log(`API: Added new availability for user ${data.userId}`);
    }
    
    // Sla de bijgewerkte lijst op
    await writeJsonData('availability', availabilityList);
    
    // Geef de nieuwe of bijgewerkte beschikbaarheid terug
    const result = existingIndex >= 0 ? availabilityList[existingIndex] : newAvailability;
    
    console.log('API: Availability created/updated successfully:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('API ERROR creating availability:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
