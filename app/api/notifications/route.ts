import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';

// Notificatie type
export type Notification = {
  id: string;
  userId: string; // 'all' voor alle gebruikers of specifieke gebruiker ID
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'MESSAGE' | 'BOARD' | 'EVENT' | 'REPORT';
  isRead: boolean;
  link: string | null; // Link naar gerelateerde pagina
  createdAt: string;
};

// GET notificaties voor een gebruiker
export async function GET(request: Request) {
  try {
    console.log('API: Attempting to fetch notifications from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Gebruiker ID is verplicht' },
        { status: 400 }
      );
    }
    
    // Lees notificaties uit JSON bestand
    let notifications = await readJsonData<Notification>('notifications');
    
    // Zorg ervoor dat notifications altijd een array is
    if (!Array.isArray(notifications)) {
      console.warn('API: Notifications data is not an array, initializing empty array');
      notifications = [];
    }
    
    console.log(`API: Read ${notifications.length} notifications from notifications.json`);
    
    // Filter notificaties voor deze gebruiker (inclusief 'all')
    let userNotifications = notifications.filter(notification => 
      notification.userId === userId || notification.userId === 'all'
    );
    
    // Filter op ongelezen notificaties indien gevraagd
    if (unreadOnly) {
      userNotifications = userNotifications.filter(notification => !notification.isRead);
    }
    
    // Sorteer op datum (nieuwste eerst)
    userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`API: Returning ${userNotifications.length} notifications for user ${userId}`);
    return NextResponse.json(userNotifications);
  } catch (error) {
    console.error('API ERROR fetching notifications:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuwe notificatie
export async function POST(request: Request) {
  try {
    console.log('API: Attempting to create new notification in JSON database');
    
    // Haal data op uit request body
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.userId || !data.title || !data.message || !data.type) {
      return NextResponse.json(
        { error: 'Gebruiker ID, titel, bericht en type zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Maak nieuwe notificatie
    const now = new Date().toISOString();
    const newNotification: Notification = {
      id: uuidv4(),
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      link: data.link || null,
      createdAt: now
    };
    
    // Voeg notificatie toe aan JSON database
    let notifications = await readJsonData<Notification>('notifications');
    
    // Zorg ervoor dat notifications altijd een array is
    if (!Array.isArray(notifications)) {
      console.warn('API: Notifications data is not an array, initializing empty array');
      notifications = [];
    }
    
    // Voeg de nieuwe notificatie toe
    notifications.push(newNotification);
    
    // Log voor debugging
    console.log(`API: Adding new notification to notifications.json, total notifications: ${notifications.length}`);
    
    // Schrijf naar database
    const success = await writeJsonData('notifications', notifications);
    
    if (!success) {
      throw new Error('Kon de notificatie niet opslaan in de database');
    }
    
    console.log(`API: Successfully created new notification with ID ${newNotification.id} in JSON database`);
    return NextResponse.json(newNotification);
  } catch (error) {
    console.error('API ERROR creating notification:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// PUT update notificatie (markeren als gelezen)
export async function PUT(request: Request) {
  try {
    console.log('API: Attempting to update notification in JSON database');
    
    // Haal data op uit request body
    const data = await request.json();
    
    // Valideer verplichte velden
    if (!data.id || !data.userId) {
      return NextResponse.json(
        { error: 'Notificatie ID en gebruiker ID zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Lees notificaties uit JSON bestand
    let notifications = await readJsonData<Notification>('notifications');
    
    // Zorg ervoor dat notifications altijd een array is
    if (!Array.isArray(notifications)) {
      console.warn('API: Notifications data is not an array, initializing empty array');
      notifications = [];
      return NextResponse.json(
        { error: 'Notificatie niet gevonden' },
        { status: 404 }
      );
    }
    
    console.log(`API: Read ${notifications.length} notifications from notifications.json for update`);
    
    // Zoek de notificatie die moet worden bijgewerkt
    const notificationIndex = notifications.findIndex(notification => 
      notification.id === data.id && (notification.userId === data.userId || notification.userId === 'all')
    );
    
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: 'Notificatie niet gevonden of geen toegang' },
        { status: 404 }
      );
    }
    
    // Update de notificatie
    const updatedNotification: Notification = {
      ...notifications[notificationIndex],
      isRead: data.isRead !== undefined ? data.isRead : notifications[notificationIndex].isRead
    };
    
    // Vervang de oude notificatie met de bijgewerkte notificatie
    notifications[notificationIndex] = updatedNotification;
    
    // Schrijf de bijgewerkte notificaties terug naar het JSON bestand
    const success = await writeJsonData('notifications', notifications);
    
    if (!success) {
      throw new Error('Kon de bijgewerkte notificaties niet opslaan in de database');
    }
    
    console.log(`API: Successfully wrote ${notifications.length} notifications to notifications.json`);
    console.log(`API: Successfully updated notification with ID ${updatedNotification.id} in JSON database`);
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('API ERROR updating notification:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// DELETE notificatie
export async function DELETE(request: Request) {
  try {
    console.log('API: Attempting to delete notification from JSON database');
    
    // Haal query parameters op
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    
    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Notificatie ID en gebruiker ID zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Lees notificaties uit JSON bestand
    let notifications = await readJsonData<Notification>('notifications');
    
    // Zorg ervoor dat notifications altijd een array is
    if (!Array.isArray(notifications)) {
      console.warn('API: Notifications data is not an array, initializing empty array');
      notifications = [];
      return NextResponse.json(
        { error: 'Notificatie niet gevonden' },
        { status: 404 }
      );
    }
    
    console.log(`API: Read ${notifications.length} notifications from notifications.json for deletion`);
    
    // Zoek de notificatie die moet worden verwijderd
    const notificationToDelete = notifications.find(notification => 
      notification.id === id && (notification.userId === userId || notification.userId === 'all')
    );
    
    if (!notificationToDelete) {
      return NextResponse.json(
        { error: 'Notificatie niet gevonden of geen toegang' },
        { status: 404 }
      );
    }
    
    // Filter de notificatie uit de lijst
    const updatedNotifications = notifications.filter(notification => 
      !(notification.id === id && (notification.userId === userId || notification.userId === 'all'))
    );
    
    // Schrijf de bijgewerkte notificaties terug naar het JSON bestand
    const success = await writeJsonData('notifications', updatedNotifications);
    
    if (!success) {
      throw new Error('Kon de bijgewerkte notificaties niet opslaan in de database');
    }
    
    console.log(`API: Successfully wrote ${updatedNotifications.length} notifications to notifications.json after deletion`);
    console.log(`API: Successfully deleted notification with ID ${id} from JSON database`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API ERROR deleting notification:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
