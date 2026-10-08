import { phoneToChatId } from './phone';

export const MAX_MESSAGE_LENGTH = 4000;

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  id: string;
  direction: 'in' | 'out';
  text: string;
  timestamp: number;
  status: MessageStatus;
}

export interface Chat {
  /** Identity of the chat and where messages are sent. */
  chatId: string;
  /** Known phone number; matches incoming messages whose chatId is a platform user id. */
  phone?: string;
  title: string;
  messages: ChatMessage[];
}

/** A text-like message from the notification queue, in domain terms. */
export type ReceivedMessage = Omit<ChatMessage, 'status'> & {
  chatId: string;
  phone?: string;
  senderName?: string;
};

const phoneTitle = (phone: string) => `+${phone}`;

export function newChat(phone: string): Chat {
  return { chatId: phoneToChatId(phone), phone, title: phoneTitle(phone), messages: [] };
}

export function chatById(chats: Chat[], chatId: string): Chat | undefined {
  return chats.find((c) => c.chatId === chatId);
}

/** The one matching rule for a peer: same chatId, or same known phone number. */
export function findChat(chats: Chat[], peer: { chatId: string; phone?: string }): Chat | undefined {
  return chats.find((c) => c.chatId === peer.chatId || (peer.phone !== undefined && c.phone === peer.phone));
}

/** At-least-once delivery means the same message can arrive twice. */
export function hasMessage(chats: Chat[], id: string): boolean {
  return chats.some((c) => c.messages.some((m) => m.id === id));
}

export function toChatMessage({ id, direction, text, timestamp }: ReceivedMessage): ChatMessage {
  return { id, direction, text, timestamp, status: 'sent' };
}

/** A chat started by the other side, for a message that matched no existing chat. */
export function chatFromReceived(received: ReceivedMessage): Chat {
  const { chatId, phone, senderName } = received;
  return {
    chatId,
    phone,
    title: senderName || (phone ? phoneTitle(phone) : chatId),
    messages: [toChatMessage(received)],
  };
}

/** A message saved while still sending belongs to a request that died with the previous page. */
export function settleInterrupted(chats: Chat[]): Chat[] {
  return chats.map((chat) => ({
    ...chat,
    messages: chat.messages.map((m) => (m.status === 'sending' ? { ...m, status: 'failed' } : m)),
  }));
}
