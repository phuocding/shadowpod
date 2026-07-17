import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { getLatestRelease, type GitHubRelease } from '../../services/githubRelease';
import { handleInputFocus } from '../../utils/keyboardScroll';
import { validateDeepgramKey } from '../../services/deepgramValidation';

type KeyStatus = 'idle' | 'validating' | 'valid' | 'invalid';

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
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isApiKeyExpanded, setIsApiKeyExpanded] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDev = window.location.hostname === 'localhost';

  useEffect(() => {
    if (isOpen) {
      setInputKey(deepgramApiKey || '');
      setKeyStatus(deepgramApiKey ? 'valid' : 'idle');
      setValidationError(null);
      setIsApiKeyExpanded(false);
      setShowKey(false);
      getLatestRelease().then(setRelease);
      if (isAuthenticated) refreshUser();
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen, isAuthenticated, refreshUser, deepgramApiKey]);

  const validateAndSave = useCallback(async (key: string) => {
    if (!key.trim()) return;
    if (key.trim() === deepgramApiKey) return;

    setKeyStatus('validating');
    setValidationError(null);

    const result = await validateDeepgramKey(key.trim());

    if (result.valid) {
      setKeyStatus('valid');
      setApiKey(key.trim());
    } else {
      setKeyStatus('invalid');
      setValidationError(result.message || 'Key không hợp lệ');
    }
  }, [deepgramApiKey, setApiKey]);

  const handleKeyChange = (value: string) => {
    setInputKey(value);
    if (keyStatus === 'invalid') {
      setKeyStatus('idle');
      setValidationError(null);
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim() && value.trim() !== deepgramApiKey) {
      debounceRef.current = setTimeout(() => validateAndSave(value), 800);
    }
  };

  const handleKeyBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputKey.trim() && inputKey.trim() !== deepgramApiKey) {
      validateAndSave(inputKey);
    }
  };

  const handleClearKey = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    clearApiKey();
    setInputKey('');
    setKeyStatus('idle');
    setValidationError(null);
  };

  const hasKey = !!deepgramApiKey;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Account Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-[var(--color-text-base)]">
              Account
            </label>
            {isAuthenticated && quota?.hasActiveSubscription && (
              <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                hasKey && keyStatus === 'invalid'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  hasKey && keyStatus === 'invalid' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'
                }`} />
                {hasKey && keyStatus === 'invalid' ? 'Đang kích hoạt dự phòng' : 'Chế độ chờ'}
              </span>
            )}
          </div>
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
                <div className={`pt-3 border-t transition-colors ${
                  keyStatus === 'invalid'
                    ? 'border-amber-500/50'
                    : 'border-[var(--color-border-gray)]'
                }`}>
                  {keyStatus === 'invalid' ? (
                    <>
                      <div className="flex items-center gap-2 mb-3 text-amber-400">
                        <Icon name="warning" size={16} />
                        <p className="text-sm font-medium">
                          Key cá nhân lỗi. Mua gói dự phòng?
                        </p>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-[var(--color-text-base)]">60 phút/tháng</p>
                          <p className="text-xs text-[var(--color-text-muted)]">Học không gián đoạn</p>
                        </div>
                        <a
                          href="https://buymeacoffee.com/phuocding"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-400 transition-colors animate-pulse"
                        >
                          $1/tháng
                        </a>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--color-text-muted)] mb-2">
                        {hasKey
                          ? 'Chuẩn bị sẵn 60 phút dự phòng để học không gián đoạn'
                          : 'Upgrade để transcribe không cần API key'
                        }
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
                    </>
                  )}
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

        {/* API Key Section - Accordion */}
        <div className="bg-[var(--color-surface-container-low)] border border-[var(--color-border-gray)] rounded-xl overflow-hidden">
          <button
            onClick={() => setIsApiKeyExpanded(!isApiKeyExpanded)}
            className="w-full flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-2 min-h-[24px]">
              <span className="text-sm font-semibold text-[var(--color-text-base)]">
                Cấu hình Deepgram API cá nhân (BYOK)
              </span>
              {hasKey && isAuthenticated && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  keyStatus === 'invalid'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    keyStatus === 'invalid' ? 'bg-red-400' : 'bg-emerald-400'
                  }`} />
                  {keyStatus === 'invalid' ? 'Lỗi' : 'Đang sử dụng'}
                </span>
              )}
            </div>
            <Icon
              name={isApiKeyExpanded ? 'expand_less' : 'expand_more'}
              size={20}
              className="text-[var(--color-text-muted)] flex-shrink-0"
            />
          </button>

          <div className={`transition-all duration-200 ease-out ${
            isApiKeyExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}>
            <div className="px-4 pb-4 space-y-3">
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  onBlur={() => {
                    setIsInputFocused(false);
                    handleKeyBlur();
                  }}
                  onFocus={(e) => {
                    setIsInputFocused(true);
                    handleInputFocus(e);
                  }}
                  placeholder="Dán API key vào đây..."
                  disabled={keyStatus === 'validating'}
                  className={`w-full px-4 py-3 pr-24 bg-[var(--color-surface-dark)] border rounded-xl text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)] focus:outline-none transition-all ${
                    keyStatus === 'valid' && inputKey
                      ? 'border-emerald-500'
                      : keyStatus === 'invalid'
                      ? 'border-red-500'
                      : 'border-[var(--color-border-gray)] focus:border-[var(--color-primary)]'
                  } ${keyStatus === 'validating' ? 'opacity-60' : ''}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {keyStatus === 'validating' && (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Icon name="progress_activity" size={18} className="animate-spin text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  {inputKey && keyStatus !== 'validating' && isInputFocused && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                    >
                      <Icon name="cancel" size={18} className="text-[var(--color-text-muted)]" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Icon name={showKey ? 'visibility_off' : 'visibility'} size={18} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
              </div>

              {keyStatus === 'valid' && inputKey && (
                <p className="text-xs text-emerald-400 flex items-center gap-1 mt-4">
                  <Icon name="check" size={14} />
                  Đã tự động lưu và xác thực thành công
                </p>
              )}

              {validationError && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-4">
                  <Icon name="warning" size={14} />
                  {validationError}
                </p>
              )}

              {keyStatus !== 'valid' && (
                <p className="text-xs text-[var(--color-text-muted)] mt-3">
                  Lấy key miễn phí tại{' '}
                  <a href="https://deepgram.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                    deepgram.com
                  </a>
                  {' '}— 12,000 phút/năm miễn phí
                </p>
              )}
            </div>
          </div>
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
