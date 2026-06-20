import type { PlaybackSpeed } from '../../types';

interface SpeedToggleProps {
  speed: PlaybackSpeed;
  onChange: (speed: PlaybackSpeed) => void;
}

export function SpeedToggle({ speed, onChange }: SpeedToggleProps) {
  function toggle() {
    onChange(speed === 'default' ? 'slow' : 'default');
  }

  const isActive = speed === 'slow';

  return (
    <button
      onClick={toggle}
      className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
        isActive
          ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
          : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]'
      }`}
    >
      {speed === 'slow' ? '0.75x' : '1x'}
    </button>
  );
}
