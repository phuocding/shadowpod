import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingStore {
  hasSeenWelcome: boolean;
  sampleSessionsCompleted: number;
  hasSeenUploadPrompt: boolean;

  setWelcomeSeen: () => void;
  incrementSampleSessions: () => void;
  setUploadPromptSeen: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasSeenWelcome: false,
      sampleSessionsCompleted: 0,
      hasSeenUploadPrompt: false,

      setWelcomeSeen: () => set({ hasSeenWelcome: true }),

      incrementSampleSessions: () =>
        set((state) => ({
          sampleSessionsCompleted: state.sampleSessionsCompleted + 1,
        })),

      setUploadPromptSeen: () => set({ hasSeenUploadPrompt: true }),

      reset: () =>
        set({
          hasSeenWelcome: false,
          sampleSessionsCompleted: 0,
          hasSeenUploadPrompt: false,
        }),
    }),
    {
      name: 'shadowpod-onboarding',
    }
  )
);
