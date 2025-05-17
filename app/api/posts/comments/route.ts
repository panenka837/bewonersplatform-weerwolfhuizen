import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

// Comment en Post type definities
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

// POST nieuwe comment op een post
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to add a comment to a post');
    
    const data = await request.json();
    console.log('API: Received comment data:', data);
    
    if (!data.postId || !data.content || !data.authorId || !data.authorName) {
      return NextResponse.json(
        { error: 'Verplichte velden ontbreken' },
        { status: 400 }
      );
    }
    
    // Lees alle posts
    const posts = await readJsonData<Post>('posts');
    
    // Zoek de post waar de comment aan moet worden toegevoegd
    const postIndex = posts.findIndex(post => post.id === data.postId);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post niet gevonden' },
        { status: 404 }
      );
    }
    
    // Genereer een uniek ID en timestamps
    const now = new Date().toISOString();
    
    // Maak een nieuw comment object
    const newComment: Comment = {
      id: uuidv4(),
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      postId: data.postId,
      createdAt: now,
      updatedAt: now
    };
    
    // Voeg de comment toe aan de post
    posts[postIndex].comments.push(newComment);
    
    // Update de posts in de JSON database
    await writeJsonData('posts', posts);
    
    console.log('API: Comment added successfully:', newComment);
    return NextResponse.json(newComment);
  } catch (error) {
    console.error('API ERROR adding comment:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
