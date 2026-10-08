import type { KyInstance } from 'ky';
import { z } from 'zod';

const sendMessageResponse = z.object({ idMessage: z.string() });

/**
 * Resolves to GREEN-API's idMessage, or null if it accepted the message but the response had no usable id.
 * Throws only when the message was not accepted, so a thrown error always means "not sent".
 */
export async function sendMessage(api: KyInstance, chatId: string, message: string): Promise<string | null> {
  const response = await api.post('sendMessage', { json: { chatId, message } }).json();
  return sendMessageResponse.safeParse(response).data?.idMessage ?? null;
}
