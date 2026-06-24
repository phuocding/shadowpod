import { Icon } from '../ui/Icon';

interface WelcomeScreenProps {
  onTrySample: () => void;
  onUploadOwn: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onTrySample, onUploadOwn, onSkip }: WelcomeScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-background)] flex flex-col items-center justify-center px-6">
      {/* Logo & Branding */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 mb-4">
          <img src="/screen.png" alt="ShadowPod" className="w-full h-full" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-base)] mb-2">
          Welcome to ShadowPod
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Train your ears. One sentence at a time.
        </p>
      </div>

      {/* Choice Cards */}
      <div className="w-full max-w-sm space-y-4">
        {/* Primary: Try Sample */}
        <button
          onClick={onTrySample}
          className="w-full p-5 rounded-2xl bg-[var(--color-primary)] text-left transition-transform active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Icon name="headphones" size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-[var(--color-on-primary)]">Try Sample Audio</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-white text-[var(--color-primary)]">
                  FREE
                </span>
              </div>
              <p className="text-sm text-white/80">
                Practice with curated content. No setup needed.
              </p>
            </div>
          </div>
        </button>

        {/* Secondary: Upload Own */}
        <button
          onClick={onUploadOwn}
          className="w-full p-5 rounded-2xl border border-[var(--color-border-gray)] bg-[var(--color-surface-container)] text-left transition-transform active:scale-[0.98]"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-dark)] flex items-center justify-center flex-shrink-0">
              <Icon name="cloud_upload" size={24} className="text-[var(--color-text-muted)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-[var(--color-text-base)] mb-1">Upload Your Own</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                Use your teacher's audio, podcasts, anything!
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Bottom */}
      <div className="mt-12 flex flex-col items-center">
        <p className="text-xs text-[var(--color-primary)] mb-4">
          Free forever • No subscriptions
        </p>
        <button
          onClick={onSkip}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
          I'll explore first
        </button>
      </div>
    </div>
  );
}
