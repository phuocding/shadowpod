import { useLocation } from 'react-router-dom';
import { Icon } from './ui/Icon';
import { usePlayerStore } from '../stores/playerStore';
import { formatTime } from '../utils/formatTime';

interface MiniPlayerProps {
  onOpenSheet: () => void;
}

export function MiniPlayer({ onOpenSheet }: MiniPlayerProps) {
  const location = useLocation();
  const { currentAudio, isPlaying, currentTime, toggle, prevTrack, nextTrack, toggleCurrentFavorite, stop } = usePlayerStore();

  // Hide MiniPlayer on PlayerView route
  const isOnPlayerRoute = location.pathname.startsWith('/play/');
  if (!currentAudio || isOnPlayerRoute) return null;

  const progress = currentAudio.duration ? (currentTime / currentAudio.duration) * 100 : 0;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40">
      <div
        onClick={onOpenSheet}
        className="relative overflow-hidden bg-[var(--color-surface-container-low)]/95 backdrop-blur-md border border-[var(--color-primary)]/20 rounded-lg cursor-pointer"
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-surface-container)]">
          <div
            className="h-full bg-[var(--color-primary)] transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3 p-2">
          {/* Waveform icon */}
          <div className="w-12 h-12 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center shrink-0">
            <Icon name="bar_chart" size={24} className="text-[var(--color-primary)]" />
          </div>

          {/* Title & time */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="overflow-hidden">
              <div className="animate-marquee inline-flex whitespace-nowrap">
                <span className="font-semibold text-[var(--color-text-base)] text-sm pr-8">
                  {currentAudio.name}
                </span>
                <span className="font-semibold text-[var(--color-text-base)] text-sm pr-8">
                  {currentAudio.name}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)]">
              {formatTime(currentTime)} / {formatTime(currentAudio.duration)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => toggleCurrentFavorite()}
              className={`p-2 transition-colors ${currentAudio.isFavorite ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-base)]'}`}
            >
              <Icon name="favorite" filled={currentAudio.isFavorite} size={20} />
            </button>
            <button
              onClick={() => prevTrack()}
              className="p-2 text-[var(--color-text-base)] transition-colors"
            >
              <Icon name="skip_previous" size={24} />
            </button>
            <button
              onClick={toggle}
              className="p-1 text-[var(--color-primary)]"
            >
              <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled size={32} />
            </button>
            <button
              onClick={() => nextTrack()}
              className="p-2 text-[var(--color-text-base)] transition-colors"
            >
              <Icon name="skip_next" size={24} />
            </button>
            <button
              onClick={stop}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
              title="Close"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
