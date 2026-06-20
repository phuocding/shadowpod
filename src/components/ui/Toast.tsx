import { useEffect, useState } from 'react';
import { Icon } from './Icon';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const iconMap: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
};

const colorMap: Record<ToastType, string> = {
  success: 'var(--color-primary-container)',
  error: 'var(--color-negative)',
  info: 'var(--color-announcement)',
};

export function Toast({ message, type, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div
        className="flex items-center gap-3 px-6 py-3 bg-[var(--color-surface-dark)] border border-white/5 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.6)]"
      >
        <Icon name={iconMap[type]} size={24} filled style={{ color: colorMap[type] }} />
        <span className="text-base font-bold text-[var(--color-text-base)]">{message}</span>
      </div>
    </div>
  );
}

// Toast hook for easy usage
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  return {
    toast,
    showToast,
    hideToast,
    ToastComponent: toast ? (
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={!!toast}
        onClose={hideToast}
      />
    ) : null,
  };
}
