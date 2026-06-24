import { Icon } from '../ui/Icon';

interface UploadPromptProps {
  onShowGuide: () => void;
  onDismiss: () => void;
}

export function UploadPrompt({ onShowGuide, onDismiss }: UploadPromptProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-black/50 animate-fade-in"
        onClick={onDismiss}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[95] animate-slide-up">
        <div className="bg-[var(--color-surface-container)] rounded-t-3xl p-6 pb-8 max-w-lg mx-auto">
          {/* Drag Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-[var(--color-border-gray)] rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
          >
            <Icon name="close" size={20} />
          </button>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-base)] mb-1">
              Nice work!
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              You completed your first practice sessions!
            </p>
          </div>

          {/* Suggestion */}
          <div className="bg-[var(--color-surface-dark)] rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Icon name="lightbulb" size={20} className="text-[var(--color-primary)]" />
              <span className="font-semibold text-[var(--color-text-base)]">
                Pro tip: Upload your own audio
              </span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-[var(--color-primary)]" />
                Practice with your teacher's recordings
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-[var(--color-primary)]" />
                Use podcasts you love
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check" size={16} className="text-[var(--color-primary)]" />
                Learn vocabulary relevant to YOU
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 py-3 rounded-xl text-[var(--color-text-muted)] border border-[var(--color-border-gray)]"
            >
              Maybe later
            </button>
            <button
              onClick={onShowGuide}
              className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold"
            >
              Show me how
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
