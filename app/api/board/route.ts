import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

// Marktplaats item type
export type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  price: number | null; // null voor gratis items
  category: 'TE_KOOP' | 'AANGEBODEN' | 'GEZOCHT' | 'DIENSTEN';
  condition?: 'NIEUW' | 'ALS_NIEUW' | 'GOED' | 'GEBRUIKT' | 'BESCHADIGD';
  images?: string[];
  userId: string;
  userName: string;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
};

// GET alle marktplaats items
export async function GET(request: Request) {
  try {
    console.log('API: Attempting to fetch marketplace items from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const category = url.searchParams.get('category');
    
    // Lees items uit JSON bestand
    let items = await readJsonData<MarketplaceItem>('board');
    
    // Zorg ervoor dat items altijd een array is
    if (!Array.isArray(items)) {
      console.warn('API: Board data is not an array, initializing empty array');
      items = [];
    }
    
    console.log(`API: Read ${items.length} items from board.json`);
    
    // Filter op basis van query parameters
    let filteredItems = items;
    
    if (userId) {
      filteredItems = filteredItems.filter(item => item.userId === userId);
    }
    
    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }
    
    // Sorteer op datum (nieuwste eerst)
    filteredItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`API: Successfully fetched ${filteredItems.length} marketplace items from JSON database`);
    return NextResponse.json(filteredItems);
  } catch (error) {
    console.error('API ERROR fetching marketplace items:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuw marktplaats item
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create new marketplace item in JSON database');
    
    // Haal data op uit request body
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.title || !data.description || !data.category || !data.userId || !data.userName) {
      return NextResponse.json(
        { error: 'Titel, beschrijving, categorie, gebruiker ID en gebruikersnaam zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Genereer timestamps
    const now = new Date().toISOString();
    
    // Maak nieuw item
    const newItem: MarketplaceItem = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      price: data.price !== undefined ? data.price : null,
      category: data.category,
      condition: data.condition,
      images: data.images || [],
      userId: data.userId,
      userName: data.userName,
      contactInfo: data.contactInfo,
      createdAt: now,
      updatedAt: now
    };
    
    // Voeg item toe aan JSON database
    let items = await readJsonData<MarketplaceItem>('board');
    
    // Zorg ervoor dat items altijd een array is
    if (!Array.isArray(items)) {
      console.warn('API: Board data is not an array, initializing empty array');
      items = [];
    }
    
    // Voeg het nieuwe item toe
    items.push(newItem);
    
    // Log voor debugging
    console.log(`API: Adding new item to board.json, total items: ${items.length}`);
    
    // Schrijf naar database
    const success = await writeJsonData('board', items);
    
    if (!success) {
      throw new Error('Kon het item niet opslaan in de database');
    }
    
    console.log(`API: Successfully created new marketplace item with ID ${newItem.id} in JSON database`);
    return NextResponse.json(newItem);
  } catch (error) {
    console.error('API ERROR creating marketplace item:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// PUT update marktplaats item
export async function PUT(request: Request) {
  try {
    console.log('API: Attempting to update marketplace item in JSON database');
    
    // Haal data op uit request body
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.id || !data.title || !data.description || !data.category) {
      return NextResponse.json(
        { error: 'ID, titel, beschrijving en categorie zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Lees items uit JSON bestand
    let items = await readJsonData<MarketplaceItem>('board');
    
    // Zorg ervoor dat items altijd een array is
    if (!Array.isArray(items)) {
      console.warn('API: Board data is not an array, initializing empty array');
      items = [];
    }
    
    console.log(`API: Read ${items.length} items from board.json for update`);
    
    // Zoek het item dat moet worden bijgewerkt
    const itemIndex = items.findIndex(item => item.id === data.id);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item niet gevonden' },
        { status: 404 }
      );
    }
    
    // Controleer of de gebruiker het item mag bijwerken
    const userId = data.userId;
    if (userId && userId !== items[itemIndex].userId && userId !== 'admin') {
      return NextResponse.json(
        { error: 'Je hebt geen toestemming om dit item te bewerken' },
        { status: 403 }
      );
    }
    
    // Update het item
    const updatedItem: MarketplaceItem = {
      ...items[itemIndex],
      title: data.title,
      description: data.description,
      price: data.price !== undefined ? data.price : items[itemIndex].price,
      category: data.category,
      condition: data.condition !== undefined ? data.condition : items[itemIndex].condition,
      images: data.images || items[itemIndex].images,
      contactInfo: data.contactInfo !== undefined ? data.contactInfo : items[itemIndex].contactInfo,
      updatedAt: new Date().toISOString()
    };
    
    // Vervang het oude item met het bijgewerkte item
    items[itemIndex] = updatedItem;
    
    // Schrijf de bijgewerkte items terug naar het JSON bestand
    const success = await writeJsonData('board', items);
    
    if (!success) {
      throw new Error('Kon de bijgewerkte items niet opslaan in de database');
    }
    
    console.log(`API: Successfully wrote ${items.length} items to board.json`);
    
    console.log(`API: Successfully updated marketplace item with ID ${updatedItem.id} in JSON database`);
    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('API ERROR updating marketplace item:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// DELETE marktplaats item
export async function DELETE(request: Request) {
  try {
    console.log('API: Attempting to delete marketplace item from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is verplicht' },
        { status: 400 }
      );
    }
    
    // Lees items uit JSON bestand
    let items = await readJsonData<MarketplaceItem>('board');
    
    // Zorg ervoor dat items altijd een array is
    if (!Array.isArray(items)) {
      console.warn('API: Board data is not an array, initializing empty array');
      items = [];
      return NextResponse.json(
        { error: 'Item niet gevonden' },
        { status: 404 }
      );
    }
    
    console.log(`API: Read ${items.length} items from board.json for deletion`);
    
    // Zoek het item dat moet worden verwijderd
    const itemToDelete = items.find(item => item.id === id);
    
    if (!itemToDelete) {
      return NextResponse.json(
        { error: 'Item niet gevonden' },
        { status: 404 }
      );
    }
    
    // Controleer of de gebruiker het item mag verwijderen
    if (userId && userId !== itemToDelete.userId && userId !== 'admin') {
      return NextResponse.json(
        { error: 'Je hebt geen toestemming om dit item te verwijderen' },
        { status: 403 }
      );
    }
    
    // Filter het item uit de lijst
    const updatedItems = items.filter(item => item.id !== id);
    
    // Schrijf de bijgewerkte items terug naar het JSON bestand
    const success = await writeJsonData('board', updatedItems);
    
    if (!success) {
      throw new Error('Kon de bijgewerkte items niet opslaan in de database');
    }
    
    console.log(`API: Successfully wrote ${updatedItems.length} items to board.json after deletion`);
    
    console.log(`API: Successfully deleted marketplace item with ID ${id} from JSON database`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API ERROR deleting marketplace item:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
