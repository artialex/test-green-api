import { Button } from '@mantine/core';
import { useAuthStore } from '../state/authStore';

export function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <Button variant="subtle" size="xs" onClick={logout}>
      Log out
    </Button>
  );
}
