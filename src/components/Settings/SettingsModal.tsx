import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useSettingsStore } from '../../stores/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { deepgramApiKey, setApiKey, clearApiKey, theme, toggleTheme } = useSettingsStore();
  const [inputKey, setInputKey] = useState(deepgramApiKey || '');
  const [showKey, setShowKey] = useState(false);

  function handleSave() {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
      onClose();
    }
  }

  function handleClear() {
    clearApiKey();
    setInputKey('');
  }

  const hasKey = !!deepgramApiKey;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Theme Toggle */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-base)] mb-3">
            Appearance
          </label>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] border border-[var(--color-border-gray)] rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon name={theme === 'dark' ? 'dark_mode' : 'light_mode'} size={24} className="text-[var(--color-primary)]" />
              <span className="text-[var(--color-text-base)]">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${theme === 'light' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-gray)]'}`}>
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${theme === 'light' ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        {/* API Key Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-[var(--color-text-base)]">
              Deepgram API Key
            </label>
            <span className="text-xs px-2 py-0.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-full">
              Free forever
            </span>
          </div>

          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full px-4 py-3 pr-12 bg-[var(--color-surface-dark)] border border-[var(--color-border-gray)] rounded-xl text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
            >
              <Icon name={showKey ? 'visibility_off' : 'visibility'} size={20} />
            </button>
          </div>

          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Get your free API key at{' '}
            <a
              href="https://deepgram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary)] hover:underline"
            >
              deepgram.com
            </a>
            {' '}— includes 12,000 free minutes/year
          </p>

          {hasKey && (
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-success)]">
              <Icon name="check_circle" size={16} />
              <span>API key saved</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {hasKey && (
            <Button variant="ghost" onClick={handleClear} className="text-[var(--color-negative)]">
              Clear Key
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!inputKey.trim()}
            className="flex-1"
          >
            {hasKey ? 'Update' : 'Save'}
          </Button>
        </div>

        {/* Version */}
        <div className="pt-4 border-t border-[var(--color-border-gray)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            ShadowPod v1.2.4
          </p>
        </div>
      </div>
    </Modal>
  );
}
