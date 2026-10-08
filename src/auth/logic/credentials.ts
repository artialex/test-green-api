import { z } from 'zod';

/** Source of truth for credentials: validates the login form and stored values, and trims input. */
export const credentialsSchema = z.object({
  idInstance: z.string().trim().regex(/^\d+$/, 'idInstance is a number'),
  apiTokenInstance: z.string().trim().min(1, 'apiTokenInstance is required'),
});

export type Credentials = z.output<typeof credentialsSchema>;
