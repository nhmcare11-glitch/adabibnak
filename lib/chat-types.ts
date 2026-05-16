export interface ChatUser {
  id: string;
  name: string;
  imageUrl?: string | null;
  specialty?: string | null;
  role?: string;
}

export interface ChatFile {
  name: string;
  type: string;
  size?: number;
  url: string;
  path?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: ChatUser;
  files?: ChatFile[];
  status?: "sending" | "sent" | "read";
  read?: boolean;
  isTemp?: boolean;
}

export interface Conversation {
  id: string;
  doctorId: string;
  patientId: string;
  doctor: ChatUser;
  patient: ChatUser;
  messages?: ChatMessage[];
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  lastMessageHasFiles?: boolean;
  unreadCount?: number;
  updatedAt?: string;
}

export interface FilePreview {
  file: File;
  preview: string | null;
  type: string;
  name: string;
  size: number;
}