import { Icon } from '../ui/Icon';

interface DictationHeaderProps {
  onBack: () => void;
  currentSegment: number;
  totalSegments: number;
}

export function DictationHeader({ onBack, currentSegment, totalSegments }: DictationHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-gray)]">
      <button
        onClick={onBack}
        className="p-2 -ml-2 text-[var(--color-text-base)] hover:text-[var(--color-primary)] transition-colors"
      >
        <Icon name="arrow_back" size={24} />
      </button>

      <h1 className="text-lg font-semibold text-[var(--color-text-base)]">
        Dictation Practice
      </h1>

      <div className="text-sm font-medium text-[var(--color-text-muted)] min-w-[48px] text-right">
        {currentSegment}/{totalSegments}
      </div>
    </header>
  );
}
