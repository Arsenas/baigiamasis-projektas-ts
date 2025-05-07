// Represents a user (used for sender, recipient, current user, etc.)
export interface User {
  _id: string;
  username: string;
  image?: string;
}

// Message model — includes full sender object
export interface Message {
  _id?: string;
  sender: User; // ✅ Populated user object
  recipient?: string; // Still using string unless you're populating recipient too
  message: string;
  liked?: string[];
  timestamp: string;
  read?: boolean;
  conversation?: string;
}

// For conversation participant preview
export interface Participant {
  _id: string;
  username: string;
  image: string;
}

// Full conversation with participants
export interface Conversation {
  _id: string;
  updatedAt: string;
  participants: Participant[];
}
