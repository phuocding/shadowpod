// Audio record stored in IndexedDB
export interface AudioRecord {
  id: string;
  name: string;
  blob: Blob;
  transcript: Segment[];
  originalTranscript?: Segment[];  // For restore functionality
  duration: number;
  createdAt: Date;
  lastPlayedAt?: Date;
  isFavorite?: boolean;
  // Featured audio properties
  isFeatured?: boolean;
  audioUrl?: string;
}

// Transcript segment (sentence level)
export interface Segment {
  id: number;
  text: string;
  startTime: number;
  endTime: number;
  words: Word[];
}

// Word with timestamp
export interface Word {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

// App settings stored in localStorage
export interface AppSettings {
  deepgramApiKey?: string;
  playbackSpeed: PlaybackSpeed;
  loopMode: LoopMode;
}

export type PlaybackSpeed = 'slow' | 'default';
export type LoopMode = 'none' | 'all' | 'sentence';

// Error codes for user-friendly messages
export type ErrorCode =
  | 'INVALID_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'INVALID_API_KEY'
  | 'QUOTA_EXCEEDED'
  | 'NETWORK_ERROR'
  | 'TRANSCRIBE_FAILED'
  | 'STORAGE_FULL';

// Deepgram API response types
export interface DeepgramResponse {
  results: {
    channels: DeepgramChannel[];
    utterances?: DeepgramUtterance[];
  };
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

export interface DeepgramUtterance {
  transcript: string;
  start: number;
  end: number;
  confidence: number;
  words: DeepgramWord[];
}

// Player state
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentSegmentIndex: number;
  loopMode: LoopMode;
  playbackSpeed: PlaybackSpeed;
  loopSegmentId?: number;
}

// Upload state
export interface UploadState {
  file: File | null;
  isTranscribing: boolean;
  error: ErrorCode | null;
  progress: number;
}
