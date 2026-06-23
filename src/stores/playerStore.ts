import { create } from 'zustand';
import type { AudioRecord, Segment } from '../types';
import { audioEngine } from '../services/audioEngine';
import { getAudio, getAllAudio, toggleFavorite } from '../services/storage';

interface PlayerStore {
  // Current audio
  currentAudio: AudioRecord | null;
  isPlaying: boolean;
  currentTime: number;
  currentSegmentIndex: number;

  // UI state
  pendingSheetOpen: boolean;

  // Actions
  loadAndPlay: (id: string, autoPlay?: boolean) => Promise<void>;
  setPendingSheetOpen: (value: boolean) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekToSegment: (segment: Segment) => void;
  prevSegment: () => void;
  nextSegment: () => void;
  prevTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  setCurrentTime: (time: number) => void;
  setCurrentSegmentIndex: (index: number) => void;
  toggleCurrentFavorite: () => Promise<void>;
  restoreState: (audio: AudioRecord, isPlaying: boolean, currentTime: number, currentSegmentIndex: number) => void;
  clearState: () => void;
  stop: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentAudio: null,
  isPlaying: false,
  currentTime: 0,
  currentSegmentIndex: 0,
  pendingSheetOpen: false,

  setPendingSheetOpen: (value: boolean) => set({ pendingSheetOpen: value }),

  loadAndPlay: async (id: string, autoPlay: boolean = true) => {
    const current = get().currentAudio;

    // If same audio: resume if paused, otherwise do nothing (let UI open sheet)
    if (current?.id === id) {
      if (!get().isPlaying && autoPlay) {
        get().play();
      }
      return;
    }

    // Load new audio
    const audio = await getAudio(id);
    if (!audio) return;

    await audioEngine.load(audio.blob);

    // Setup time update listener
    audioEngine.setOnTimeUpdate((time) => {
      set({ currentTime: time });

      const { currentAudio } = get();
      if (currentAudio?.transcript) {
        const index = currentAudio.transcript.findIndex(
          (seg) => time >= seg.startTime && time < seg.endTime
        );
        if (index !== -1) {
          set({ currentSegmentIndex: index });
        }
      }
    });

    audioEngine.setOnEnded(() => {
      set({ isPlaying: false });
      // Auto-play next track
      get().nextTrack();
    });

    set({ currentAudio: audio, currentTime: 0, currentSegmentIndex: 0 });

    if (autoPlay) {
      audioEngine.play();
      set({ isPlaying: true });
    }
  },

  play: () => {
    audioEngine.play();
    set({ isPlaying: true });
  },

  pause: () => {
    audioEngine.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  seekToSegment: (segment: Segment) => {
    audioEngine.seek(segment.startTime);
    set({ currentTime: segment.startTime });
  },

  prevSegment: () => {
    const { currentAudio, currentSegmentIndex } = get();
    if (!currentAudio?.transcript || currentSegmentIndex <= 0) return;

    const prev = currentAudio.transcript[currentSegmentIndex - 1];
    audioEngine.seek(prev.startTime);
  },

  nextSegment: () => {
    const { currentAudio, currentSegmentIndex } = get();
    if (!currentAudio?.transcript || currentSegmentIndex >= currentAudio.transcript.length - 1) return;

    const next = currentAudio.transcript[currentSegmentIndex + 1];
    audioEngine.seek(next.startTime);
  },

  prevTrack: async () => {
    const { currentAudio, loadAndPlay } = get();
    if (!currentAudio) return;

    const allAudio = await getAllAudio();
    const currentIndex = allAudio.findIndex((a) => a.id === currentAudio.id);

    if (currentIndex > 0) {
      const prevAudio = allAudio[currentIndex - 1];
      await loadAndPlay(prevAudio.id);
    }
  },

  nextTrack: async () => {
    const { currentAudio, loadAndPlay } = get();
    if (!currentAudio) return;

    const allAudio = await getAllAudio();
    const currentIndex = allAudio.findIndex((a) => a.id === currentAudio.id);

    if (currentIndex < allAudio.length - 1) {
      const nextAudio = allAudio[currentIndex + 1];
      await loadAndPlay(nextAudio.id);
    }
  },

  setCurrentTime: (time: number) => set({ currentTime: time }),
  setCurrentSegmentIndex: (index: number) => set({ currentSegmentIndex: index }),

  toggleCurrentFavorite: async () => {
    const { currentAudio } = get();
    if (!currentAudio) return;
    const newValue = await toggleFavorite(currentAudio.id);
    set({ currentAudio: { ...currentAudio, isFavorite: newValue } });
  },

  restoreState: (audio: AudioRecord, isPlaying: boolean, currentTime: number, currentSegmentIndex: number) => {
    // Restore state from PlayerView back to playerStore (for MiniPlayer to show)
    set({ currentAudio: audio, isPlaying, currentTime, currentSegmentIndex });

    // Re-setup listeners to update playerStore state
    audioEngine.setOnTimeUpdate((time) => {
      set({ currentTime: time });

      const { currentAudio } = get();
      if (currentAudio?.transcript) {
        const index = currentAudio.transcript.findIndex(
          (seg) => time >= seg.startTime && time < seg.endTime
        );
        if (index !== -1) {
          set({ currentSegmentIndex: index });
        }
      }
    });

    audioEngine.setOnEnded(() => {
      set({ isPlaying: false });
      // Auto-play next track
      get().nextTrack();
    });
  },

  clearState: () => {
    // Clear state only, don't destroy audio (for seamless transition to PlayerView)
    set({ currentAudio: null, isPlaying: false, currentTime: 0, currentSegmentIndex: 0 });
  },

  stop: () => {
    audioEngine.destroy();
    set({ currentAudio: null, isPlaying: false, currentTime: 0, currentSegmentIndex: 0 });
  },
}));
