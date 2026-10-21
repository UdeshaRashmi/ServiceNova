import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authApi, errorMessage } from '../services/api';
import type { User } from '../types';
import { toast } from 'sonner';

interface Auth {
  user: User | null;
  loading: boolean;
  error: string;
  retry: () => Promise<void>;
  login: typeof authApi.login;
  register: typeof authApi.register;
  logout: () => Promise<void>;
}
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  async function retry() {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const next = await authApi.me();
      if (current === generation.current) setUser(next);
    } catch (e) {
      if (current !== generation.current) return;
      setUser(null);
      if (!(
        e &&
        typeof e === 'object' &&
        'response' in e &&
        (e.response as { status?: number })?.status === 401
      ))
        setError(errorMessage(e));
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }
  useEffect(() => {
    void retry();
    const expire = () => {
      setUser(null);
      toast.error('Your session expired. Please sign in again.');
    };
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);
  const value: Auth = {
    user,
    loading,
    error,
    retry,
    login: async (values) => {
      generation.current++;
      setLoading(false);
      const next = await authApi.login(values);
      setUser(next);
      setError('');
      return next;
    },
    register: async (values) => {
      generation.current++;
      setLoading(false);
      const next = await authApi.register(values);
      setUser(next);
      setError('');
      return next;
    },
    logout: async () => {
      await authApi.logout();
      generation.current++;
      setUser(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return value;
}
