import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  token: string | null;
  user: User | null;
  set: (token: string, user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      set: (token, user) => set({ token, user }),
      clear: () => set({ token: null, user: null }),
    }),
    { name: 'tradedesk-auth' }
  )
);
