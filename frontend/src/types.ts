export interface Message {
  _id?: string;
  sender: string;
  senderImage?: string;
  recipient: string;
  recipientImage?: string;
  message: string;
  liked?: string[];
  timestamp: string;
  read?: boolean;
  conversation?: string;
}

export interface User {
  _id?: string;
  username: string;
  image?: string;
}

export interface Participant {
  _id: string;
  username: string;
  image: string;
}

export interface Conversation {
  _id: string;
  updatedAt: string;
  participants: Participant[];
}
