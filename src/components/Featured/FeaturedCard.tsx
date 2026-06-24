import type { FeaturedAudio } from '../../types/featured';
import { formatDuration } from '../../services/featuredContent';

interface FeaturedCardProps {
  audio: FeaturedAudio;
  onSelect: () => void;
}

export function FeaturedCard({ audio, onSelect }: FeaturedCardProps) {
  const levelColors = {
    beginner: 'bg-blue-500/20 text-blue-300',
    intermediate: 'bg-purple-500/20 text-purple-300',
    advanced: 'bg-orange-500/20 text-orange-300',
  };

  return (
    <button
      onClick={onSelect}
      className="flex-shrink-0 w-36 rounded-2xl overflow-hidden bg-[var(--color-surface-container)] transition-transform active:scale-95"
    >
      {/* Gradient Background */}
      <div className={`h-24 bg-gradient-to-br ${audio.gradient} relative`}>
        {/* Level Badge */}
        <span
          className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded-full ${levelColors[audio.level]}`}
        >
          {audio.levelLabel}
        </span>

        {/* FREE Badge */}
        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
          FREE
        </span>

        {/* Waveform Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v18M8 8v8M4 10v4M16 6v12M20 9v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 text-left">
        <h3 className="font-semibold text-sm text-[var(--color-text-base)] truncate">
          {audio.title}
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {formatDuration(audio.duration)}
          {audio.episodeCount && ` • ${audio.episodeCount} ep`}
        </p>
      </div>
    </button>
  );
}
