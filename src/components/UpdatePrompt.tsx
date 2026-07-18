import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon } from './ui/Icon';
import { clearAllData } from '../services/storage';

export function UpdatePrompt() {
  const [isClearing, setIsClearing] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      console.log('[PWA] SW registered:', _swUrl);
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

  const handleClearAndUpdate = async () => {
    if (isClearing) return;

    const confirmed = window.confirm(
      'Xoá tất cả dữ liệu?\n\nThao tác này sẽ xoá toàn bộ audio và transcript đã lưu. Không thể hoàn tác.'
    );

    if (!confirmed) return;

    setIsClearing(true);
    try {
      console.log('[PWA] Clearing all data before update...');
      await clearAllData();
      console.log('[PWA] Data cleared, updating...');
      updateServiceWorker(true);
    } catch (error) {
      console.error('[PWA] Failed to clear data:', error);
      setIsClearing(false);
    }
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
        <p className="text-[var(--color-text-muted)] mb-6 text-sm">
          Chọn cách cập nhật phù hợp
        </p>

        <div className="space-y-3">
          <button
            onClick={handleUpdate}
            className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold text-base transition-transform active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
          >
            Cập nhật
          </button>

          <button
            onClick={handleClearAndUpdate}
            disabled={isClearing}
            className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 font-medium text-sm transition-all active:scale-95 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? (
              <span className="flex items-center justify-center gap-2">
                <Icon name="progress_activity" size={18} className="animate-spin" />
                Đang xoá...
              </span>
            ) : (
              'Xoá dữ liệu & Cập nhật'
            )}
          </button>

          <p className="text-[10px] text-[var(--color-text-muted)]/60 mt-2">
            Chọn "Xoá dữ liệu" nếu gặp lỗi hiển thị hoặc phát audio
          </p>
        </div>
      </div>
    </div>
  );
}
