import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { getLatestRelease, type GitHubRelease } from '../../services/githubRelease';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { deepgramApiKey, setApiKey, clearApiKey, theme, toggleTheme } = useSettingsStore();
  const { isAuthenticated, user, quota, logout, refreshUser, mockSubscription } = useAuthStore();
  const [inputKey, setInputKey] = useState(deepgramApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [release, setRelease] = useState<GitHubRelease | null>(null);

  const isDev = window.location.hostname === 'localhost';

  useEffect(() => {
    if (isOpen) {
      setInputKey(deepgramApiKey || '');
      getLatestRelease().then(setRelease);
      if (isAuthenticated) refreshUser();
    }
  }, [isOpen, isAuthenticated, refreshUser, deepgramApiKey]);

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
        {/* Account Section */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-base)] mb-3">
            Account
          </label>
          {isAuthenticated && user ? (
            <div className="p-4 bg-[var(--color-surface-container-low)] border border-[var(--color-border-gray)] rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center">
                    <Icon name="person" size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-base)]">{user.email}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {quota?.hasActiveSubscription ? 'Subscribed' : 'Free'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-[var(--color-negative)] hover:underline"
                >
                  Sign out
                </button>
              </div>
              {quota?.hasActiveSubscription ? (
                <div className="pt-3 border-t border-[var(--color-border-gray)]">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--color-text-muted)]">Quota</span>
                    <span className="text-[var(--color-text-base)]">
                      {quota.minutesUsed.toFixed(1)} / {quota.minutesQuota} phút
                    </span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface-dark)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] transition-all"
                      style={{ width: `${Math.min(100, (quota.minutesUsed / quota.minutesQuota) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {quota.minutesRemaining.toFixed(1)} phút còn lại
                    {quota.expiresAt && ` • Reset ${new Date(quota.expiresAt).toLocaleDateString('vi-VN')}`}
                  </p>
                </div>
              ) : (
                <div className="pt-3 border-t border-[var(--color-border-gray)]">
                  <p className="text-sm text-[var(--color-text-muted)] mb-2">
                    Upgrade để transcribe không cần API key
                  </p>
                  <div className="flex items-center justify-between p-3 bg-[var(--color-primary)]/10 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-base)]">60 phút/tháng</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Tự động gia hạn</p>
                    </div>
                    <a
                      href="https://buymeacoffee.com/phuocding"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                      $1/tháng
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-[var(--color-surface-container-low)] border border-[var(--color-border-gray)] rounded-xl text-center">
              <p className="text-sm text-[var(--color-text-muted)] mb-3">
                Đăng nhập để transcribe không cần API key
              </p>
              <Button onClick={() => window.dispatchEvent(new CustomEvent('open-login-modal'))} className="w-full">
                Đăng nhập
              </Button>
            </div>
          )}
        </div>

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

        {/* DEV ONLY: Mock Subscription Toggle */}
        {isDev && isAuthenticated && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs text-amber-500 font-semibold mb-2">🧪 DEV MODE</p>
            <div className="flex gap-2">
              <button
                onClick={() => mockSubscription(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  quota?.hasActiveSubscription
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--color-surface-dark)] text-[var(--color-text-muted)]'
                }`}
              >
                Subscribed
              </button>
              <button
                onClick={() => mockSubscription(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  !quota?.hasActiveSubscription
                    ? 'bg-gray-500 text-white'
                    : 'bg-[var(--color-surface-dark)] text-[var(--color-text-muted)]'
                }`}
              >
                Free
              </button>
            </div>
          </div>
        )}

        {/* Version */}
        <div className="pt-4 border-t border-[var(--color-border-gray)]">
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            ShadowPod v{release?.version || '...'}
            {release?.url && (
              <>
                {' • '}
                <a
                  href={release.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-primary)] hover:underline"
                >
                  Release Notes
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
}
