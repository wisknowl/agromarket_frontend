import { apiClient } from './client';
import { Conversation, Message } from '../../types';

export interface EnrichedConversation extends Conversation {
  farmerName?: string;
  farmerAvatar?: string;
  creditTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface ConversationWithUserResponse {
  conversation: {
    id: string;
    participantAId: string;
    participantBId: string;
    lastMessage?: string;
    updatedAt: string;
  };
  targetUser: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
    isVerified: boolean;
    farmerProfile?: {
      farmName: string;
      creditTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
      creditScore: number;
    };
  };
}

export const fetchUserConversationsApi = async (): Promise<EnrichedConversation[]> => {
  const res = await apiClient.get('/chat/conversations');
  return res.data;
};

export const fetchConversationMessagesApi = async (conversationId: string): Promise<Message[]> => {
  const res = await apiClient.get(`/chat/${conversationId}/messages`);
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map((m: any) => ({
    ...m,
    timestamp: m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Just now',
  }));
};

export const fetchConversationDetailsApi = async (
  conversationId: string
): Promise<{ conversation: any; targetUser: any }> => {
  const res = await apiClient.get(`/chat/${conversationId}`);
  return res.data;
};

export const getOrCreateConversationWithUserApi = async (
  userId: string
): Promise<ConversationWithUserResponse> => {
  const res = await apiClient.get(`/chat/with/${userId}`);
  return res.data;
};

export const sendMessageApi = async (
  receiverId: string,
  content: string
): Promise<{ conversation: any; message: Message }> => {
  const res = await apiClient.post('/chat/messages', {
    receiverId,
    content,
  });
  return {
    conversation: res.data.conversation,
    message: {
      ...res.data.message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  };
};
