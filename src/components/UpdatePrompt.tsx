import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon } from './ui/Icon';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      console.log('[PWA] SW registered:', _swUrl);
      // Check for updates every 30 seconds when app is open
      if (registration) {
        setInterval(() => {
          console.log('[PWA] Checking for updates...');
          registration.update();
        }, 30 * 1000);
      }
    },
    onNeedRefresh() {
      console.log('[PWA] New version available!');
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-slide-up">
      <div className="bg-[var(--color-surface-container)]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shrink-0">
            <Icon name="system_update" size={22} className="text-[var(--color-on-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[var(--color-text-base)]">
              Có bản cập nhật mới
            </p>
          </div>
          <button
            onClick={handleUpdate}
            className="py-2 px-4 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold transition-transform active:scale-95"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
