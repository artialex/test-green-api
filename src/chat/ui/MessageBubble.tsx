import { Group, Paper, Text } from '@mantine/core';
import type { ChatMessage, MessageStatus } from '../logic/chats';

const formatTime = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const STATUS_SUFFIX: Record<MessageStatus, string> = {
  sending: ' · sending…',
  sent: '',
  failed: ' · failed',
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  const out = message.direction === 'out';
  return (
    <Group justify={out ? 'flex-end' : 'flex-start'}>
      <Paper
        px="sm"
        py={6}
        radius="md"
        maw="75%"
        bg={out ? 'blue.6' : 'gray.1'}
        c={out ? 'white' : 'black'}
        opacity={message.status === 'sending' ? 0.7 : 1}
      >
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.text}
        </Text>
        <Text size="xs" ta="right" c={message.status === 'failed' ? 'red.2' : undefined} opacity={0.75}>
          {formatTime(message.timestamp)}
          {STATUS_SUFFIX[message.status]}
        </Text>
      </Paper>
    </Group>
  );
}
