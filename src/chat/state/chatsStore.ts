import type { KyInstance } from 'ky';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { sendMessage } from '../api/messages';
import { pollNotifications } from '../api/notifications';
import {
  chatById,
  chatFromReceived,
  findChat,
  hasMessage,
  newChat,
  settleInterrupted,
  toChatMessage,
  type Chat,
  type ChatMessage,
  type ReceivedMessage,
} from '../logic/chats';
import { phoneToChatId } from '../logic/phone';

/** The logged-in instance the store works for; set by startChatSession. */
interface ChatSession {
  instanceId: string;
  api: KyInstance;
}

interface ChatsState {
  session: ChatSession | null;
  /** Saved history, one chat list per GREEN-API instance. */
  chatsByInstance: Record<string, Chat[]>;
  activeChatId: string | null;
  receiveError: string | null;
  createChat: (phone: string) => void;
  selectChat: (chatId: string) => void;
  send: (chatId: string, text: string) => Promise<void>;
  receive: (message: ReceivedMessage) => void;
  setReceiveError: (error: string | null) => void;
}

const NO_CHATS: Chat[] = [];

/** The current instance's chats. */
export const selectChats = (s: ChatsState): Chat[] =>
  (s.session && s.chatsByInstance[s.session.instanceId]) || NO_CHATS;

export const selectActiveChat = (s: ChatsState): Chat | undefined =>
  s.activeChatId ? chatById(selectChats(s), s.activeChatId) : undefined;

export const useChatsStore = create<ChatsState>()(
  persist(
    immer((set, get) => {
      /** The current instance's chat list inside a draft, created on first use. */
      const draftChats = (s: ChatsState): Chat[] => {
        if (!s.session) throw new Error('No chat session: call startChatSession first');
        return (s.chatsByInstance[s.session.instanceId] ??= []);
      };

      return {
        session: null,
        chatsByInstance: {},
        activeChatId: null,
        receiveError: null,

        createChat(phone) {
          set((s) => {
            const chats = draftChats(s);
            // Reuses a chat the other side already started from this number.
            let chat = findChat(chats, { chatId: phoneToChatId(phone), phone });
            if (!chat) {
              chat = newChat(phone);
              chats.unshift(chat);
            }
            s.activeChatId = chat.chatId;
          });
        },

        selectChat(chatId) {
          set({ activeChatId: chatId });
        },

        async send(chatId, text) {
          const session = get().session;
          if (!session) return;
          // Updates go to this instance's chats even if the user switches instance mid-request.
          const update = (id: string, change: (m: ChatMessage) => void) =>
            set((s) => {
              const message = chatById(s.chatsByInstance[session.instanceId] ?? [], chatId)?.messages.find(
                (m) => m.id === id,
              );
              if (message) change(message);
            });

          const id = crypto.randomUUID();
          set((s) => {
            chatById(draftChats(s), chatId)?.messages.push({
              id,
              direction: 'out',
              text,
              timestamp: Date.now(),
              status: 'sending',
            });
          });

          try {
            const idMessage = await sendMessage(session.api, chatId, text);
            update(id, (m) => {
              if (idMessage) m.id = idMessage;
              m.status = 'sent';
            });
          } catch {
            update(id, (m) => {
              m.status = 'failed';
            });
          }
        },

        receive(message) {
          set((s) => {
            const chats = draftChats(s);
            if (hasMessage(chats, message.id)) return;
            const chat = findChat(chats, message);
            if (chat) {
              chat.messages.push(toChatMessage(message));
            } else {
              chats.unshift(chatFromReceived(message));
              s.activeChatId ??= message.chatId;
            }
          });
        },

        setReceiveError(error) {
          // Called after every poll; skipping no-op sets also skips a localStorage write each time.
          if (get().receiveError !== error) set({ receiveError: error });
        },
      };
    }),
    {
      name: 'green-api:chats',
      version: 1,
      partialize: (s) => ({ chatsByInstance: s.chatsByInstance }),
      merge: (persisted, current) => {
        const stored = (persisted as { chatsByInstance?: Record<string, Chat[]> } | undefined)?.chatsByInstance ?? {};
        return {
          ...current,
          chatsByInstance: Object.fromEntries(
            Object.entries(stored).map(([instanceId, chats]) => [instanceId, settleInterrupted(chats)]),
          ),
        };
      },
    },
  ),
);

/** Receives messages into the store until the returned stop function is called. */
function startReceiving(api: KyInstance): () => void {
  const { receive, setReceiveError } = useChatsStore.getState();
  const controller = new AbortController();
  void pollNotifications(api, controller.signal, {
    onMessage: receive,
    onError: setReceiveError,
    onRecovered: () => setReceiveError(null),
  });
  return () => controller.abort();
}

/**
 * Binds the store to one logged-in instance: shows its chats and starts receiving once it has at least one
 * (with no chats there is nobody to receive from yet). Returns a stop function (fits a useEffect cleanup).
 */
export function startChatSession(instanceId: string, api: KyInstance): () => void {
  useChatsStore.setState((s) => ({
    session: { instanceId, api },
    activeChatId: s.chatsByInstance[instanceId]?.[0]?.chatId ?? null,
    receiveError: null,
  }));

  let stopReceiving: (() => void) | undefined;
  const startOnFirstChat = () => {
    if (stopReceiving || selectChats(useChatsStore.getState()).length === 0) return;
    stopReceiving = startReceiving(api);
    unsubscribe();
  };
  const unsubscribe = useChatsStore.subscribe(startOnFirstChat);
  startOnFirstChat();

  return () => {
    unsubscribe();
    stopReceiving?.();
    useChatsStore.setState({ session: null, activeChatId: null, receiveError: null });
  };
}
