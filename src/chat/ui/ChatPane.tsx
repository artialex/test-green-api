import { Alert, Center, Text } from '@mantine/core';
import { selectActiveChat, useChatsStore } from '../state/chatsStore';
import { ChatView } from './ChatView';

/** The main area: receive errors on top, then the selected chat (or a hint when there is none). */
export function ChatPane() {
  const activeChat = useChatsStore(selectActiveChat);
  const receiveError = useChatsStore((s) => s.receiveError);

  return (
    <>
      {receiveError && (
        <Alert color="orange" radius={0} py={6}>
          Receiving paused, retrying: {receiveError}
        </Alert>
      )}
      {activeChat ? (
        <ChatView key={activeChat.chatId} chat={activeChat} />
      ) : (
        <Center flex={1}>
          <Text c="dimmed">Enter a receiver's phone number to start a chat</Text>
        </Center>
      )}
    </>
  );
}
