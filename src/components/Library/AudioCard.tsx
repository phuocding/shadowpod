import { useState, useRef, useEffect } from 'react';
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
  const { loadAndPlay } = usePlayerStore();
  const [offsetX, setOffsetX] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const startOffsetX = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSwiping = Math.abs(offsetX) > 5;

  // Animation logic for BottomSheet
  const openMenu = () => {
    setShowMenu(true);
    requestAnimationFrame(() => {
      setMenuVisible(true);
      setMenuAnimating(true);
    });
  };

  const closeMenu = () => {
    setMenuAnimating(false);
    setMenuVisible(false);
    setTimeout(() => setShowMenu(false), 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    startOffsetX.current = offsetX;
    isHorizontalSwipe.current = null;
  };

  // Use native event listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      if (isHorizontalSwipe.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }

      if (isHorizontalSwipe.current) {
        e.preventDefault();
        const newOffset = startOffsetX.current + deltaX;
        const clampedOffset = Math.max(-RIGHT_ACTION_WIDTH - 30, Math.min(LEFT_ACTION_WIDTH + 30, newOffset));
        setOffsetX(clampedOffset);
      }
    };

    card.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => card.removeEventListener('touchmove', handleTouchMove);
  }, [offsetX]);

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
    <div className="relative overflow-hidden rounded-lg group">
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
        ref={cardRef}
        className="relative bg-[var(--color-surface-container-low)] border border-white/5"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isHorizontalSwipe.current === null ? 'transform 0.2s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
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
          {/* Desktop hover actions */}
          <div className="hidden lg:flex items-center gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(audio.id);
              }}
              className={`p-2 rounded-full transition-colors ${
                audio.isFavorite
                  ? 'text-[#1ed760] hover:bg-[#1ed760]/20'
                  : 'text-[var(--color-text-muted)] hover:bg-white/10 hover:text-[var(--color-text-base)]'
              }`}
              title={audio.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Icon name="favorite" size={20} filled={audio.isFavorite} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(audio.id);
              }}
              className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Icon name="delete" size={20} />
            </button>
          </div>

          {/* Favorite indicator + 3-dot menu - HIDDEN when swiping */}
          <div
            className="flex items-center gap-1 lg:hidden"
            style={{
              opacity: isSwiping ? 0 : 1,
              visibility: isSwiping ? 'hidden' : 'visible',
              transition: 'opacity 0.1s ease',
            }}
          >
            {audio.isFavorite && (
              <Icon name="favorite" size={20} className="text-[#1ed760]" filled />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openMenu();
              }}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
            >
              <Icon name="more_horiz" size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Context Menu BottomSheet - Below nav bubbles */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40 flex items-end"
          onClick={closeMenu}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            style={{
              opacity: menuAnimating ? 1 : 0,
              transition: 'opacity 0.3s ease-out',
            }}
          />

          {/* Menu - Glassmorphism, sits below nav bubbles */}
          <div
            className="relative w-full rounded-t-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(25, 25, 25, 0.75)',
              backdropFilter: 'blur(25px)',
              WebkitBackdropFilter: 'blur(25px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '84px',
              transform: menuAnimating ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white truncate">{audio.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{formatTime(audio.duration)}</p>
            </div>

            {/* Actions */}
            <div className="py-2">
              <button
                onClick={() => { handleFavorite(); closeMenu(); }}
                className="w-full flex items-center gap-4 px-4 py-3 text-white hover:bg-white/10 transition-colors"
              >
                <Icon name={audio.isFavorite ? "heart_minus" : "favorite"} size={24} className={audio.isFavorite ? "text-[#1ed760]" : ""} />
                <span>{audio.isFavorite ? "Bỏ yêu thích" : "Yêu thích"}</span>
              </button>
              <button
                onClick={() => { handlePin(); closeMenu(); }}
                className="w-full flex items-center gap-4 px-4 py-3 text-white hover:bg-white/10 transition-colors"
              >
                <Icon name="keep" size={24} />
                <span>Ghim bài học</span>
              </button>
              <button
                onClick={() => { handleDelete(); closeMenu(); }}
                className="w-full flex items-center gap-4 px-4 py-3 text-[#ff453a] hover:bg-white/10 transition-colors"
              >
                <Icon name="delete" size={24} className="text-[#ff453a]" />
                <span>Xóa bài học</span>
              </button>
            </div>

            {/* Cancel */}
            <div className="border-t border-white/10">
              <button
                onClick={closeMenu}
                className="w-full py-4 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
