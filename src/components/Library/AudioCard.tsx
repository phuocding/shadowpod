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

export function AudioCard({ audio, onDelete, onToggleFavorite, onOpenSheet }: AudioCardProps) {
  const { loadAndPlay, toggle, currentAudio, isPlaying } = usePlayerStore();
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiped, setIsSwiped] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const isThisAudio = currentAudio?.id === audio.id;
  const isCurrentlyPlaying = isThisAudio && isPlaying;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Determine swipe direction on first significant move
    if (!isHorizontalSwipe.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      // Limit swipe range
      const clampedX = Math.max(-80, Math.min(80, deltaX));
      setSwipeX(clampedX);
    }
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    if (swipeX < -threshold) {
      setIsSwiped('left');
      setSwipeX(-80);
    } else if (swipeX > threshold) {
      setIsSwiped('right');
      setSwipeX(80);
    } else {
      setIsSwiped(null);
      setSwipeX(0);
    }
  };

  const resetSwipe = () => {
    setIsSwiped(null);
    setSwipeX(0);
  };

  const handleDelete = () => {
    resetSwipe();
    onDelete(audio.id);
  };

  const handleFavorite = () => {
    resetSwipe();
    onToggleFavorite(audio.id);
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons behind */}
      <div className="absolute inset-y-0 left-0 w-20 bg-[#1ed760] flex items-center justify-center">
        <Icon name={audio.isFavorite ? "heart_minus" : "favorite"} size={28} className="text-white" filled />
      </div>
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
        <Icon name="delete" size={28} className="text-white" />
      </div>

      {/* Slideable card content */}
      <div
        className="relative bg-[var(--color-surface-container-low)] border border-white/5 transition-transform duration-200"
        style={{ transform: `translateX(${isSwiped ? (isSwiped === 'left' ? -80 : 80) : swipeX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (isSwiped === 'left') {
            handleDelete();
          } else if (isSwiped === 'right') {
            handleFavorite();
          } else if (swipeX === 0) {
            loadAndPlay(audio.id);
            onOpenSheet();
          }
        }}
      >
        <div className="flex items-center p-4 cursor-pointer">
          {/* Waveform thumbnail */}
          <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center mr-4">
            <Icon name="graphic_eq" size={28} className="text-[var(--color-primary)]" />
          </div>

          {/* Metadata */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[var(--color-text-base)] truncate">
              {audio.name}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {formatTime(audio.duration)} • {formatRelativeDate(audio.createdAt)}
            </p>
          </div>

          {/* Favorite indicator */}
          {audio.isFavorite && (
            <Icon name="favorite" size={20} className="text-[#1ed760] mr-2" filled />
          )}

          {/* Play/Pause button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isSwiped) {
                resetSwipe();
                return;
              }
              if (isThisAudio) {
                toggle();
              } else {
                loadAndPlay(audio.id);
              }
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
