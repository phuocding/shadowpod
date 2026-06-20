import { Icon } from '../ui/Icon';
import { formatTime } from '../../utils/formatTime';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
}

export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onSeek,
  onPrevSentence,
  onNextSentence,
}: PlaybackControlsProps) {
  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek(percent * duration);
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div
        onClick={handleProgressClick}
        className="h-1 bg-[var(--color-surface-container)] rounded-full cursor-pointer group"
      >
        <div
          className="h-full bg-[var(--color-primary)] rounded-full relative"
          style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--color-primary)] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={onPrevSentence}
          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
        >
          <Icon name="skip_previous" filled size={32} />
        </button>

        <button
          onClick={onPlayPause}
          className="w-16 h-16 bg-[var(--color-primary-container)] rounded-full flex items-center justify-center text-[var(--color-on-primary)] transition-transform active:scale-95"
        >
          <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled size={36} />
        </button>

        <button
          onClick={onNextSentence}
          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
        >
          <Icon name="skip_next" filled size={32} />
        </button>
      </div>
    </div>
  );
}
