import type { Segment } from './index';

export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface FeaturedAudio {
  id: string;
  title: string;
  description: string;
  level: Level;
  levelLabel: string; // "A1-A2", "B1-B2", "C1-C2"
  duration: number; // seconds
  episodeCount?: number;
  audioUrl: string; // path in public/
  transcript: Segment[];
  gradient: string; // Tailwind gradient classes
  isFeatured: true; // marker to distinguish from user content
}

export interface OnboardingState {
  hasSeenWelcome: boolean;
  sampleSessionsCompleted: number;
  hasSeenUploadPrompt: boolean;
}
