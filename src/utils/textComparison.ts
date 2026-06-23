import type { WordDiff, ComparisonResult } from '../types/dictation';

function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, '') // Remove punctuation except apostrophes
    .split(/\s+/)
    .filter(word => word.length > 0);
}

export function compareTexts(
  userInput: string,
  correctText: string
): ComparisonResult {
  const userWords = normalizeText(userInput);
  const correctWords = normalizeText(correctText);

  const diffs: WordDiff[] = [];
  let correctCount = 0;

  // Use simple word-by-word comparison with LCS-like alignment
  const lcs = longestCommonSubsequence(userWords, correctWords);

  let userIdx = 0;
  let correctIdx = 0;
  let lcsIdx = 0;

  while (userIdx < userWords.length || correctIdx < correctWords.length) {
    const userWord = userWords[userIdx];
    const correctWord = correctWords[correctIdx];
    const lcsWord = lcs[lcsIdx];

    if (userWord === lcsWord && correctWord === lcsWord) {
      // Match
      diffs.push({ word: correctWord, status: 'correct' });
      correctCount++;
      userIdx++;
      correctIdx++;
      lcsIdx++;
    } else if (correctWord !== lcsWord && correctIdx < correctWords.length) {
      // Missing word in user input
      diffs.push({ word: correctWord, status: 'missing' });
      correctIdx++;
    } else if (userWord !== lcsWord && userIdx < userWords.length) {
      // Extra word in user input
      diffs.push({ word: userWord, status: 'extra' });
      userIdx++;
    } else if (userIdx < userWords.length && correctIdx < correctWords.length) {
      // Wrong word
      diffs.push({
        word: userWord,
        status: 'wrong',
        correction: correctWord
      });
      userIdx++;
      correctIdx++;
    } else if (correctIdx < correctWords.length) {
      // Remaining correct words are missing
      diffs.push({ word: correctWord, status: 'missing' });
      correctIdx++;
    } else if (userIdx < userWords.length) {
      // Remaining user words are extra
      diffs.push({ word: userWord, status: 'extra' });
      userIdx++;
    }
  }

  const totalWords = correctWords.length;
  const score = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

  return {
    diffs,
    score,
    correctCount,
    totalWords,
  };
}

function longestCommonSubsequence(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // DP table
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
