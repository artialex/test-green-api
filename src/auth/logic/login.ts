import type { KyInstance } from 'ky';
import { createGreenApiClient } from '../api/client';
import { ensureAuthorized } from '../api/instance';
import type { Credentials } from './credentials';

/** The logged-in instance: the API client is built once and lives until logout. */
export interface Session {
  credentials: Credentials;
  api: KyInstance;
}

/** Builds the client and checks the instance is authorized; throws a user-facing message otherwise. */
export async function verifyCredentials(credentials: Credentials): Promise<Session> {
  const api = createGreenApiClient(credentials);
  await ensureAuthorized(api);
  return { credentials, api };
}
