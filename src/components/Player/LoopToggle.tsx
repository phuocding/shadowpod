import { Icon } from '../ui/Icon';
import type { LoopMode } from '../../types';

interface LoopToggleProps {
  mode: LoopMode;
  onChange: (mode: LoopMode) => void;
}

const modes: LoopMode[] = ['none', 'all', 'sentence'];

const icons: Record<LoopMode, string> = {
  none: 'repeat',
  all: 'repeat',
  sentence: 'repeat_one',
};

export function LoopToggle({ mode, onChange }: LoopToggleProps) {
  function cycle() {
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    onChange(modes[nextIndex]);
  }

  const isActive = mode !== 'none';

  return (
    <button
      onClick={cycle}
      className={`p-2 rounded-full transition-colors ${
        isActive
          ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10'
          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]'
      }`}
      title={mode === 'none' ? 'Loop off' : mode === 'all' ? 'Loop all' : 'Loop sentence'}
    >
      <Icon name={icons[mode]} filled={isActive} size={24} />
    </button>
  );
}
