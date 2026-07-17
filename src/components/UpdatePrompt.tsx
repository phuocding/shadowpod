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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[var(--color-surface-container)] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_16px_64px_rgba(0,0,0,0.5)]">
        <div className="w-16 h-16 bg-[var(--color-primary)]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Icon name="system_update" size={36} className="text-[var(--color-primary)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-base)] mb-2">
          Có bản cập nhật mới
        </h2>
        <p className="text-[var(--color-text-muted)] mb-6">
          Vui lòng cập nhật để tiếp tục sử dụng ứng dụng
        </p>
        <button
          onClick={handleUpdate}
          className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold text-lg transition-transform active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
        >
          Cập nhật ngay
        </button>
      </div>
    </div>
  );
}
