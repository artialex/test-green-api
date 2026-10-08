import { useEffect, useRef, useState } from 'react';
import { ActionIcon, Box, Center, Group, ScrollArea, Stack, Text, Textarea, Title } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { MAX_MESSAGE_LENGTH, type Chat } from '../logic/chats';
import { useChatsStore } from '../state/chatsStore';
import { MessageBubble } from './MessageBubble';

export function ChatView({ chat }: { chat: Chat }) {
  const send = useChatsStore((s) => s.send);
  const [draft, setDraft] = useState('');
  const text = draft.trim();
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    viewport.current?.scrollTo({
      top: viewport.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chat.messages.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text) return;
    void send(chat.chatId, text);
    setDraft('');
  }

  return (
    <Stack h="100%" gap={0}>
      <Box
        px="md"
        py="sm"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Title order={5}>{chat.title}</Title>
        <Text size="xs" c="dimmed">
          {chat.chatId}
        </Text>
      </Box>
      <ScrollArea flex={1} viewportRef={viewport} px="md">
        {chat.messages.length === 0 ? (
          <Center h={200}>
            <Text c="dimmed" size="sm">
              Write the first message
            </Text>
          </Center>
        ) : (
          <Stack gap="xs" py="md">
            {chat.messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </Stack>
        )}
      </ScrollArea>
      <form onSubmit={submit}>
        <Group
          p="sm"
          gap="xs"
          align="flex-end"
          wrap="nowrap"
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <Textarea
            flex={1}
            autosize
            minRows={1}
            maxRows={5}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Message (Enter to send, Shift+Enter for new line)"
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <ActionIcon type="submit" size="lg" disabled={!text} aria-label="Send">
            <IconSend size={18} />
          </ActionIcon>
        </Group>
      </form>
    </Stack>
  );
}
