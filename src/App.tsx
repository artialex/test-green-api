import { useEffect } from 'react';
import { AppShell, Burger, Group, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LoginForm, LogoutButton, useAuthStore, type Session } from './auth';
import { ChatList, ChatPane, startChatSession } from './chat';

export default function App() {
  const session = useAuthStore((s) => s.session);
  return session ? <Messenger session={session} /> : <LoginForm />;
}

/** The logged-in page: header with logout, chat list on the side, the chat in the middle. */
function Messenger({ session }: { session: Session }) {
  const { api } = session;
  const { idInstance } = session.credentials;
  const [navOpened, nav] = useDisclosure();

  useEffect(() => startChatSession(idInstance, api), [idInstance, api]);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 320, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={navOpened} onClick={nav.toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>GREEN-API chat</Title>
            <Text size="sm" c="dimmed" visibleFrom="xs">
              #{idInstance}
            </Text>
          </Group>
          <LogoutButton />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <ChatList onNavigate={nav.close} />
      </AppShell.Navbar>

      <AppShell.Main h="100dvh" style={{ display: 'flex', flexDirection: 'column' }}>
        <ChatPane />
      </AppShell.Main>
    </AppShell>
  );
}
