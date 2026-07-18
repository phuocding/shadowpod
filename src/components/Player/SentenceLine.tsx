import { Icon } from '../ui/Icon';
import type { Segment } from '../../types';

interface SentenceLineProps {
  segment: Segment;
  isActive: boolean;
  isLooping: boolean;
  isSelected?: boolean;
  isEditMode?: boolean;
  isMergeTarget?: boolean;
  isDimmed?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function SentenceLine({
  segment,
  isActive,
  isLooping,
  isSelected = false,
  isEditMode = false,
  isMergeTarget = false,
  isDimmed = false,
  onClick,
}: SentenceLineProps) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left px-4 py-3 rounded-xl transition-all duration-500 ${
        isDimmed
          ? 'opacity-30 pointer-events-none'
          : isSelected
          ? 'bg-[var(--color-primary)]/30 ring-2 ring-[var(--color-primary)]'
          : isMergeTarget
          ? 'bg-[var(--color-primary)]/20 ring-2 ring-[var(--color-primary)] animate-pulse'
          : isEditMode
          ? 'border-2 border-dashed border-[var(--color-border-light)] hover:border-[var(--color-primary)] hover:bg-white/5'
          : isActive
          ? 'scale-[1.02] origin-left'
          : 'opacity-25 hover:opacity-40'
      } ${isLooping && !isSelected && !isEditMode ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
    >
      {/* Merge target icon */}
      {isMergeTarget && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
          <Icon name="add" size={16} className="text-[var(--color-on-primary)]" />
        </div>
      )}
      <p
        className={`text-xl leading-[1.3] ${
          isActive
            ? 'text-white font-bold'
            : isSelected || isMergeTarget
            ? 'text-[var(--color-text-base)] font-semibold'
            : 'text-[var(--color-text-muted)]'
        }`}
        style={isActive ? { textShadow: '0 2px 4px rgba(0,0,0,0.3)' } : undefined}
      >
        {segment.text}
        {/* Inline loop icon for active looping segment */}
        {isActive && isLooping && (
          <Icon name="loop" size={18} className="text-[var(--color-primary)] ml-2 inline-block align-middle" />
        )}
      </p>
    </button>
  );
}
