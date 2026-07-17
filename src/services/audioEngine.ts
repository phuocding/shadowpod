import { Howl } from 'howler';
import type { HowlOptions } from 'howler';
import type { PlaybackSpeed } from '../types';

type TimeUpdateCallback = (currentTime: number) => void;
type EndedCallback = () => void;

// Platform detection for mobile-specific handling
const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Convert MIME type to Howler format string
const mimeToFormat = (mimeType: string): string[] => {
  const map: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };
  const format = map[mimeType.toLowerCase()];
  return format ? [format] : ['mp3', 'm4a', 'wav', 'webm', 'ogg'];
};

class AudioEngine {
  private howl: Howl | null = null;
  private onTimeUpdate: TimeUpdateCallback | null = null;
  private onEnded: EndedCallback | null = null;
  private loopStart: number | null = null;
  private loopEnd: number | null = null;
  private currentBlobUrl: string | null = null;
  private loadId: number = 0;
  private timeUpdateInterval: number | null = null;
  private loopCheckInterval: number | null = null;
  private currentSpeed: number = 1.0;

  private static readonly TIME_UPDATE_INTERVAL_MS = 50;
  private static readonly LOOP_CHECK_INTERVAL_MS = 30;
  private static readonly LOOP_BUFFER_MS = 0.1; // 100ms buffer

  async load(blob: Blob): Promise<number> {
    if (!blob || blob.size === 0) {
      throw new Error('Invalid audio blob: empty or null');
    }

    const currentLoadId = ++this.loadId;

    // Cleanup existing audio
    this.cleanup();

    // Create blob URL
    this.currentBlobUrl = URL.createObjectURL(blob);

    // Get format from blob MIME type
    const format = mimeToFormat(blob.type);

    return this.loadAudio(this.currentBlobUrl, currentLoadId, format);
  }

  async loadFromUrl(url: string): Promise<number> {
    const currentLoadId = ++this.loadId;

    // Cleanup existing audio
    this.cleanup();

    return this.loadAudio(url, currentLoadId);
  }

  private loadAudio(src: string, currentLoadId: number, format?: string[]): Promise<number> {
    return new Promise((resolve, reject) => {
      const howlConfig: HowlOptions = {
        src: [src],
        html5: true, // Use HTML5 Audio for better mobile compatibility with blob URLs
        preload: true,
        onload: () => {
          if (currentLoadId !== this.loadId) {
            console.log('AudioEngine: Load superseded, ignoring');
            return;
          }
          const duration = this.howl?.duration() ?? 0;
          this.startTimeUpdateInterval();
          resolve(duration);
        },
        onloaderror: (_id, error) => {
          if (currentLoadId !== this.loadId) {
            return;
          }
          console.error('AudioEngine Howler error:', error);
          reject(new Error(`Failed to load audio: ${error}`));
        },
        onend: () => {
          if (currentLoadId !== this.loadId) return;
          this.onEnded?.();
        },
        onplayerror: (_id, error) => {
          console.error('AudioEngine play error:', error);
          // Howler auto-unlocks on mobile, retry play
          if (this.howl) {
            this.howl.once('unlock', () => {
              this.howl?.play();
            });
          }
        },
      };

      // Add format if provided (needed for blob URLs without extension)
      if (format) {
        howlConfig.format = format;
      }

      this.howl = new Howl(howlConfig);
    });
  }

  private startTimeUpdateInterval(): void {
    this.stopTimeUpdateInterval();
    this.timeUpdateInterval = window.setInterval(() => {
      if (this.howl) {
        const currentTime = this.howl.seek() as number;
        const duration = this.howl.duration();

        if (this.howl.playing()) {
          this.onTimeUpdate?.(currentTime);
        }

        // Check if audio ended (backup for onend not firing)
        if (!this.howl.playing() && currentTime >= duration - 0.1 && duration > 0) {
          this.onEnded?.();
        }
      }
    }, AudioEngine.TIME_UPDATE_INTERVAL_MS);
  }

  private stopTimeUpdateInterval(): void {
    if (this.timeUpdateInterval !== null) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  play(): void {
    if (!this.howl) return;

    // If already playing, don't create new instance
    if (this.howl.playing()) return;

    // If audio has ended, seek to beginning first
    const duration = this.howl.duration();
    const currentTime = this.howl.seek() as number;
    if (currentTime >= duration - 0.1) {
      this.howl.seek(0);
    }

    this.howl.play();
  }

  pause(): void {
    this.howl?.pause();
  }

  seek(time: number): void {
    if (this.howl) {
      this.howl.seek(time);
      // Trigger immediate time update for UI sync
      this.onTimeUpdate?.(time);
    }
  }

  // Seek and play with mobile buffer delay
  seekAndPlay(time: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.howl) {
        resolve();
        return;
      }

      const currentTime = this.howl.seek() as number;

      // If already at target time, just play
      if (Math.abs(currentTime - time) < 0.1) {
        if (!this.howl.playing()) {
          this.howl.play();
        }
        resolve();
        return;
      }

      // Pause instead of stop (keeps sound alive for better seeking)
      this.howl.pause();

      // Seek to target time
      this.howl.seek(time);

      // Wait for mobile buffer before playing
      setTimeout(() => {
        if (this.howl && !this.howl.playing()) {
          this.howl.play();
        }
        resolve();
      }, isMobile() ? 150 : 20);
    });
  }

  isMobile(): boolean {
    return isMobile();
  }

  setSpeed(speed: PlaybackSpeed): void {
    this.currentSpeed = speed === 'slow' ? 0.75 : 1.0;
    if (this.howl) {
      this.howl.rate(this.currentSpeed);
    }
  }

  setLoop(start: number | null, end: number | null): void {
    this.loopStart = start;
    this.loopEnd = end;

    // Clear loop-all mode
    if (this.howl) {
      this.howl.loop(false);
    }

    this.stopLoopCheck();

    if (start !== null && end !== null) {
      this.startLoopCheck();
    }
  }

  setLoopAll(enabled: boolean): void {
    this.stopLoopCheck();
    this.loopStart = null;
    this.loopEnd = null;

    if (this.howl) {
      this.howl.loop(enabled);
    }
  }

  private startLoopCheck(): void {
    this.loopCheckInterval = window.setInterval(() => {
      if (!this.howl || this.loopEnd === null || this.loopStart === null) return;
      if (!this.howl.playing()) return;

      const currentTime = this.howl.seek() as number;
      const triggerPoint = this.loopEnd - AudioEngine.LOOP_BUFFER_MS;

      if (currentTime >= triggerPoint) {
        // Seek back to start - Howler handles this smoothly
        this.howl.seek(this.loopStart);
      }
    }, AudioEngine.LOOP_CHECK_INTERVAL_MS);
  }

  private stopLoopCheck(): void {
    if (this.loopCheckInterval !== null) {
      clearInterval(this.loopCheckInterval);
      this.loopCheckInterval = null;
    }
  }

  getCurrentTime(): number {
    if (!this.howl) return 0;
    const time = this.howl.seek();
    return typeof time === 'number' ? time : 0;
  }

  getDuration(): number {
    return this.howl?.duration() ?? 0;
  }

  isPlaying(): boolean {
    return this.howl?.playing() ?? false;
  }

  setOnTimeUpdate(callback: TimeUpdateCallback | null): void {
    this.onTimeUpdate = callback;
  }

  setOnEnded(callback: EndedCallback | null): void {
    this.onEnded = callback;
  }

  private cleanup(): void {
    this.stopTimeUpdateInterval();
    this.stopLoopCheck();

    if (this.howl) {
      this.howl.unload();
      this.howl = null;
    }

    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  destroy(): void {
    this.cleanup();
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.loopStart = null;
    this.loopEnd = null;
    this.currentSpeed = 1.0;
  }
}

export const audioEngine = new AudioEngine();
