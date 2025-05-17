import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

// Bulletin type definitie
type BulletinPost = {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string; // ID van de gebruiker die het bericht heeft geplaatst
  userName: string; // Naam van de gebruiker die het bericht heeft geplaatst
};

// GET alle prikbord berichten
export async function GET() {
  try {
    console.log('API: Attempting to fetch bulletin posts from JSON database');
    
    // Lees prikbord berichten uit JSON bestand
    let posts = await readJsonData<BulletinPost>('bulletin');
    
    // Controleer of posts een array is
    if (!Array.isArray(posts)) {
      console.warn('API: Bulletin posts data is not an array, initializing empty array');
      posts = [];
    }
    
    // Controleer op ontbrekende velden en voeg deze toe indien nodig
    posts = posts.map(post => {
      // Zorg ervoor dat alle verplichte velden aanwezig zijn
      return {
        ...post,
        userId: post.userId || 'system',
        userName: post.userName || 'Systeem',
        important: post.important !== undefined ? post.important : false,
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: post.updatedAt || new Date().toISOString()
      };
    });
    
    // Sorteer berichten op datum (nieuwste eerst)
    posts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    console.log(`API: Successfully fetched ${posts.length} bulletin posts from JSON database`);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API ERROR fetching bulletin posts:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuw prikbord bericht
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create a bulletin post in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Valideer verplichte velden
    if (!data.title || !data.content || !data.userId || !data.userName) {
      return NextResponse.json(
        { error: 'Titel, inhoud, gebruiker ID en naam zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Genereer een uniek ID en timestamps
    const now = new Date().toISOString();
    
    const newPost: BulletinPost = {
      id: uuidv4(),
      title: data.title,
      content: data.content,
      important: data.important || false,
      createdAt: now,
      updatedAt: now,
      userId: data.userId,
      userName: data.userName
    };
    
    // Voeg het bericht toe aan de JSON database
    let posts = await readJsonData<BulletinPost>('bulletin');
    
    // Zorg ervoor dat posts altijd een array is
    if (!Array.isArray(posts)) {
      console.warn('API: Bulletin posts data is not an array, initializing empty array');
      posts = [];
    }
    
    // Voeg het nieuwe bericht toe
    posts.push(newPost);
    
    // Log voor debugging
    console.log(`API: Adding new bulletin post to bulletin.json, total posts: ${posts.length}`);
    
    // Schrijf naar database
    const success = await writeJsonData('bulletin', posts);
    
    if (!success) {
      throw new Error('Kon het bericht niet opslaan in de database');
    }
    
    console.log(`API: Successfully added bulletin post with ID ${newPost.id} to database`);
    
    console.log('API: Bulletin post created successfully:', newPost);
    return NextResponse.json(newPost);
  } catch (error) {
    console.error('API ERROR creating bulletin post:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// DELETE een prikbord bericht
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
    
    console.log(`API: Attempting to delete bulletin post with ID: ${id}`);
    
    // Controleer of de gebruiker het bericht mag verwijderen
    const posts = await readJsonData<BulletinPost>('bulletin');
    const postToDelete = posts.find(post => post.id === id);
    
    if (!postToDelete) {
      return NextResponse.json(
        { error: 'Bericht niet gevonden' },
        { status: 404 }
      );
    }
    
    // Controleer of de gebruiker het bericht heeft geplaatst of een admin is
    if (userId && userId !== postToDelete.userId && userId !== 'admin') {
      return NextResponse.json(
        { error: 'Je hebt geen toestemming om dit bericht te verwijderen' },
        { status: 403 }
      );
    }
    
    // Verwijder het bericht uit de JSON database
    const filteredPosts = posts.filter(post => post.id !== id);
    await writeJsonData('bulletin', filteredPosts);
    
    console.log(`API: Bulletin post with ID ${id} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API ERROR deleting bulletin post:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
