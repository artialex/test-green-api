import ky, { isHTTPError, type BeforeErrorHook, type BeforeRequestHook, type KyInstance } from 'ky';
import type { Credentials } from '../logic/credentials';

const GREEN_API_URL = 'https://api.green-api.com';

/** ky instance for one GREEN-API instance; callers pass the bare method path, e.g. `api.post('sendMessage', …)`. */
export function createGreenApiClient({ idInstance, apiTokenInstance }: Credentials): KyInstance {
  const instancePath = `/waInstance${idInstance}/`;
  return ky.create({
    prefix: GREEN_API_URL + instancePath,
    hooks: {
      beforeRequest: [insertToken(instancePath, apiTokenInstance)],
      beforeError: [hideToken(apiTokenInstance)],
    },
  });
}

/**
 * GREEN-API wants the token right after the method name:
 * `.../sendMessage` -> `.../sendMessage/{token}`, `.../deleteNotification/42` -> `.../deleteNotification/{token}/42`.
 */
function insertToken(instancePath: string, token: string): BeforeRequestHook {
  return async ({ request }) => {
    const url = new URL(request.url);
    const [method, ...rest] = url.pathname.slice(instancePath.length).split('/');
    url.pathname = instancePath + [method, token, ...rest].join('/');
    // Pass the body as bytes: reusing `request` as init would turn it into a streaming upload.
    return new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body ? await request.arrayBuffer() : undefined,
      signal: request.signal,
    });
  };
}

/** Ky's default error message includes the URL, which contains the token. */
function hideToken(token: string): BeforeErrorHook {
  return ({ error }) => {
    if (isHTTPError(error)) {
      const detail = typeof error.data === 'string' ? error.data : JSON.stringify(error.data);
      error.message = `GREEN-API ${error.response.status}: ${detail || error.response.statusText}`;
    }
    error.message = error.message.replaceAll(token, '***');
    return error;
  };
}
