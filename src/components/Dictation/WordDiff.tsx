import type { WordDiff as WordDiffType } from '../../types/dictation';

interface WordDiffProps {
  diff: WordDiffType;
}

export function WordDiff({ diff }: WordDiffProps) {
  const { word, status, correction } = diff;

  switch (status) {
    case 'correct':
      return <span className="text-[var(--color-text-base)]">{word} </span>;

    case 'wrong':
      return (
        <span className="inline-flex items-center gap-1">
          <span className="bg-[var(--color-negative)]/20 text-[var(--color-negative)] line-through px-1 rounded">
            {word}
          </span>
          {correction && (
            <span className="text-[var(--color-success)]">{correction}</span>
          )}
          {' '}
        </span>
      );

    case 'missing':
      return (
        <span className="text-[var(--color-success)] underline underline-offset-2">
          {word}{' '}
        </span>
      );

    case 'extra':
      return (
        <span className="bg-[var(--color-negative)]/20 text-[var(--color-negative)] line-through px-1 rounded">
          {word}{' '}
        </span>
      );

    default:
      return <span>{word} </span>;
  }
}
