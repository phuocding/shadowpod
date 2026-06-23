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

  const isThisAudio = currentAudio?.id === audio.id;
  const isCurrentlyPlaying = isThisAudio && isPlaying;

  return (
    <div className="relative group">
      <div
        onClick={async () => {
          await loadAndPlay(audio.id);
          onOpenSheet();
        }}
        className="flex items-center bg-[var(--color-surface-container-low)] rounded-lg p-4 border border-white/5 hover:bg-[var(--color-surface-container)] transition-colors cursor-pointer"
      >
        {/* Waveform thumbnail */}
        <div className="w-16 h-16 bg-[var(--color-surface-container)] rounded-lg flex items-center justify-center mr-4">
          <Icon name="bar_chart" size={32} className="text-[var(--color-primary)]" />
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

        {/* Play button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isThisAudio) {
              toggle();
            } else {
              loadAndPlay(audio.id);
            }
          }}
          className="ml-4 text-[var(--color-text-base)] hover:text-[var(--color-primary)] transition-colors"
        >
          <Icon name={isCurrentlyPlaying ? 'pause' : 'play_arrow'} filled size={28} />
        </button>

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(audio.id);
          }}
          className={`ml-3 transition-colors ${audio.isFavorite ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]'}`}
        >
          <Icon name="favorite" filled={audio.isFavorite} size={24} />
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(audio.id);
          }}
          className="ml-2 text-[var(--color-negative)] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
        >
          <Icon name="delete" size={24} />
        </button>
      </div>
    </div>
  );
}
