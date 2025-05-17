import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

// Document type definitie
type Document = {
  id: string;
  name: string;
  description: string;
  type: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
};

// GET alle documenten
export async function GET() {
  try {
    console.log('API: Attempting to fetch documents from JSON database');
    
    // Lees documenten uit JSON bestand
    let documents = await readJsonData<Document>('documents');
    
    // Controleer of documents een array is
    if (!Array.isArray(documents)) {
      console.warn('API: Documents data is not an array, initializing empty array');
      documents = [];
    }
    
    // Controleer op ontbrekende velden en voeg deze toe indien nodig
    documents = documents.map(document => {
      // Zorg ervoor dat alle verplichte velden aanwezig zijn
      return {
        ...document,
        description: document.description || '',
        createdAt: document.createdAt || new Date().toISOString(),
        updatedAt: document.updatedAt || new Date().toISOString()
      };
    });
    
    console.log(`API: Successfully fetched ${documents.length} documents from JSON database`);
    return NextResponse.json(documents);
  } catch (error) {
    console.error('API ERROR fetching documents:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuw document
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create a document in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Genereer een uniek ID en timestamps
    const now = new Date().toISOString();
    
    // Maak een nieuw document object
    const newDocument: Document = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      type: data.type,
      filePath: data.filePath,
      createdAt: now,
      updatedAt: now
    };
    
    // Voeg het document toe aan de JSON database
    let documents = await readJsonData<Document>('documents');
    
    // Zorg ervoor dat documents altijd een array is
    if (!Array.isArray(documents)) {
      console.warn('API: Documents data is not an array, initializing empty array');
      documents = [];
    }
    
    // Voeg het nieuwe document toe
    documents.push(newDocument);
    
    // Log voor debugging
    console.log(`API: Adding new document to documents.json, total documents: ${documents.length}`);
    
    // Schrijf naar database
    const success = await writeJsonData('documents', documents);
    
    if (!success) {
      throw new Error('Kon het document niet opslaan in de database');
    }
    
    console.log(`API: Successfully added document with ID ${newDocument.id} to database`);
    
    console.log('API: Document created successfully:', newDocument);
    return NextResponse.json(newDocument);
  } catch (error) {
    console.error('API ERROR creating document:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
