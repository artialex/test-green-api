import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { errorMessage } from '../../toolbelt/errors';
import { createGreenApiClient } from '../api/client';
import { credentialsSchema, type Credentials } from '../logic/credentials';
import { verifyCredentials, type Session } from '../logic/login';

type LoginStatus = { kind: 'idle' } | { kind: 'checking' } | { kind: 'error'; message: string };

interface AuthState {
  session: Session | null;
  status: LoginStatus;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      status: { kind: 'idle' },

      async login(credentials) {
        set({ status: { kind: 'checking' } });
        try {
          const session = await verifyCredentials(credentials);
          set({ session, status: { kind: 'idle' } });
        } catch (e) {
          set({ status: { kind: 'error', message: errorMessage(e) } });
        }
      },

      logout() {
        set({ session: null });
      },
    }),
    {
      name: 'green-api:auth',
      // Only the credentials are stored; the client is rebuilt from them on reload.
      partialize: (s) => ({ credentials: s.session?.credentials ?? null }),
      merge: (persisted, current) => {
        // Stored data is outside input: drop it unless it still matches the schema.
        const credentials = credentialsSchema.safeParse(
          (persisted as { credentials?: unknown } | undefined)?.credentials,
        ).data;
        return {
          ...current,
          session: credentials ? { credentials, api: createGreenApiClient(credentials) } : null,
        };
      },
    },
  ),
);
