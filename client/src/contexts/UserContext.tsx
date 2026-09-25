import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface UserSession {
  id: number;
  handle: string;
  displayName: string;
  email: string;
  role: 'member' | 'moderator';
  createdAt: string;
}

interface UserContextValue {
  user: UserSession | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null, loading: true, refresh: async () => {}, logout: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <UserContext.Provider value={{ user, loading, refresh, logout }}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
