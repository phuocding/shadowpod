import { type ReactNode, useEffect } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full sm:max-w-md bg-[var(--color-surface-container)] rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up">
        {/* Drag handle (mobile) */}
        <div className="sm:hidden w-10 h-1 bg-[var(--color-border-gray)] rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-base)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
          >
            <Icon name="close" size={24} />
          </button>
        </div>

        {/* Body */}
        {children}
      </div>
    </div>
  );
}
