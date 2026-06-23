interface ModeSwitcherProps {
  mode: 'shadow' | 'dictate';
  onModeChange: (mode: 'shadow' | 'dictate') => void;
}

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex bg-[var(--color-surface-dark)] rounded-full p-1">
        <button
          onClick={() => onModeChange('shadow')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === 'shadow'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]'
          }`}
        >
          Shadow
        </button>
        <button
          onClick={() => onModeChange('dictate')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            mode === 'dictate'
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]'
          }`}
        >
          Dictate
        </button>
      </div>
    </div>
  );
}
