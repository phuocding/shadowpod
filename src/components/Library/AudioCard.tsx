import { useState, useRef } from 'react';
import type { AudioRecord } from '../../types';
import { Icon } from '../ui/Icon';
import { formatTime, formatRelativeDate } from '../../utils/formatTime';
import { usePlayerStore } from '../../stores/playerStore';

interface AudioCardProps {
  audio: AudioRecord;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenSheet: () => void;
}

const ACTION_WIDTH = 160; // Width for 2 buttons (80px each)

export function AudioCard({ audio, onDelete, onToggleFavorite, onOpenSheet }: AudioCardProps) {
  const { loadAndPlay, toggle, currentAudio, isPlaying } = usePlayerStore();
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const startOffsetX = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const isThisAudio = currentAudio?.id === audio.id;
  const isCurrentlyPlaying = isThisAudio && isPlaying;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    startOffsetX.current = offsetX; // Remember current position
    isHorizontalSwipe.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      // Calculate new position from start position + delta
      const newOffset = startOffsetX.current + deltaX;
      // Clamp: can't go positive (right of origin), max left is -ACTION_WIDTH with rubber band
      const clampedOffset = Math.min(0, Math.max(-ACTION_WIDTH - 30, newOffset));
      setOffsetX(clampedOffset);
    }
  };

  const handleTouchEnd = () => {
    if (isHorizontalSwipe.current === null) return;

    const threshold = -50;
    if (offsetX < threshold) {
      // Snap to reveal actions
      setOffsetX(-ACTION_WIDTH);
    } else {
      // Snap back to origin
      setOffsetX(0);
    }
  };

  const resetSwipe = () => setOffsetX(0);

  const handlePin = () => {
    resetSwipe();
    onToggleFavorite(audio.id);
  };

  const handleDelete = () => {
    resetSwipe();
    onDelete(audio.id);
  };

  const isRevealed = offsetX <= -ACTION_WIDTH + 10;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons behind (right side) - Pin + Delete */}
      <div className="absolute inset-y-0 right-0 flex">
        <button onClick={handlePin} className="w-20 bg-[#1ed760] flex items-center justify-center">
          <Icon name={audio.isFavorite ? "keep_off" : "keep"} size={28} className="text-white" />
        </button>
        <button onClick={handleDelete} className="w-20 bg-red-500 flex items-center justify-center">
          <Icon name="delete" size={28} className="text-white" />
        </button>
      </div>

      {/* Slideable card content */}
      <div
        className="relative bg-[var(--color-surface-container-low)] border border-white/5"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isHorizontalSwipe.current === null ? 'transform 0.2s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (isRevealed) {
            resetSwipe();
          } else if (offsetX === 0) {
            loadAndPlay(audio.id);
            onOpenSheet();
          }
        }}
      >
        <div className="flex items-center p-4 cursor-pointer">
          <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center mr-4">
            <Icon name="graphic_eq" size={28} className="text-[var(--color-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--color-text-base)] truncate">{audio.name}</h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {formatTime(audio.duration)} • {formatRelativeDate(audio.createdAt)}
            </p>
          </div>
          {audio.isFavorite && <Icon name="keep" size={20} className="text-[#1ed760] mr-2" filled />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isRevealed) { resetSwipe(); return; }
              if (isThisAudio) toggle();
              else loadAndPlay(audio.id);
            }}
            className="text-[var(--color-text-base)] hover:text-[var(--color-primary)] transition-colors"
          >
            <Icon name={isCurrentlyPlaying ? 'pause' : 'play_arrow'} filled size={28} />
          </button>
        </div>
      </div>
    </div>
  );
}
