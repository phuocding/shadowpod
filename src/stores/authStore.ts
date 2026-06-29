// Auth store - manages authentication state
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMe, setToken, clearToken, isLoggedIn, type UserInfo, type UserQuota } from '../services/api';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; email: string } | null;
  quota: UserQuota | null;
  isLoading: boolean;

  // Actions
  login: (token: string, user: { id: number; email: string }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setQuota: (quota: UserQuota) => void;
  mockSubscription: (active: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: isLoggedIn(),
      user: null,
      quota: null,
      isLoading: false,

      login: (token: string, user: { id: number; email: string }) => {
        setToken(token);
        set({ isAuthenticated: true, user });
        // Fetch full user info including quota
        get().refreshUser();
      },

      logout: () => {
        clearToken();
        set({ isAuthenticated: false, user: null, quota: null });
      },

      refreshUser: async () => {
        if (!isLoggedIn()) {
          set({ isAuthenticated: false, user: null, quota: null });
          return;
        }

        set({ isLoading: true });
        try {
          const data: UserInfo = await getMe();
          set({
            isAuthenticated: true,
            user: data.user,
            quota: data.quota,
            isLoading: false,
          });
        } catch (error) {
          console.error('[Auth] Failed to refresh user:', error);
          // Token might be invalid, clear it
          clearToken();
          set({ isAuthenticated: false, user: null, quota: null, isLoading: false });
        }
      },

      setQuota: (quota: UserQuota) => {
        set({ quota });
      },

      // DEV ONLY: Mock subscription for testing
      mockSubscription: (active: boolean) => {
        if (active) {
          set({
            quota: {
              minutesUsed: 15.5,
              minutesQuota: 60,
              minutesRemaining: 44.5,
              hasActiveSubscription: true,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
          });
        } else {
          set({
            quota: {
              minutesUsed: 0,
              minutesQuota: 0,
              minutesRemaining: 0,
              hasActiveSubscription: false,
              expiresAt: null,
            },
          });
        }
      },
    }),
    {
      name: 'shadowpod-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state: AuthState | undefined) => {
        if (state?.isAuthenticated) {
          state.refreshUser();
        }
      },
    }
  )
);
