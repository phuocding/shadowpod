import { useState, useEffect } from 'react';
import { Icon } from './ui/Icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const wasDismissed = localStorage.getItem('installPromptDismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Chromium browsers: Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Safari detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

    if (isIOS && isSafari) {
      // Delay showing iOS prompt
      const timer = setTimeout(() => setShowIOSPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }

    handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (dismissed) return null;

  // Chromium install prompt
  if (deferredPrompt) {
    return (
      <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-up">
        <div className="bg-[var(--color-surface-container)]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shrink-0">
              <Icon name="download" size={24} className="text-[var(--color-on-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[var(--color-text-base)]">Cài đặt ShadowPod</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Miễn phí mãi mãi • Không cần đăng ký
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2.5 px-4 rounded-xl text-[var(--color-text-muted)] border border-[var(--color-border-gray)] transition-colors"
            >
              Để sau
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold transition-transform active:scale-95"
            >
              Cài đặt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari manual instruction
  if (showIOSPrompt) {
    return (
      <div className="fixed top-4 left-4 right-4 z-[100] animate-slide-up">
        <div className="bg-[var(--color-surface-container)]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shrink-0">
              <Icon name="ios_share" size={24} className="text-[var(--color-on-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[var(--color-text-base)]">Cài đặt ShadowPod</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Nhấn <Icon name="ios_share" size={16} className="inline align-text-bottom" /> rồi chọn <strong>"Add to Home Screen"</strong>
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
