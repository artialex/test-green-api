# GREEN-API chat

A minimal chat UI (Vite + React + Mantine) that sends and receives messages
through [GREEN-API](https://green-api.com).

## Run

```sh
npm install
npm run dev
```

## Usage

1. Enter `idInstance` and `apiTokenInstance` from the GREEN-API console. The API
   host is fixed to `https://api.green-api.com` (`GREEN_API_URL` in
   `src/auth/api/client.ts`). The app checks `getStateInstance` and only lets
   you in when the instance is `authorized`.
2. Enter the receiver's phone number with country code (e.g. `79991234567`) and
   press `+`.
3. Write a message and press Enter.
4. Replies appear in the chat as they arrive. Receiving uses HTTP API polling,
   so the instance needs an empty `webhookUrl` and incoming notifications
   enabled. Polling starts once there is at least one chat.

Credentials and chat history are kept in `localStorage`, for simplicity.

## Structure

- `auth` - contains authorization logic and components, including creation of
  the API client
- `chat` - contains chat logic and components: how to send/receive messages.
  It doesn't import `auth`: `App.tsx` hands it the API client
- `toolbelt` - various helpers and utils that can be used across applications
