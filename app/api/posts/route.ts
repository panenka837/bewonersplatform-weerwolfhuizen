import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

// Post en Comment type definities
type Comment = {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  postId: string;
  createdAt: string;
  updatedAt: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
};

// GET alle posts
export async function GET() {
  try {
    console.log('API: Attempting to fetch posts from JSON database');
    
    // Lees posts uit JSON bestand
    let posts = await readJsonData<Post>('posts');
    
    // Controleer of posts een array is
    if (!Array.isArray(posts)) {
      console.warn('API: Posts data is not an array, initializing empty array');
      posts = [];
    }
    
    // Controleer op ontbrekende velden en voeg deze toe indien nodig
    posts = posts.map(post => {
      // Zorg ervoor dat alle verplichte velden aanwezig zijn
      return {
        ...post,
        authorId: post.authorId || 'system',
        authorName: post.authorName || 'Systeem',
        comments: post.comments || [],
        createdAt: post.createdAt || new Date().toISOString(),
        updatedAt: post.updatedAt || new Date().toISOString()
      };
    });
    
    console.log(`API: Successfully fetched ${posts.length} posts from JSON database`);
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API ERROR fetching posts:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe post
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create a post in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Genereer een uniek ID en timestamps
    const now = new Date().toISOString();
    
    // Maak een nieuw post object
    const newPost: Post = {
      id: uuidv4(),
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      createdAt: now,
      updatedAt: now,
      comments: []
    };
    
    // Voeg de post toe aan de JSON database
    let posts = await readJsonData<Post>('posts');
    
    // Zorg ervoor dat posts altijd een array is
    if (!Array.isArray(posts)) {
      console.warn('API: Posts data is not an array, initializing empty array');
      posts = [];
    }
    
    // Voeg de nieuwe post toe
    posts.push(newPost);
    
    // Log voor debugging
    console.log(`API: Adding new post to posts.json, total posts: ${posts.length}`);
    
    // Schrijf naar database
    const success = await writeJsonData('posts', posts);
    
    if (!success) {
      throw new Error('Kon de post niet opslaan in de database');
    }
    
    console.log(`API: Successfully added post with ID ${newPost.id} to database`);
    
    console.log('API: Post created successfully:', newPost);
    return NextResponse.json(newPost);
  } catch (error) {
    console.error('API ERROR creating post:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
