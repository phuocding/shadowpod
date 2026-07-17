import { useEffect, useRef } from 'react';
import { Icon } from '../ui/Icon';

interface FloatingMenuProps {
  position: { x: number; y: number; segmentHeight?: number };
  onSplit: () => void;
  onMerge: () => void;
  onClose: () => void;
}

export function FloatingMenu({ position, onSplit, onMerge, onClose }: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Show below segment if too close to top (less than 80px)
  const showBelow = position.y < 80;
  const topPosition = showBelow
    ? position.y + (position.segmentHeight || 50) + 12
    : position.y - 8;

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate close from the tap that opened the menu
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute z-50 animate-menu-appear"
      style={{
        left: position.x,
        top: topPosition,
        transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
    >
      <div className="flex items-center gap-1 bg-[var(--color-surface-dark)] rounded-xl p-1 shadow-lg border border-[var(--color-border-gray)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSplit();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <Icon name="content_cut" size={18} className="text-[var(--color-text-base)]" />
          <span className="text-sm text-[var(--color-text-base)]">Tách</span>
        </button>
        <div className="w-px h-6 bg-[var(--color-border-gray)]" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMerge();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <Icon name="link" size={18} className="text-[var(--color-text-base)]" />
          <span className="text-sm text-[var(--color-text-base)]">Gộp</span>
        </button>
      </div>
      {/* Arrow */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-[var(--color-surface-dark)] border-[var(--color-border-gray)] rotate-45 ${
          showBelow
            ? '-top-1.5 border-l border-t'
            : '-bottom-1.5 border-r border-b'
        }`}
      />
    </div>
  );
}
