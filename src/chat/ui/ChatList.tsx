import { ActionIcon, NavLink, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { IconPlus } from '@tabler/icons-react';
import { newChatSchema } from '../logic/phone';
import { selectChats, useChatsStore } from '../state/chatsStore';

/** `onNavigate` fires after a chat is opened (used to close the mobile drawer). */
export function ChatList({ onNavigate }: { onNavigate: () => void }) {
  const chats = useChatsStore(selectChats);
  const activeChatId = useChatsStore((s) => s.activeChatId);
  const createChat = useChatsStore((s) => s.createChat);
  const selectChat = useChatsStore((s) => s.selectChat);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { phone: '' },
    validate: schemaResolver(newChatSchema, { sync: true }),
    // Runs on submit after validation passed, so parse can't throw; submit gets normalized digits.
    transformValues: (values) => newChatSchema.parse(values),
  });

  function create({ phone }: { phone: string }) {
    createChat(phone);
    onNavigate();
    form.reset();
  }

  return (
    <Stack h="100%" gap="sm">
      <form onSubmit={form.onSubmit(create)}>
        <TextInput
          placeholder="Receiver phone, e.g. 79991234567"
          key={form.key('phone')}
          {...form.getInputProps('phone')}
          rightSection={
            <ActionIcon type="submit" variant="filled" aria-label="Create chat">
              <IconPlus size={16} />
            </ActionIcon>
          }
        />
      </form>
      <ScrollArea flex={1}>
        {chats.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" mt="md">
            No chats yet
          </Text>
        )}
        {chats.map((chat) => (
          <NavLink
            key={chat.chatId}
            active={chat.chatId === activeChatId}
            label={chat.title}
            description={chat.messages.at(-1)?.text ?? 'No messages'}
            onClick={() => {
              selectChat(chat.chatId);
              onNavigate();
            }}
            styles={{
              description: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            }}
          />
        ))}
      </ScrollArea>
    </Stack>
  );
}
