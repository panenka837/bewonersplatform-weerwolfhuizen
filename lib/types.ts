// Type definities voor de applicatie

// Gebruiker type
export type User = {
  id: string;
  email: string;
  password?: string; // Optioneel omdat we het wachtwoord niet altijd willen tonen
  name: string;
  role: 'ADMIN' | 'COACH' | 'USER';
  createdAt: string;
  updatedAt: string;
};

// Gebruiker zonder wachtwoord
export type UserWithoutPassword = Omit<User, 'password'> & { password?: never };

// JWT Payload type
export type JwtPayload = {
  userId: string;
  email: string;
  role: string;
};

// Chat bericht type
export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string | null; // null voor berichten naar iedereen
  content: string;
  createdAt: string;
  isRead: boolean;
  type?: 'private' | 'group'; // Type van bericht: privé of groep
  conversationId?: string; // ID van de conversatie voor meldingen-chat
};

// Chat conversatie type
export type Conversation = {
  id: string;
  participants: string[]; // gebruiker IDs
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

// Melding type
export type Report = {
  id: string;
  title: string;
  description: string;
  category: 'MAINTENANCE' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER';
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  reporterId: string; // ID van de gebruiker die de melding heeft gedaan
  reporterName: string; // Naam van de gebruiker die de melding heeft gedaan
  location?: string; // Locatie van het probleem (bijv. adres of beschrijving)
  assignedToId?: string; // ID van de beheerder/wooncoach aan wie de melding is toegewezen
  assignedToName?: string; // Naam van de beheerder/wooncoach aan wie de melding is toegewezen
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  conversationId?: string; // ID voor de chat conversatie met de melder
  images?: string[]; // URLs naar afbeeldingen
};

// Melding update type
export type ReportUpdate = {
  id: string;
  reportId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  isPublic: boolean; // Bepaalt of de update zichtbaar is voor de melder
};
