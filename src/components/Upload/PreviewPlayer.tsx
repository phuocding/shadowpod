import { useState, useRef, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { formatTime } from '../../utils/formatTime';

interface PreviewPlayerProps {
  file: File;
}

export function PreviewPlayer({ file }: PreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = URL.createObjectURL(file);
    audio.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }

  return (
    <div className="bg-[var(--color-surface-dark)] rounded-xl p-6 border border-white/5">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* File name */}
      <h3 className="font-bold text-[var(--color-text-base)] truncate mb-4">
        {file.name}
      </h3>

      {/* Play button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={togglePlay}
          className="w-16 h-16 bg-[var(--color-primary-container)] rounded-full flex items-center justify-center text-[var(--color-on-primary)] transition-transform active:scale-95"
        >
          <Icon name={isPlaying ? 'pause' : 'play_arrow'} filled size={32} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-1 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
