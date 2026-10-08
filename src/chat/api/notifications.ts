import type { KyInstance } from 'ky';
import { z } from 'zod';
import { sleep } from '../../toolbelt/async';
import { errorMessage } from '../../toolbelt/errors';
import type { ReceivedMessage } from '../logic/chats';
import { phoneFromChatId } from '../logic/phone';

const RECEIVE_TIMEOUT_SEC = 5;
// The server holds the request up to RECEIVE_TIMEOUT_SEC; allow for that plus network time.
const RECEIVE_REQUEST_TIMEOUT_MS = (RECEIVE_TIMEOUT_SEC + 10) * 1000;
const RETRY_DELAY_MS = 3000;

const DIRECTION_BY_WEBHOOK: Record<string, ReceivedMessage['direction']> = {
  incomingMessageReceived: 'in',
  // Sent from the phone itself. API-sent copies (outgoingAPIMessageReceived) are skipped:
  // the UI already shows them.
  outgoingMessageReceived: 'out',
};

/** A notification body, parsed straight into a message the chat shows, or null for anything else. */
const messageSchema = z
  .object({
    typeWebhook: z.string(),
    idMessage: z.string().optional(),
    timestamp: z.number().optional(),
    senderData: z
      .object({
        chatId: z.string(),
        chatName: z.string().optional(),
        senderName: z.string().optional(),
        // Docs show a number; accept a string too.
        senderPhoneNumber: z.union([z.number(), z.string()]).transform(String).optional(),
      })
      .optional(),
    messageData: z
      .object({
        typeMessage: z.string(),
        textMessageData: z.object({ textMessage: z.string() }).optional(),
        extendedTextMessageData: z.object({ text: z.string() }).optional(),
      })
      .optional(),
  })
  .transform((body): ReceivedMessage | null => {
    const direction = DIRECTION_BY_WEBHOOK[body.typeWebhook];
    const { senderData, messageData, idMessage } = body;
    if (!direction || !senderData || !messageData || !idMessage) return null;

    return {
      id: idMessage,
      direction,
      text:
        messageData.textMessageData?.textMessage ??
        messageData.extendedTextMessageData?.text ??
        `[${messageData.typeMessage}]`,
      timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
      chatId: senderData.chatId,
      phone: senderData.senderPhoneNumber ?? phoneFromChatId(senderData.chatId),
      senderName: senderData.senderName || senderData.chatName,
    };
  });

/**
 * Only the envelope is strict. A body we can't parse becomes null instead of failing the whole
 * response: otherwise one odd notification would block the FIFO queue forever (it's never deleted).
 */
const notificationSchema = z
  .object({
    receiptId: z.number(),
    // The raw body, parsed into a message (or null).
    body: z.unknown().transform((body) => messageSchema.safeParse(body).data ?? null),
  })
  .nullable();

/**
 * Receives one notification (if any), hands over its message, then acknowledges it.
 * ky's own retries are off: the poll loop below already retries, with a pause.
 */
async function processNext(
  api: KyInstance,
  signal: AbortSignal,
  onMessage: (message: ReceivedMessage) => void,
): Promise<void> {
  const notification = await api
    .get('receiveNotification', {
      searchParams: { receiveTimeout: RECEIVE_TIMEOUT_SEC },
      timeout: RECEIVE_REQUEST_TIMEOUT_MS,
      retry: 0,
      signal,
    })
    .json(notificationSchema);
  if (!notification) return;
  if (notification.body) onMessage(notification.body);
  await api.delete(`deleteNotification/${notification.receiptId}`, { retry: 0, signal });
}

export interface PollHandlers {
  onMessage: (message: ReceivedMessage) => void;
  onError: (message: string) => void;
  onRecovered: () => void;
}

/**
 * Drains the notification queue until `signal` aborts:
 * receiveNotification -> handle -> deleteNotification, one at a time, in FIFO order.
 * Delivery is at-least-once: if delete fails, the same notification comes back.
 */
export async function pollNotifications(api: KyInstance, signal: AbortSignal, handlers: PollHandlers): Promise<void> {
  while (!signal.aborted) {
    try {
      await processNext(api, signal, handlers.onMessage);
      handlers.onRecovered();
    } catch (e) {
      if (signal.aborted) return;
      handlers.onError(errorMessage(e));
      await sleep(RETRY_DELAY_MS, signal);
    }
  }
}
