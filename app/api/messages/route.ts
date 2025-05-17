import { NextResponse } from 'next/server';
import { readJsonData, writeJsonData } from '@/lib/data-service';
import { v4 as uuidv4 } from 'uuid';
import { Message, User } from '@/lib/types';
import { sendChatNotification } from '@/lib/email-service';

// GET alle berichten of berichten voor een specifieke gebruiker of conversatie
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const recipientId = url.searchParams.get('recipientId');
    const type = url.searchParams.get('type'); // 'group' of undefined voor privéberichten
    const conversationId = url.searchParams.get('conversationId'); // Voor meldingen-chat functionaliteit
    
    console.log('API: Attempting to fetch messages from JSON database');
    
    // Lees berichten uit JSON bestand
    const messages = await readJsonData<Message>('messages');
    
    // Filter berichten op basis van parameters
    let filteredMessages = messages;
    
    // Als conversationId is opgegeven, filter op basis daarvan (voor meldingen-chat)
    if (conversationId) {
      filteredMessages = messages.filter(message => 
        message.conversationId === conversationId
      );
      
      console.log(`API: Filtered ${filteredMessages.length} messages for conversation ${conversationId}`);
    }
    // Controleer eerst op type
    else if (type === 'group') {
      // Alleen groepsberichten - moet expliciet type 'group' hebben
      filteredMessages = messages.filter(message => 
        message.recipientId === null && message.type === 'group'
      );
      
      console.log(`API: Filtered ${filteredMessages.length} group messages`);
    } else if (recipientId === 'null' || recipientId === null) {
      // Als alleen recipientId=null is opgegeven zonder type, dan nemen we aan dat het om groepsberichten gaat
      // Dit is voor backward compatibility met oudere code die nog geen type parameter gebruikt
      filteredMessages = messages.filter(message => 
        message.recipientId === null && message.type === 'group'
      );
      
      console.log(`API: Filtered ${filteredMessages.length} group messages (recipientId=null without type)`);
    } else if (userId && recipientId) {
      // Directe berichten tussen twee gebruikers (privéchats)
      filteredMessages = messages.filter(message => 
        // Berichten tussen de twee gebruikers
        ((message.senderId === userId && message.recipientId === recipientId) || 
         (message.senderId === recipientId && message.recipientId === userId)) &&
        // Berichten die geen groepsberichten zijn (ofwel type 'private' of geen type)
        (message.type === 'private' || message.type === undefined)
      );
      
      console.log(`API: Filtered ${filteredMessages.length} private messages between users`);
    } else if (userId) {
      // Alle berichten voor een specifieke gebruiker (exclusief groepsberichten)
      filteredMessages = messages.filter(message => 
        // Berichten voor of van deze gebruiker
        (message.recipientId === userId || message.senderId === userId) &&
        // Berichten die geen groepsberichten zijn (ofwel type 'private' of geen type)
        (message.type === 'private' || message.type === undefined)
      );
      
      console.log(`API: Filtered ${filteredMessages.length} private messages for user`);
    }
    
    // Sorteer berichten op datum (oudste eerst)
    filteredMessages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    console.log(`API: Successfully fetched ${filteredMessages.length} messages from JSON database`);
    return NextResponse.json(filteredMessages);
  } catch (error) {
    console.error('API ERROR fetching messages:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// POST nieuw bericht
export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log('API: Attempting to create a message in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Valideer verplichte velden
    if (!data.senderId || !data.content) {
      return NextResponse.json(
        { error: 'Afzender ID en inhoud zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Haal gebruikersgegevens op voor de afzender
    const users = await readJsonData<User>('users');
    let senderName = '';
    
    // Controleer of het een tijdelijke ID is (begint met 'temp-')
    if (data.senderId.startsWith('temp-')) {
      // Voor tijdelijke gebruikers gebruiken we de meegestuurde naam of een standaardnaam
      senderName = data.senderName || 'Gast Gebruiker';
      console.log('API: Using temporary user with name:', senderName);
    } else {
      // Voor bestaande gebruikers zoeken we de naam op in de database
      const sender = users.find(user => user.id === data.senderId);
      
      if (!sender) {
        return NextResponse.json(
          { error: 'Afzender niet gevonden' },
          { status: 404 }
        );
      }
      
      senderName = sender.name;
    }
    
    // Genereer een uniek ID en timestamp
    const now = new Date().toISOString();
    
    // Bepaal het type bericht (groep of privé)
    const messageType = data.type || (data.recipientId ? 'private' : 'group');
    
    // Maak een nieuw bericht object
    const newMessage: Message = {
      id: uuidv4(),
      senderId: data.senderId,
      senderName: senderName,
      recipientId: data.recipientId || null,
      content: data.content,
      createdAt: now,
      isRead: false,
      type: messageType as 'private' | 'group',
      conversationId: data.conversationId // Voor meldingen-chat functionaliteit
    };
    
    // Voeg het bericht toe aan de JSON database
    const messages = await readJsonData<Message>('messages');
    messages.push(newMessage);
    await writeJsonData('messages', messages);
    
    // Stuur een e-mailnotificatie als het een privébericht is
    if (messageType === 'private' && data.recipientId) {
      try {
        // Zoek de ontvanger op in de gebruikersdatabase
        const recipient = users.find(user => user.id === data.recipientId);
        
        if (recipient && recipient.email) {
          // Bouw de chat URL op
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
          const chatUrl = `${baseUrl}/messages?recipientId=${data.senderId}&recipientName=${encodeURIComponent(senderName)}`;
          
          // Stuur de e-mailnotificatie
          const emailResult = await sendChatNotification({
            to: recipient.email,
            senderName: senderName,
            message: data.content,
            chatUrl: chatUrl
          });
          
          console.log('API: Email notification result:', emailResult);
        }
      } catch (emailError) {
        // Log de fout, maar laat het bericht nog steeds doorgaan
        console.error('API ERROR sending email notification:', emailError);
      }
    }
    
    console.log('API: Message created successfully:', newMessage);
    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('API ERROR creating message:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}

// PUT markeer berichten als gelezen
export async function PUT(request: Request): Promise<NextResponse> {
  try {
    console.log('API: Attempting to update messages in JSON database');
    
    const data = await request.json();
    console.log('API: Received data:', data);
    
    // Valideer verplichte velden
    if (!data.userId || !data.senderId) {
      return NextResponse.json(
        { error: 'Gebruiker ID en afzender ID zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Lees berichten uit JSON bestand
    const messages = await readJsonData<Message>('messages');
    
    // Markeer berichten als gelezen
    let updatedCount = 0;
    
    for (const message of messages) {
      if (message.senderId === data.senderId && message.recipientId === data.userId && !message.isRead) {
        message.isRead = true;
        updatedCount++;
      }
    }
    
    // Sla de bijgewerkte berichten op
    if (updatedCount > 0) {
      await writeJsonData('messages', messages);
    }
    
    console.log(`API: Successfully marked ${updatedCount} messages as read`);
    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    console.error('API ERROR updating messages:', error);
    return NextResponse.json(
      { error: `Er is een fout opgetreden: ${error instanceof Error ? error.message : 'Onbekende fout'}` },
      { status: 500 }
    );
  }
}
