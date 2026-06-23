export type WordStatus = 'correct' | 'wrong' | 'missing' | 'extra';

export interface WordDiff {
  word: string;
  status: WordStatus;
  correction?: string;
}

export interface ComparisonResult {
  diffs: WordDiff[];
  score: number;
  correctCount: number;
  totalWords: number;
}

export interface SegmentResult {
  segmentIndex: number;
  userInput: string;
  correctText: string;
  score: number;
  wordCount: number;
  correctCount: number;
  diffs: WordDiff[];
}

export type DictationStep = 'input' | 'result' | 'summary';
