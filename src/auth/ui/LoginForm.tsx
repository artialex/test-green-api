import { Alert, Anchor, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { credentialsSchema } from '../logic/credentials';
import { useAuthStore } from '../state/authStore';

export function LoginForm() {
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { idInstance: '', apiTokenInstance: '' },
    validate: schemaResolver(credentialsSchema, { sync: true }),
    // Runs on submit after validation passed, so parse can't throw; submit gets trimmed credentials.
    transformValues: (values) => credentialsSchema.parse(values),
  });

  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="xl" radius="md" w={420} maw="100%">
        <form onSubmit={form.onSubmit(login)}>
          <Stack>
            <div>
              <Title order={3}>GREEN-API chat</Title>
              <Text size="sm" c="dimmed">
                Enter your instance credentials from{' '}
                <Anchor href="https://console.green-api.com" target="_blank">
                  console.green-api.com
                </Anchor>
              </Text>
            </div>
            <TextInput
              label="idInstance"
              withAsterisk
              key={form.key('idInstance')}
              {...form.getInputProps('idInstance')}
            />
            <PasswordInput
              label="apiTokenInstance"
              withAsterisk
              key={form.key('apiTokenInstance')}
              {...form.getInputProps('apiTokenInstance')}
            />
            {status.kind === 'error' && <Alert color="red">{status.message}</Alert>}
            <Button type="submit" loading={status.kind === 'checking'}>
              Log in
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
