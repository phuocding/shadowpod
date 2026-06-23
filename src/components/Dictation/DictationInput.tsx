import { Button } from '../ui/Button';

interface DictationInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function DictationInput({ value, onChange, onSubmit, disabled }: DictationInputProps) {
  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type what you hear..."
        className="w-full h-32 px-4 py-3 bg-[var(--color-surface-container-low)] border border-[var(--color-border-gray)] rounded-xl text-[var(--color-text-base)] text-lg placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none"
        autoFocus
      />

      <Button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="w-full"
      >
        Check Answer
      </Button>

      <p className="text-sm text-[var(--color-text-muted)] text-center flex items-center justify-center gap-2">
        <span>💡</span>
        <span>Tip: Tap play to hear the sentence again</span>
      </p>
    </div>
  );
}
