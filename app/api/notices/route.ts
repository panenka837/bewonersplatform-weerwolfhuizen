import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

// Notice type definitie
type Notice = {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  userId: string; // ID van de gebruiker die het bericht heeft geplaatst
  userName: string; // Naam van de gebruiker die het bericht heeft geplaatst
};

// GET alle mededelingen
export async function GET() {
  try {
    console.log('API: Attempting to fetch notices from JSON database');
    
    // Lees mededelingen uit JSON bestand
    let notices = await readJsonData<Notice>('notices');
    
    // Controleer of notices een array is
    if (!Array.isArray(notices)) {
      console.warn('API: Notices data is not an array, initializing empty array');
      notices = [];
    }
    
    // Controleer op ontbrekende velden en voeg deze toe indien nodig
    notices = notices.map(notice => {
      // Zorg ervoor dat alle verplichte velden aanwezig zijn
      return {
        ...notice,
        userId: notice.userId || 'system',
        userName: notice.userName || 'Systeem'
      };
    });
    
    // Filter verlopen mededelingen
    const currentDate = new Date();
    const activeNotices = notices.filter(notice => {
      try {
        // Converteer de expiresAt string naar een Date object voor correcte vergelijking
        // Controleer of het een volledige ISO-string is of alleen een datum
        let expiresDate;
        if (notice.expiresAt.includes('T')) {
          // Volledige ISO-datumstring
          expiresDate = new Date(notice.expiresAt);
        } else {
          // Alleen datum (YYYY-MM-DD)
          expiresDate = new Date(`${notice.expiresAt}T23:59:59Z`);
        }
        
        console.log(`API: Notice ${notice.id} expires at ${expiresDate.toISOString()}, current date is ${currentDate.toISOString()}`);
        return expiresDate > currentDate;
      } catch (error) {
        console.error(`API ERROR parsing date for notice ${notice.id}:`, error);
        // Bij een fout in de datumverwerking, toon de mededeling toch maar
        return true;
      }
    });
    
    console.log(`API: Current date: ${currentDate.toISOString()}, filtered ${notices.length - activeNotices.length} expired notices`);
    
    console.log(`API: Successfully fetched ${activeNotices.length} active notices from JSON database`);
    return NextResponse.json(activeNotices);
  } catch (error) {
    console.error('API ERROR fetching notices:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe mededeling
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create a notice in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Genereer een uniek ID en timestamps
    const now = new Date().toISOString();
    
    // Maak een nieuw notice object
    // Zorg ervoor dat expiresAt altijd een volledig ISO-datumformaat heeft
    let expiresAt = now;
    if (data.expiresAt) {
      // Als er een vervaldatum is opgegeven, zorg ervoor dat het een volledig ISO-formaat is
      try {
        if (data.expiresAt.includes('T')) {
          // Het is al een ISO-string
          expiresAt = data.expiresAt;
        } else {
          // Het is alleen een datum (YYYY-MM-DD), voeg tijd toe
          expiresAt = `${data.expiresAt}T23:59:59Z`;
        }
      } catch (error) {
        console.error('API ERROR parsing expiresAt date:', error);
        // Bij een fout, gebruik standaard 30 dagen vanaf nu
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
      // Geen vervaldatum opgegeven, gebruik standaard 30 dagen vanaf nu
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    
    const newNotice: Notice = {
      id: uuidv4(),
      title: data.title,
      content: data.content,
      important: data.important || false,
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt,
      userId: data.userId || 'anonymous', // Gebruik 'anonymous' als fallback
      userName: data.userName || 'Anoniem' // Gebruik 'Anoniem' als fallback
    };
    
    // Voeg de mededeling toe aan de JSON database
    let notices = await readJsonData<Notice>('notices');
    
    // Zorg ervoor dat notices altijd een array is
    if (!Array.isArray(notices)) {
      console.warn('API: Notices data is not an array, initializing empty array');
      notices = [];
    }
    
    // Voeg de nieuwe mededeling toe
    notices.push(newNotice);
    
    // Log voor debugging
    console.log(`API: Adding new notice to notices.json, total notices: ${notices.length}`);
    
    // Schrijf naar database
    const success = await writeJsonData('notices', notices);
    
    if (!success) {
      throw new Error('Kon de mededeling niet opslaan in de database');
    }
    
    console.log(`API: Successfully added notice with ID ${newNotice.id} to database`);
    
    console.log('API: Notice created successfully:', newNotice);
    return NextResponse.json(newNotice);
  } catch (error) {
    console.error('API ERROR creating notice:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// DELETE een mededeling
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId'); // Voeg userId toe om te controleren of de gebruiker het bericht mag verwijderen
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is verplicht' },
        { status: 400 }
      );
    }
    
    console.log(`API: Attempting to delete notice with ID: ${id}`);
    
    // Haal alle mededelingen op
    const allNotices = await readJsonData<Notice>('notices');
    const noticeToDelete = allNotices.find(notice => notice.id === id);
    
    if (!noticeToDelete) {
      return NextResponse.json(
        { error: 'Mededeling niet gevonden' },
        { status: 404 }
      );
    }
    
    // Controleer of de gebruiker het bericht heeft geplaatst of een admin is
    if (userId && userId !== noticeToDelete.userId && userId !== 'admin') {
      return NextResponse.json(
        { error: 'Je hebt geen toestemming om deze mededeling te verwijderen' },
        { status: 403 }
      );
    }
    
    // Verwijder de mededeling uit de JSON database
    const updatedNotices = allNotices.filter(notice => notice.id !== id);
    
    // Controleer of er daadwerkelijk een item is verwijderd
    if (allNotices.length === updatedNotices.length) {
      return NextResponse.json(
        { error: 'Mededeling niet gevonden of kon niet worden verwijderd' },
        { status: 404 }
      );
    }
    
    // Schrijf de bijgewerkte lijst terug naar de database
    const success = await writeJsonData('notices', updatedNotices);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Kon de bijgewerkte mededelingen niet opslaan in de database' },
        { status: 500 }
      );
    }
    
    console.log(`API: Notice with ID ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API ERROR deleting notice:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
