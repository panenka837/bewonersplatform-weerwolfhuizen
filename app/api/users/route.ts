import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { User, UserWithoutPassword } from '@/lib/types';

// Helper functie om wachtwoord te verwijderen uit gebruiker
function excludePassword(user: User): UserWithoutPassword {
  // Destructure om password uit te sluiten
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword as UserWithoutPassword;
}

// GET alle gebruikers of een specifieke gebruiker met zoek- en filterfunctionaliteit en paginering
export async function GET(request: Request) {
  try {
    console.log('API: Attempting to fetch users from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const search = url.searchParams.get('search')?.toLowerCase();
    const role = url.searchParams.get('role');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Lees gebruikers uit JSON bestand
    let users = await readJsonData<User>('users');
    
    // Controleer of users een array is
    if (!Array.isArray(users)) {
      console.warn('API: Users data is not an array, initializing empty array');
      users = [];
    }
    
    // Controleer op ontbrekende velden en voeg deze toe indien nodig
    users = users.map(user => {
      // Zorg ervoor dat alle verplichte velden aanwezig zijn
      return {
        ...user,
        name: user.name || '',
        role: user.role || 'USER',
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || user.createdAt || new Date().toISOString()
      };
    });
    
    // Als een specifieke gebruiker wordt opgevraagd
    if (id) {
      const user = users.find(u => u.id === id);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Gebruiker niet gevonden' },
          { status: 404 }
        );
      }
      
      // Verwijder wachtwoord uit de response
      const userWithoutPassword = excludePassword(user);
      
      console.log(`API: Successfully fetched user with ID ${id} from JSON database`);
      return NextResponse.json(userWithoutPassword);
    }
    
    // Filter gebruikers op basis van zoekopdracht
    if (search) {
      users = users.filter(user => 
        user.name?.toLowerCase().includes(search) || 
        user.email.toLowerCase().includes(search)
      );
    }
    
    // Filter gebruikers op basis van rol
    if (role) {
      users = users.filter(user => user.role === role);
    }
    
    // Sorteer gebruikers
    users.sort((a, b) => {
      let valueA = a[sortBy as keyof User];
      let valueB = b[sortBy as keyof User];
      
      // Zorg ervoor dat we strings vergelijken voor string velden
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        if (sortOrder === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      }
      
      // Zorg ervoor dat we datums vergelijken voor datum velden
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        const dateA = new Date(valueA as string).getTime();
        const dateB = new Date(valueB as string).getTime();
        
        if (sortOrder === 'asc') {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      }
      
      return 0;
    });
    
    // Bereken paginering
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);
    
    // Verwijder wachtwoorden uit de response
    const usersWithoutPasswords = paginatedUsers.map(user => excludePassword(user));
    
    console.log(`API: Successfully fetched ${paginatedUsers.length} users from JSON database (page ${page} of ${totalPages})`);
    return NextResponse.json({
      users: usersWithoutPasswords,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('API ERROR fetching users:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe gebruiker
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create a user in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Valideer verplichte velden
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json(
        { error: 'E-mail, wachtwoord en naam zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Valideer e-mail formaat
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Ongeldig e-mailadres formaat' },
        { status: 400 }
      );
    }
    
    // Valideer wachtwoord sterkte
    if (data.password.length < 8) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 8 tekens bevatten' },
        { status: 400 }
      );
    }
    
    // Valideer rol
    const validRoles = ['USER', 'COACH', 'ADMIN'];
    if (data.role && !validRoles.includes(data.role)) {
      return NextResponse.json(
        { error: 'Ongeldige rol. Geldige rollen zijn: USER, COACH, ADMIN' },
        { status: 400 }
      );
    }
    
    // Lees alle gebruikers
    let users = await readJsonData<User>('users');
    
    // Controleer of users een array is
    if (!Array.isArray(users)) {
      console.warn('API: Users data is not an array, initializing empty array');
      users = [];
    }
    
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
      role: data.role || 'USER',
      createdAt: now,
      updatedAt: now
    };
    
    // Voeg de gebruiker toe aan het JSON bestand
    users.push(newUser);
    const success = await writeJsonData('users', users);
    
    if (!success) {
      throw new Error('Kon de gebruiker niet opslaan in de database');
    }
    
    console.log(`API: Successfully added user with ID ${newUser.id} to database`);
    
    // Verwijder het wachtwoord uit de response
    const userWithoutPassword = excludePassword(newUser);
    
    console.log('API: Successfully created user in JSON database');
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('API ERROR creating user:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// PUT update bestaande gebruiker
export async function PUT(request: Request) {
  try {
    console.log('API: Attempting to update a user in JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gebruiker ID is vereist' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    console.log('API: Received data for update:', data);
    
    // Valideer e-mail formaat als het is opgegeven
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return NextResponse.json(
          { error: 'Ongeldig e-mailadres formaat' },
          { status: 400 }
        );
      }
    }
    
    // Valideer wachtwoord sterkte als het is opgegeven
    if (data.password && data.password.length < 8) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 8 tekens bevatten' },
        { status: 400 }
      );
    }
    
    // Valideer rol als het is opgegeven
    if (data.role) {
      const validRoles = ['USER', 'COACH', 'ADMIN'];
      if (!validRoles.includes(data.role)) {
        return NextResponse.json(
          { error: 'Ongeldige rol. Geldige rollen zijn: USER, COACH, ADMIN' },
          { status: 400 }
        );
      }
    }
    
    // Lees alle gebruikers
    let users = await readJsonData<User>('users');
    
    // Controleer of users een array is
    if (!Array.isArray(users)) {
      console.warn('API: Users data is not an array, initializing empty array');
      users = [];
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }
    
    // Zoek de gebruiker
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }
    
    const user = users[userIndex];
    
    // Controleer of e-mail al in gebruik is door een andere gebruiker
    if (data.email && data.email !== user.email) {
      const emailExists = users.some(u => u.email === data.email && u.id !== id);
      if (emailExists) {
        return NextResponse.json(
          { error: 'Er bestaat al een gebruiker met dit e-mailadres' },
          { status: 400 }
        );
      }
    }
    
    // Genereer timestamp
    const now = new Date().toISOString();
    
    // Update het wachtwoord indien opgegeven
    let updatedPassword = user.password;
    if (data.password) {
      updatedPassword = await bcrypt.hash(data.password, 10);
    }
    
    // Update de gebruiker
    const updatedUser: User = {
      ...user,
      email: data.email || user.email,
      name: data.name || user.name,
      role: data.role || user.role,
      updatedAt: now
    };
    
    // Update het wachtwoord alleen als het is opgegeven
    if (data.password) {
      updatedUser.password = updatedPassword;
    }
    
    // Update de gebruiker in het JSON bestand
    users[userIndex] = updatedUser;
    const success = await writeJsonData('users', users);
    
    if (!success) {
      throw new Error('Kon de gebruiker niet bijwerken in de database');
    }
    
    // Verwijder het wachtwoord uit de response
    const userWithoutPassword = excludePassword(updatedUser);
    
    console.log(`API: Successfully updated user with ID ${id} in JSON database`);
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('API ERROR updating user:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// DELETE een gebruiker
export async function DELETE(request: Request) {
  try {
    console.log('API: Attempting to delete a user from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Gebruiker ID is verplicht' },
        { status: 400 }
      );
    }
    
    // Lees alle gebruikers
    let users = await readJsonData<User>('users');
    
    // Controleer of users een array is
    if (!Array.isArray(users)) {
      console.warn('API: Users data is not an array, initializing empty array');
      users = [];
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }
    
    // Zoek de gebruiker die we willen verwijderen
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Gebruiker niet gevonden' },
        { status: 404 }
      );
    }
    
    // Verwijder de gebruiker uit de array
    const deletedUser = users.splice(userIndex, 1)[0];
    
    // Schrijf de bijgewerkte array terug naar het bestand
    const success = await writeJsonData('users', users);
    
    if (!success) {
      throw new Error('Kon de gebruiker niet verwijderen uit de database');
    }
    
    console.log(`API: Successfully deleted user with ID ${id} from JSON database`);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('API ERROR deleting user:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
