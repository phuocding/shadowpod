import { Icon } from '../ui/Icon';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      {/* Headphones illustration */}
      <div className="w-24 h-24 mb-6 text-[var(--color-text-muted)] opacity-40">
        <Icon name="headphones" size={96} />
      </div>

      <h2 className="text-xl font-bold text-[var(--color-text-base)] mb-2">
        No audio yet
      </h2>
      <p className="text-[var(--color-text-muted)] text-center mb-6">
        Upload your first audio file to start practicing
      </p>
    </div>
  );
}
