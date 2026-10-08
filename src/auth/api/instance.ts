import type { KyInstance } from 'ky';

/** Login check: bad credentials fail with 401, an unusable instance (not linked, blocked, ...) fails here. */
export async function ensureAuthorized(api: KyInstance): Promise<void> {
  const { stateInstance } = await api.get('getStateInstance').json<{ stateInstance?: string }>();
  if (stateInstance !== 'authorized') {
    throw new Error(`Instance state is "${stateInstance}". Authorize the instance in the GREEN-API console first.`);
  }
}
