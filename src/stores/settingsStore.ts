import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, PlaybackSpeed, LoopMode } from '../types';

interface SettingsState extends AppSettings {
  setApiKey: (key: string | undefined) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setLoopMode: (mode: LoopMode) => void;
  clearApiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      deepgramApiKey: undefined,
      playbackSpeed: 'default',
      loopMode: 'none',

      // Actions
      setApiKey: (key) => set({ deepgramApiKey: key }),
      clearApiKey: () => set({ deepgramApiKey: undefined }),
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      setLoopMode: (mode) => set({ loopMode: mode }),
    }),
    {
      name: 'shadowpod-settings',
    }
  )
);
