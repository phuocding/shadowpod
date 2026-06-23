import { useState } from 'react';
import { Icon } from '../ui/Icon';
import type { WordDiff as WordDiffType } from '../../types/dictation';

interface DictationResultProps {
  diffs: WordDiffType[];
  score: number;
  correctCount: number;
  totalWords: number;
  correctText: string;
  onRetry: () => void;
  onNext: () => void;
  isLastSegment: boolean;
}

function ResultWordDiff({ diff }: { diff: WordDiffType }) {
  const { word, status, correction } = diff;

  switch (status) {
    case 'correct':
      return <span className="text-white">{word}</span>;

    case 'wrong':
      return (
        <>
          <span className="bg-[#EF4444] text-white line-through px-1 rounded-sm decoration-2">
            {word}
          </span>
          {correction && (
            <span className="text-[#10B981] underline underline-offset-4 decoration-2 font-bold">
              {correction}
            </span>
          )}
        </>
      );

    case 'missing':
      return (
        <span className="text-[#10B981] underline underline-offset-4 decoration-2 font-bold">
          {word}
        </span>
      );

    case 'extra':
      return (
        <span className="bg-[#EF4444] text-white line-through px-1 rounded-sm decoration-2">
          {word}
        </span>
      );

    default:
      return <span>{word}</span>;
  }
}

export function DictationResult({
  diffs,
  score,
  correctCount,
  totalWords,
  correctText,
  onRetry,
  onNext,
  isLastSegment,
}: DictationResultProps) {
  const [copied, setCopied] = useState(false);

  const getScoreBadgeStyle = () => {
    if (score >= 70) return 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30';
    if (score >= 50) return 'bg-[#FBBF24]/20 text-[#FBBF24] border-[#FBBF24]/30';
    return 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(correctText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Result Comparison Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[var(--color-text-base)]">Your answer</h2>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getScoreBadgeStyle()}`}>
          {correctCount}/{totalWords} Correct
        </div>
      </div>

      {/* Diff Box */}
      <div className="bg-[rgba(15,23,42,0.6)] backdrop-blur-xl border border-white/10 p-6 rounded-xl">
        <div className="text-lg leading-relaxed flex flex-wrap gap-x-2 gap-y-3">
          {diffs.map((diff, index) => (
            <ResultWordDiff key={index} diff={diff} />
          ))}
        </div>
      </div>

      {/* Correct Transcript */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Correct Transcript
        </span>
        <div className="bg-[#1E293B] p-4 rounded-lg relative group">
          <p className="text-[var(--color-text-muted)] text-sm pr-10">
            {correctText}
          </p>
          <button
            onClick={handleCopy}
            className={`absolute top-4 right-4 transition-colors ${copied ? 'text-[#10B981]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'}`}
          >
            <Icon name={copied ? 'check' : 'content_copy'} size={20} />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={onRetry}
          className="w-full py-4 border-2 border-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-xl font-semibold hover:bg-[var(--color-primary)]/5 active:scale-95 transition-all"
        >
          Try Again
        </button>
        <button
          onClick={onNext}
          className="w-full py-4 bg-[#10B981] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{ boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)' }}
        >
          {isLastSegment ? 'See Results' : 'Next Segment'}
          <Icon name="arrow_forward" size={20} />
        </button>
      </div>
    </div>
  );
}
