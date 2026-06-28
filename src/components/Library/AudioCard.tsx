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

const LEFT_ACTION_WIDTH = 80;   // Favorite button width
const RIGHT_ACTION_WIDTH = 160; // Pin + Delete buttons width

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
    startOffsetX.current = offsetX;
    isHorizontalSwipe.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      const newOffset = startOffsetX.current + deltaX;
      // Clamp: max right is LEFT_ACTION_WIDTH, max left is -RIGHT_ACTION_WIDTH (with rubber band)
      const clampedOffset = Math.max(-RIGHT_ACTION_WIDTH - 30, Math.min(LEFT_ACTION_WIDTH + 30, newOffset));
      setOffsetX(clampedOffset);
    }
  };

  const handleTouchEnd = () => {
    if (isHorizontalSwipe.current === null) return;

    const threshold = 40;
    if (offsetX < -threshold) {
      // Snap to reveal right actions (Pin + Delete)
      setOffsetX(-RIGHT_ACTION_WIDTH);
    } else if (offsetX > threshold) {
      // Snap to reveal left action (Favorite)
      setOffsetX(LEFT_ACTION_WIDTH);
    } else {
      // Snap back to origin
      setOffsetX(0);
    }
  };

  const resetSwipe = () => setOffsetX(0);

  const handleFavorite = () => {
    resetSwipe();
    onToggleFavorite(audio.id);
  };

  const handlePin = () => {
    resetSwipe();
    onToggleFavorite(audio.id);
  };

  const handleDelete = () => {
    resetSwipe();
    onDelete(audio.id);
  };

  const isRevealed = Math.abs(offsetX) > 30;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left action - Favorite */}
      <div className="absolute inset-y-0 left-0 w-20 bg-[#1ed760] flex items-center justify-center">
        <button onClick={handleFavorite} className="w-full h-full flex items-center justify-center">
          <Icon name={audio.isFavorite ? "heart_minus" : "favorite"} size={28} className="text-white" filled />
        </button>
      </div>

      {/* Right actions - Pin + Delete */}
      <div className="absolute inset-y-0 right-0 flex">
        <button onClick={handlePin} className="w-20 bg-amber-500 flex items-center justify-center">
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
        onClick={async () => {
          if (isRevealed) resetSwipe();
          else if (offsetX === 0) {
            await loadAndPlay(audio.id);
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
          {audio.isFavorite && <Icon name="favorite" size={20} className="text-[#1ed760] mr-2" filled />}
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
