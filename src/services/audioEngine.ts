import type { PlaybackSpeed } from '../types';

type TimeUpdateCallback = (currentTime: number) => void;
type EndedCallback = () => void;

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private onTimeUpdate: TimeUpdateCallback | null = null;
  private onEnded: EndedCallback | null = null;
  private loopStart: number | null = null;
  private loopEnd: number | null = null;
  private currentBlobUrl: string | null = null;
  private loadId: number = 0;

  async load(blob: Blob): Promise<number> {
    // Validate blob
    if (!blob || blob.size === 0) {
      throw new Error('Invalid audio blob: empty or null');
    }

    // Increment loadId to cancel any in-progress load
    const currentLoadId = ++this.loadId;

    // Stop and cleanup existing audio first
    if (this.audio) {
      this.audio.pause();
      this.audio.onloadedmetadata = null;
      this.audio.onerror = null;
      this.audio.ontimeupdate = null;
      this.audio.onended = null;
      this.audio.src = '';
      this.audio = null;
    }

    // Revoke previous blob URL to prevent memory leaks
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }

    this.currentBlobUrl = URL.createObjectURL(blob);
    this.audio = new Audio(this.currentBlobUrl);

    return new Promise((resolve, reject) => {
      if (!this.audio) {
        return reject(new Error('Audio not initialized'));
      }

      const audio = this.audio;

      audio.onloadedmetadata = () => {
        // Ignore if this load was superseded by a newer one
        if (currentLoadId !== this.loadId) {
          console.log('AudioEngine: Load superseded, ignoring stale loadedmetadata');
          return;
        }
        resolve(audio.duration);
      };

      audio.onerror = (e) => {
        // Ignore if this load was superseded by a newer one
        if (currentLoadId !== this.loadId) {
          console.log('AudioEngine: Load superseded, ignoring stale error');
          return;
        }
        const mediaError = audio.error;
        const errorMsg = mediaError
          ? `Failed to load audio: ${mediaError.message} (code: ${mediaError.code})`
          : 'Failed to load audio: unknown error';
        console.error('AudioEngine error:', errorMsg, e);
        reject(new Error(errorMsg));
      };

      audio.ontimeupdate = () => {
        if (currentLoadId !== this.loadId) return;

        // Handle loop bounds
        if (this.loopEnd !== null && audio.currentTime >= this.loopEnd) {
          audio.currentTime = this.loopStart ?? 0;
        }

        this.onTimeUpdate?.(audio.currentTime);
      };

      audio.onended = () => {
        if (currentLoadId !== this.loadId) return;
        this.onEnded?.();
      };
    });
  }

  play(): void {
    if (this.audio) {
      // If audio has ended, seek to beginning first
      if (this.audio.ended) {
        this.audio.currentTime = 0;
      }
      this.audio.play();
    }
  }

  pause(): void {
    this.audio?.pause();
  }

  seek(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  setSpeed(speed: PlaybackSpeed): void {
    if (this.audio) {
      this.audio.playbackRate = speed === 'slow' ? 0.75 : 1.0;
    }
  }

  setLoop(start: number | null, end: number | null): void {
    this.loopStart = start;
    this.loopEnd = end;

    if (this.audio && start === null && end === null) {
      this.audio.loop = false;
    }
  }

  setLoopAll(enabled: boolean): void {
    if (this.audio) {
      this.audio.loop = enabled;
      if (enabled) {
        this.loopStart = null;
        this.loopEnd = null;
      }
    }
  }

  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  getDuration(): number {
    return this.audio?.duration ?? 0;
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  setOnTimeUpdate(callback: TimeUpdateCallback | null): void {
    this.onTimeUpdate = callback;
  }

  setOnEnded(callback: EndedCallback | null): void {
    this.onEnded = callback;
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.onTimeUpdate = null;
    this.onEnded = null;
    this.loopStart = null;
    this.loopEnd = null;
  }
}

export const audioEngine = new AudioEngine();
