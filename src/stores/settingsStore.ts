import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, PlaybackSpeed, LoopMode } from '../types';

type Theme = 'dark' | 'light';

interface SettingsState extends AppSettings {
  theme: Theme;
  setApiKey: (key: string | undefined) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setLoopMode: (mode: LoopMode) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      deepgramApiKey: undefined,
      playbackSpeed: 'default',
      loopMode: 'none',
      theme: 'dark',

      // Actions
      setApiKey: (key) => set({ deepgramApiKey: key }),
      clearApiKey: () => set({ deepgramApiKey: undefined }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      setLoopMode: (mode) => set({ loopMode: mode }),
      setTheme: (theme) => {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: 'shadowpod-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          document.documentElement.classList.remove('dark', 'light');
          document.documentElement.classList.add(state.theme);
        }
      },
    }
  )
);
