import { useState } from 'react';
import api from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { toast } from '@/hooks/useToast';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response: { data: { error: { message: string } } } }).response;
    return res?.data?.error?.message ?? 'An error occurred';
  }
  return 'Connection failed. Check your network.';
}

export function useAuth() {
  const { set, clear } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/v1/auth/login', { email, password });
      set(data.data.token, data.data.user);
      toast({ variant: 'success', title: `Welcome back, ${email}` });
      return true;
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response: { status: number } }).response.status;
        if (status === 429) {
          toast({ variant: 'warning', title: 'Too many requests. Please wait.' });
        } else {
          toast({ variant: 'destructive', title: 'Login failed', description: getErrorMessage(err) });
        }
      } else {
        toast({ variant: 'destructive', title: 'Connection failed. Check your network.' });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data } = await api.post('/api/v1/auth/register', { email, password });
      set(data.data.token, data.data.user);
      toast({ variant: 'success', title: 'Account created.' });
      return true;
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const status = (err as { response: { status: number } }).response.status;
        if (status === 409) {
          toast({ variant: 'destructive', title: 'Email already registered.' });
        } else if (status === 429) {
          toast({ variant: 'warning', title: 'Too many requests. Please wait.' });
        } else {
          toast({ variant: 'destructive', title: 'Registration failed', description: getErrorMessage(err) });
        }
      } else {
        toast({ variant: 'destructive', title: 'Connection failed. Check your network.' });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // best-effort
    } finally {
      clear();
    }
  };

  return { login, register, logout, loading };
}
