import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '@/lib/types';

// GET alle meldingen of een specifieke melding
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const reporterId = url.searchParams.get('reporterId');
    const assignedToId = url.searchParams.get('assignedToId');
    const status = url.searchParams.get('status');
    
    // Haal alle meldingen op
    let reports = await readJsonData<Report>('reports');
    
    // Controleer of reports een array is
    if (!Array.isArray(reports)) {
      console.warn('API: Reports data is not an array, initializing empty array');
      reports = [];
    }
    
    // Controleer op ontbrekende velden en voeg deze toe indien nodig
    reports = reports.map(report => {
      // Zorg ervoor dat alle verplichte velden aanwezig zijn
      return {
        ...report,
        reporterId: report.reporterId || 'system',
        reporterName: report.reporterName || 'Systeem',
        assignedToId: report.assignedToId,
        assignedToName: report.assignedToName,
        status: report.status || 'NEW',
        priority: report.priority || 'MEDIUM',
        category: report.category || 'OTHER',
        createdAt: report.createdAt || new Date().toISOString(),
        updatedAt: report.updatedAt || new Date().toISOString()
      };
    });
    
    // Sorteer op createdAt (nieuwste eerst)
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Filter op ID als opgegeven
    if (id) {
      const report = reports.find(r => r.id === id);
      if (!report) {
        return NextResponse.json({ error: 'Melding niet gevonden' }, { status: 404 });
      }
      return NextResponse.json(report);
    }
    
    // Filter op reporterId als opgegeven
    if (reporterId) {
      reports = reports.filter(r => r.reporterId === reporterId);
    }
    
    // Filter op assignedToId als opgegeven
    if (assignedToId) {
      reports = reports.filter(r => r.assignedToId === assignedToId);
    }
    
    // Filter op status als opgegeven
    if (status) {
      reports = reports.filter(r => r.status === status);
    }
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error('API ERROR getting reports:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe melding
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.title || !data.description || !data.reporterId || !data.reporterName) {
      return NextResponse.json(
        { error: 'Titel, beschrijving, reporterId en reporterName zijn verplicht' },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    
    // Maak een nieuw report object
    const newReport: Report = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      category: data.category || 'OTHER',
      status: 'NEW',
      priority: data.priority || 'MEDIUM',
      reporterId: data.reporterId,
      reporterName: data.reporterName,
      assignedToId: data.assignedToId,
      assignedToName: data.assignedToName,
      createdAt: now,
      updatedAt: now,
      location: data.location,
      images: data.images || []
    };
    
    // Voeg de melding toe aan de JSON database
    const reports = await readJsonData<Report>('reports');
    reports.push(newReport);
    await writeJsonData('reports', reports);
    const report = newReport;
    
    if (!report) {
      throw new Error('Failed to add report to JSON database');
    }
    
    console.log('API: Report created successfully:', report);
    return NextResponse.json(report);
  } catch (error) {
    console.error('API ERROR creating report:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// PUT update een melding
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is verplicht' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    const now = new Date().toISOString();
    
    // Haal alle meldingen op
    const reports = await readJsonData<Report>('reports');
    
    // Zoek de melding die we willen updaten
    const reportIndex = reports.findIndex(r => r.id === id);
    
    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Melding niet gevonden' },
        { status: 404 }
      );
    }
    
    // Update de melding
    const updatedReport = {
      ...reports[reportIndex],
      ...data,
      updatedAt: now,
      // Als status naar RESOLVED wordt gezet, voeg resolvedAt toe
      resolvedAt: data.status === 'RESOLVED' ? now : reports[reportIndex].resolvedAt
    };
    
    reports[reportIndex] = updatedReport;
    
    // Schrijf de bijgewerkte meldingen terug naar de JSON database
    await writeJsonData('reports', reports);
    
    console.log(`API: Report with ID ${id} updated successfully`);
    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('API ERROR updating report:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// DELETE een melding
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
    
    console.log(`API: Attempting to delete report with ID: ${id}`);
    
    // Haal alle meldingen op
    const reports = await readJsonData<Report>('reports');
    
    // Controleer of de melding bestaat
    const reportToDelete = reports.find(report => report.id === id);
    
    if (!reportToDelete) {
      return NextResponse.json(
        { error: 'Melding niet gevonden' },
        { status: 404 }
      );
    }
    
    // Verwijder de melding uit de lijst
    const updatedReports = reports.filter(report => report.id !== id);
    
    // Controleer of er daadwerkelijk een item is verwijderd
    if (reports.length === updatedReports.length) {
      return NextResponse.json(
        { error: 'Melding niet gevonden of kon niet worden verwijderd' },
        { status: 404 }
      );
    }
    
    // Schrijf de bijgewerkte lijst terug naar de database
    const success = await writeJsonData('reports', updatedReports);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Kon de melding niet verwijderen uit de database' },
        { status: 500 }
      );
    }
    
    console.log(`API: Report with ID ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API ERROR deleting report:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
