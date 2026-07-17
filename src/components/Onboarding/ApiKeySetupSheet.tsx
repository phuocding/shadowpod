import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { useSettingsStore } from '../../stores/settingsStore';
import { handleInputFocus } from '../../utils/keyboardScroll';

interface ApiKeySetupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiKeySetupSheet({ isOpen, onClose, onSuccess }: ApiKeySetupSheetProps) {
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const setApiKey = useSettingsStore((s) => s.setApiKey);

  if (!isOpen) return null;

  function handleSave() {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      onSuccess();
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[65] flex justify-center">
        <div className="w-full max-w-2xl h-[90vh] bg-[var(--color-surface-container)]/95 backdrop-blur-xl border border-white/10 rounded-t-[32px] flex flex-col shadow-2xl animate-slide-up">
          {/* Drag Handle */}
          <div className="w-full flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header Controls */}
          <div className="absolute top-6 right-6 flex items-center gap-4">
            <span className="text-[10px] font-medium tracking-wider uppercase px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              Step 1 of 2
            </span>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Icon name="close" size={20} className="text-[var(--color-text-muted)]" />
            </button>
          </div>

          {/* Scrollable Content - Hero + Instructions only */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-2">
            {/* Hero Section - Compact */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Icon name="key" size={36} className="text-[var(--color-primary)]" />
              </div>
              <h1 className="text-xl font-bold text-[var(--color-text-base)] mb-1">
                Let's set up your API key
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] max-w-md">
                One-time setup to enable audio transcription.
              </p>
            </div>

            {/* Instructions Card */}
            <div className="bg-[var(--color-surface-dark)]/50 border border-white/5 rounded-2xl p-4 mb-4">
              <h3 className="text-[10px] font-medium tracking-wider uppercase text-[var(--color-text-muted)] mb-3">
                Configuration Steps
              </h3>
              <div className="space-y-3">
                {[
                  { step: 1, title: 'Go to deepgram.com', desc: 'Create a free account.' },
                  { step: 2, title: 'Generate & Copy Key', desc: "Create an API key." },
                  { step: 3, title: 'Paste below', desc: 'Unlock transcription.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[var(--color-primary)]">{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[var(--color-text-base)]">{item.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Bottom - Input + Actions */}
          <div className="flex-shrink-0 px-4 md:px-6 pb-8 pt-2 border-t border-white/5 bg-[var(--color-surface-container)]">
            {/* Input Section */}
            <div className="space-y-3 mb-4">
              <label className="block font-semibold text-sm text-[var(--color-text-base)]">
                Your Deepgram API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="dg_a7b2..."
                  className="w-full bg-[var(--color-surface-dark)] border border-white/10 focus:border-[var(--color-primary)]/50 focus:ring-4 focus:ring-[var(--color-primary)]/10 rounded-xl px-4 py-3 text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)]/40 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
                >
                  <Icon name={showKey ? 'visibility_off' : 'visibility'} size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="info" size={14} className="text-[var(--color-primary)]" />
                <p className="text-xs text-[var(--color-text-muted)]">
                  <span className="text-[var(--color-primary)] font-bold">12,000 free minutes/year</span> • Stored locally
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSave}
                disabled={!inputKey.trim()}
                className="w-full h-12 bg-[var(--color-primary)] hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <span>Save & Continue</span>
                <Icon name="arrow_forward" size={20} />
              </button>
              <a
                href="https://deepgram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 text-center text-[var(--color-primary)] hover:text-emerald-400 font-semibold text-sm transition-colors flex items-center justify-center gap-1 group"
              >
                Get Free Key <span className="transition-transform group-hover:translate-x-1">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
