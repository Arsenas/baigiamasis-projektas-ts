export interface Message {
  _id?: string;
  sender: string;
  senderImage?: string;
  recipient: string;
  recipientImage?: string;
  message: string;
  liked?: string[];
  timestamp: string;
}

export interface User {
  _id?: string;
  username: string;
  image?: string;
}
