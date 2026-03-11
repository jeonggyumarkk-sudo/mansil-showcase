import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    // Consider expired if less than 60s remaining
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
}

interface AuthState {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  signIn: (token: string) => void;
  signOut: () => void;
  initialize: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      isLoading: true,
      error: null,

      signIn: (token: string) => {
        set({ token, error: null });
      },

      signOut: () => {
        set({ token: null, error: null });
      },

      initialize: async () => {
        try {
          const { token } = get();
          if (token && isTokenExpired(token)) {
            set({ token: null });
          }
        } catch (e) {
          console.error('Auth initialization error:', e);
          set({ token: null });
        } finally {
          set({ isLoading: false });
        }
      },

      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error('Failed to rehydrate auth state:', error);
          }
        };
      },
    }
  )
);
