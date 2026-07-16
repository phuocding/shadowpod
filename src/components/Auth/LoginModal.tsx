// Login Modal - Email OTP authentication
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { requestOTP, verifyOTP } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp' | 'success';

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);

  const resetState = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRequestOTP = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await requestOTP(email.trim());
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await verifyOTP(email.trim(), otp.trim());
      login(result.token, result.user);
      setStep('success');
      setTimeout(handleClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !isLoading) {
      action();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sign In">
      <div className="space-y-6">
        {step === 'email' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="mail" size={32} className="text-[var(--color-primary)]" />
              </div>
              <p className="text-[var(--color-text-muted)]">
                Enter your email to receive a login code
              </p>
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, handleRequestOTP)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                placeholder="your@email.com"
                autoFocus
                className="w-full px-4 py-3 bg-[var(--color-surface-dark)] border border-[var(--color-border-gray)] rounded-xl text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--color-negative)] text-center">{error}</p>
            )}

            <Button onClick={handleRequestOTP} disabled={isLoading} className="w-full">
              {isLoading ? 'Sending...' : 'Send Code'}
            </Button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--color-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="pin" size={32} className="text-[var(--color-primary)]" />
              </div>
              <p className="text-[var(--color-text-muted)]">
                Enter the 6-digit code sent to
              </p>
              <p className="text-[var(--color-text-base)] font-medium">{email}</p>
            </div>

            <div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => handleKeyDown(e, handleVerifyOTP)}
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 300);
                }}
                placeholder="000000"
                autoFocus
                maxLength={6}
                className="w-full px-4 py-3 bg-[var(--color-surface-dark)] border border-[var(--color-border-gray)] rounded-xl text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--color-negative)] text-center">{error}</p>
            )}

            <div className="space-y-3">
              <Button onClick={handleVerifyOTP} disabled={isLoading} className="w-full">
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <button
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                className="w-full text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
              >
                Use different email
              </button>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[var(--color-success)]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="check_circle" size={32} className="text-[var(--color-success)]" />
            </div>
            <p className="text-[var(--color-text-base)] font-medium">
              Welcome back!
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
