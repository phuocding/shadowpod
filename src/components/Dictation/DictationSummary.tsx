import { Icon } from '../ui/Icon';
import type { SegmentResult } from '../../types/dictation';

interface DictationSummaryProps {
  results: SegmentResult[];
  totalSegments: number;
  onRetry: () => void;
  onDone: () => void;
}

export function DictationSummary({ results, totalSegments, onRetry, onDone }: DictationSummaryProps) {
  const totalScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const perfect = results.filter(r => r.score === 100).length;
  const good = results.filter(r => r.score >= 70 && r.score < 100).length;
  const needsWork = results.filter(r => r.score < 70).length;

  // Calculate stroke-dashoffset for progress ring (circumference = 2 * PI * r = 2 * 3.14159 * 45 ≈ 283)
  const circumference = 283;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  const getScoreBadgeStyle = (score: number) => {
    if (score >= 90) return 'bg-[#10B981]/10 text-[#10B981]';
    if (score >= 70) return 'bg-[#FBBF24]/10 text-[#FBBF24]';
    return 'bg-[var(--color-negative)]/10 text-[var(--color-negative)]';
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Background Atmospheric Elements */}
      <div className="fixed top-1/4 -left-20 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -right-20 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Celebration Header */}
      <div className="flex flex-col items-center pt-4 pb-6">
        <div className="text-6xl mb-4 drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 15px rgba(123, 209, 250, 0.4))' }}>
          🎉
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text-base)] text-center">
          Practice Complete!
        </h2>
      </div>

      {/* Score Summary Card */}
      <div className="bg-[var(--color-surface-container-low)]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-4 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#10B981]/10 rounded-full blur-3xl" />

        <div className="flex flex-col items-center relative z-10">
          {/* Progress Ring */}
          <div className="relative flex items-center justify-center w-32 h-32 mb-4">
            <svg className="transform -rotate-90 w-full h-full">
              <circle
                className="text-[var(--color-surface-dark)]"
                cx="64"
                cy="64"
                r="45"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                className="text-[#10B981] transition-all duration-1000 ease-out"
                cx="64"
                cy="64"
                r="45"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-[#10B981]">{totalScore}%</span>
            </div>
          </div>

          {/* Progress & Time Stats */}
          <div className="flex gap-6 mb-6">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Progress</span>
              <span className="text-base font-semibold text-[var(--color-text-base)]">{results.length}/{totalSegments} segments</span>
            </div>
            <div className="w-px h-10 bg-white/10 self-center" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Accuracy</span>
              <span className="text-base font-semibold text-[var(--color-text-base)]">{totalScore}% avg</span>
            </div>
          </div>

          {/* Breakdown Dots */}
          <div className="w-full flex justify-between items-center px-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-[var(--color-text-muted)]">{perfect} Perfect</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FBBF24]" />
              <span className="text-[var(--color-text-muted)]">{good} Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-negative)]" />
              <span className="text-[var(--color-text-muted)]">{needsWork} Needs work</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <h3 className="text-base font-semibold text-[var(--color-text-base)] mb-2 px-1">
        Detailed Breakdown
      </h3>
      <div className="bg-[var(--color-surface-container-low)]/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden mb-6 flex-1">
        <div className="max-h-48 overflow-y-auto divide-y divide-white/5" style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
          {results.map((result, index) => (
            <div
              key={result.segmentIndex}
              className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col min-w-0 flex-1 mr-3">
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-primary)] mb-0.5">
                  Segment {index + 1}
                </span>
                <span className="text-sm text-[var(--color-text-base)] truncate">
                  {result.correctText.slice(0, 35)}...
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2 py-0.5 rounded text-sm font-bold ${getScoreBadgeStyle(result.score)}`}>
                  {result.score}%
                </span>
                <Icon
                  name="chevron_right"
                  size={20}
                  className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-base)] transition-colors"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <button
          onClick={onDone}
          className="w-full h-14 bg-[#10B981] text-white rounded-full font-semibold text-base active:scale-95 transition-transform flex items-center justify-center"
          style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}
        >
          Done
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onRetry}
            className="flex-1 h-12 border border-[#10B981]/50 text-[#10B981] rounded-full font-medium text-sm active:bg-[#10B981]/10 transition-colors"
          >
            Practice Again
          </button>
          <button
            className="flex-1 h-12 text-[var(--color-text-muted)] font-medium text-sm active:text-[var(--color-text-base)] transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="share" size={18} />
            Share Results
          </button>
        </div>
      </div>
    </div>
  );
}
