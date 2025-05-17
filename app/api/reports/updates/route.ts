import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { ReportUpdate } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';


// GET alle updates voor een melding
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const reportId = url.searchParams.get('reportId');
    const id = url.searchParams.get('id');
    
    if (!reportId && !id) {
      return NextResponse.json(
        { error: 'reportId of id parameter is verplicht' },
        { status: 400 }
      );
    }
    
    // Haal alle updates op
    let updates = await readJsonData<ReportUpdate>('report-updates');
    
    // Controleer of updates een array is
    if (!Array.isArray(updates)) {
      console.warn('API: Report updates data is not an array, initializing empty array');
      updates = [];
    }
    
    // Controleer op ontbrekende velden en voeg deze toe indien nodig
    updates = updates.map(update => {
      // Zorg ervoor dat alle verplichte velden aanwezig zijn
      return {
        ...update,
        authorId: update.authorId || 'system',
        authorName: update.authorName || 'Systeem',
        isPublic: update.isPublic !== undefined ? update.isPublic : true,
        createdAt: update.createdAt || new Date().toISOString()
      };
    });
    
    // Filter op ID als opgegeven
    if (id) {
      const update = updates.find(u => u.id === id);
      if (!update) {
        return NextResponse.json({ error: 'Update niet gevonden' }, { status: 404 });
      }
      return NextResponse.json(update);
    }
    
    // Filter op reportId als opgegeven
    if (reportId) {
      updates = updates.filter(u => u.reportId === reportId);
    }
    
    // Sorteer op createdAt (oudste eerst)
    updates.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    return NextResponse.json(updates);
  } catch (error) {
    console.error('API ERROR getting report updates:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe update voor een melding
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.reportId || !data.content || !data.authorId || !data.authorName) {
      return NextResponse.json(
        { error: 'reportId, content, authorId en authorName zijn verplicht' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    // Maak een nieuw update object
    const newUpdate: ReportUpdate = {
      id: uuidv4(),
      reportId: data.reportId,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      createdAt: now,
      isPublic: data.isPublic !== undefined ? data.isPublic : true
    };
    
    // Voeg de update toe aan de JSON database
    let updates = await readJsonData<ReportUpdate>('report-updates');
    
    // Zorg ervoor dat updates altijd een array is
    if (!Array.isArray(updates)) {
      console.warn('API: Report updates data is not an array, initializing empty array');
      updates = [];
    }
    
    // Voeg de nieuwe update toe
    updates.push(newUpdate);
    
    // Log voor debugging
    console.log(`API: Adding new report update to report-updates.json, total updates: ${updates.length}`);
    
    // Schrijf naar database
    const success = await writeJsonData('report-updates', updates);
    
    if (!success) {
      throw new Error('Kon de update niet opslaan in de database');
    }
    
    console.log(`API: Successfully added report update with ID ${newUpdate.id} to database`);
    
    console.log('API: Report update created successfully:', newUpdate);
    return NextResponse.json(newUpdate);
  } catch (error) {
    console.error('API ERROR creating report update:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// DELETE een update
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is verplicht' },
        { status: 400 }
      );
    }
    
    console.log(`API: Attempting to delete report update with ID: ${id}`);
    
    // Haal alle updates op
    const updates = await readJsonData<ReportUpdate>('report-updates');
    
    // Controleer of de update bestaat
    const updateToDelete = updates.find(update => update.id === id);
    
    if (!updateToDelete) {
      return NextResponse.json(
        { error: 'Update niet gevonden' },
        { status: 404 }
      );
    }
    
    // Verwijder de update uit de lijst
    const updatedUpdates = updates.filter(update => update.id !== id);
    
    // Controleer of er daadwerkelijk een item is verwijderd
    if (updates.length === updatedUpdates.length) {
      return NextResponse.json(
        { error: 'Update niet gevonden of kon niet worden verwijderd' },
        { status: 404 }
      );
    }
    
    // Schrijf de bijgewerkte lijst terug naar de database
    const success = await writeJsonData('report-updates', updatedUpdates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Kon de update niet verwijderen uit de database' },
        { status: 500 }
      );
    }
    
    console.log(`API: Report update with ID ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API ERROR deleting report update:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
