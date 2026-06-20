import { useRef, useCallback } from 'react';
import type { Segment } from '../../types';

interface SentenceLineProps {
  segment: Segment;
  isActive: boolean;
  isLooping: boolean;
  isSelected?: boolean;
  isEditMode?: boolean;
  onClick: () => void;
  onLongPress?: () => void;
}

export function SentenceLine({
  segment,
  isActive,
  isLooping,
  isSelected = false,
  isEditMode = false,
  onClick,
  onLongPress,
}: SentenceLineProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(() => {
    if (!onLongPress) return;
    longPressTimer.current = setTimeout(() => {
      onLongPress();
    }, 500);
  }, [onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (onLongPress) {
      e.preventDefault();
      onLongPress();
    }
  }, [onLongPress]);

  return (
    <button
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={handleContextMenu}
      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
        isSelected
          ? 'bg-[var(--color-primary)]/30 ring-2 ring-[var(--color-primary)]'
          : isActive
          ? 'bg-[var(--color-primary)]/20 text-[var(--color-text-base)] scale-[1.02]'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-silver)] hover:bg-white/5'
      } ${isLooping && !isSelected ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
    >
      <p className={`text-lg leading-relaxed ${isActive || isSelected ? 'font-semibold' : ''} ${isSelected ? 'text-[var(--color-text-base)]' : ''}`}>
        {segment.text}
      </p>
      {isEditMode && (
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Long-press to split
        </p>
      )}
    </button>
  );
}
