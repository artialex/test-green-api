import { z } from 'zod';

const PHONE_CHAT_ID_RE = /^(\d+)@c\.us$/;

/** "+7 (999) 123-45-67" -> "79991234567"; rejects anything that isn't a full international number. */
export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{10,15}$/, '10–15 digits with country code, e.g. 79991234567'));

/** The "new chat" form. */
export const newChatSchema = z.object({ phone: phoneSchema });

export function phoneToChatId(phone: string): string {
  return `${phone}@c.us`;
}

export function phoneFromChatId(chatId: string): string | undefined {
  return PHONE_CHAT_ID_RE.exec(chatId)?.[1];
}
