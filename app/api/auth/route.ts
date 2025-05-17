import { NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';
import { User, UserWithoutPassword } from '@/lib/types';

// Helper functie om wachtwoord te verwijderen uit gebruiker
function excludePassword(user: User): UserWithoutPassword {
  // Omit password from returned object
  const userWithoutPassword = { ...user };
delete userWithoutPassword.password;
return userWithoutPassword;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Registreer een nieuwe gebruiker
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json(
        { error: 'Email, wachtwoord en naam zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Lees alle gebruikers
    const users = await readJsonData<User>('users');
    
    // Controleer of de gebruiker al bestaat
    const existingUser = users.find(user => user.email === data.email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Er bestaat al een gebruiker met dit e-mailadres' },
        { status: 400 }
      );
    }
    
    // Hash het wachtwoord
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Genereer timestamps
    const now = new Date().toISOString();
    
    // Maak een nieuw user object
    const newUser: User = {
      id: uuidv4(),
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role || 'USER', // Standaard rol is USER
      createdAt: now,
      updatedAt: now
    };
    
    // Voeg de gebruiker toe aan het JSON bestand
    users.push(newUser);
    await writeJsonData('users', users);
    
    // Verwijder het wachtwoord uit de response
    const userWithoutPassword = excludePassword(newUser);
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Fout bij het registreren van gebruiker:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het registreren' },
      { status: 500 }
    );
  }
}

// Login route
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.email || !data.password) {
      return NextResponse.json(
        { error: 'Email en wachtwoord zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Lees alle gebruikers
    const users = await readJsonData<User>('users');
    
    // Zoek de gebruiker op basis van e-mail
    const user = users.find(user => user.email === data.email);
    
    // Controleer of de gebruiker bestaat
    if (!user) {
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens' },
        { status: 401 }
      );
    }
    
    // Controleer het wachtwoord
    const passwordValid = await bcrypt.compare(data.password, user.password || '');
    
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens' },
        { status: 401 }
      );
    }
    
    // Maak een JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Verwijder het wachtwoord uit de response
    const userWithoutPassword = excludePassword(user);
    
    return NextResponse.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Fout bij het inloggen:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het inloggen' },
      { status: 500 }
    );
  }
}

// Haal gebruikersgegevens op
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is verplicht' },
        { status: 400 }
      );
    }
    
    // Lees alle gebruikers
    const users = await readJsonData<User>('users');
    
    // Zoek de gebruiker op basis van e-mail
    const user = users.find(user => user.email === email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }
    
    // Verwijder het wachtwoord uit de response
    const userWithoutPassword = excludePassword(user);
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Fout bij het ophalen van gebruikersgegevens:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van gebruikersgegevens' },
      { status: 500 }
    );
  }
}
