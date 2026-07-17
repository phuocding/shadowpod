import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { FileDropzone } from './FileDropzone';
import { PreviewPlayer } from './PreviewPlayer';
import { ApiKeySetupSheet } from '../Onboarding';
import { useToast } from '../ui/Toast';
import { transcribe, transcribeWithServerAPI } from '../../services/transcriber';
import { saveAudio } from '../../services/storage';
import { useSettingsStore } from '../../stores/settingsStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage } from '../../utils/errorMessages';
import type { ErrorCode } from '../../types';

type Step = 'select' | 'preview' | 'transcribing' | 'error';

export function UploadFlow() {
  const navigate = useNavigate();
  const apiKey = useSettingsStore((s) => s.deepgramApiKey);
  const setLoopMode = useSettingsStore((s) => s.setLoopMode);
  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);
  const setPendingSheetOpen = usePlayerStore((s) => s.setPendingSheetOpen);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const { isAuthenticated, quota, setQuota } = useAuthStore();
  const { showToast, ToastComponent } = useToast();

  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [transcribeMethod, setTranscribeMethod] = useState<'api' | 'byok'>('api');
  const [byokFailed, setByokFailed] = useState(false);

  // Check if user can use server API
  const canUseAPI = isAuthenticated && quota?.hasActiveSubscription && (quota?.minutesRemaining ?? 0) > 0;
  const hasBYOK = !!apiKey;

  // Determine available methods and default (BYOK first to save quota)
  useEffect(() => {
    if (hasBYOK) {
      setTranscribeMethod('byok');
    } else if (canUseAPI) {
      setTranscribeMethod('api');
    }
  }, [canUseAPI, hasBYOK]);

  // Show API key setup only if no method available
  useEffect(() => {
    if (!canUseAPI && !hasBYOK) {
      setShowApiKeySetup(true);
    }
  }, [canUseAPI, hasBYOK]);

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setError(null);
    setStep('preview');
  }

  function handleError(code: ErrorCode) {
    setError(code);
    setStep('error');
  }

  async function handleTranscribe() {
    if (!file) return;

    // Check if we have a valid method
    if (transcribeMethod === 'byok' && !apiKey) return;
    if (transcribeMethod === 'api' && !canUseAPI) return;

    setStep('transcribing');
    setError(null);

    const blob = new Blob([await file.arrayBuffer()], { type: file.type });

    let result;
    if (transcribeMethod === 'api') {
      // Use server API (no key exposed)
      result = await transcribeWithServerAPI(blob);
      if (result.quota) {
        setQuota(result.quota);
      }
    } else {
      // Use BYOK
      result = await transcribe(blob, apiKey!);
    }

    if (result.error) {
      setError(result.error);
      // Track if BYOK failed so we can suggest API
      if (transcribeMethod === 'byok') {
        setByokFailed(true);
      }
      setStep('error');
      return;
    }

    // Get duration from audio
    const audio = new Audio(URL.createObjectURL(blob));
    await new Promise((resolve) => {
      audio.onloadedmetadata = resolve;
    });

    const id = await saveAudio(
      file.name.replace(/\.[^.]+$/, ''),
      blob,
      result.segments,
      audio.duration
    );

    // Context-aware: don't interrupt if user is listening to something
    if (isPlaying) {
      // Show toast with action to open new audio
      navigate('/');
      showToast('Transcribe xong!', 'success', {
        label: 'Mở',
        onClick: async () => {
          setLoopMode('none'); // Reset loop mode for new audio
          await loadAndPlay(id, false);
          setPendingSheetOpen(true);
        },
      });
    } else {
      // No audio playing - auto-open player (good for first-time users)
      setLoopMode('none'); // Reset loop mode for new audio
      await loadAndPlay(id, false);
      setPendingSheetOpen(true);
      navigate('/');
    }
  }

  function reset() {
    setFile(null);
    setError(null);
    setByokFailed(false);
    setStep('select');
  }

  function switchToApiAndRetry() {
    setTranscribeMethod('api');
    setError(null);
    setByokFailed(false);
    setStep('preview');
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="flex items-center px-4 py-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <Icon name="arrow_back" className="text-[var(--color-text-base)]" />
        </button>
        <h1 className="text-xl font-bold text-[var(--color-text-base)] ml-2">
          {step === 'select' ? 'Upload Audio' : step === 'preview' ? 'Preview' : 'Processing'}
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        {step === 'select' && (
          <FileDropzone onFileSelect={handleFileSelect} onError={handleError} />
        )}

        {step === 'preview' && file && (
          <div className="space-y-6">
            <PreviewPlayer file={file} />
            <p className="text-sm text-[var(--color-text-muted)] text-center">
              Nghe thử để kiểm tra chất lượng audio trước khi transcribe
            </p>

            {/* Method selector - only show if both methods available */}
            {canUseAPI && hasBYOK && (
              <div className="flex gap-2 p-1 bg-[var(--color-surface-dark)] rounded-xl">
                <button
                  onClick={() => setTranscribeMethod('api')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    transcribeMethod === 'api'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  ShadowPod API
                </button>
                <button
                  onClick={() => setTranscribeMethod('byok')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    transcribeMethod === 'byok'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  Your API Key
                </button>
              </div>
            )}

            {/* Method info */}
            <div className="text-center text-xs text-[var(--color-text-muted)]">
              {transcribeMethod === 'api' && canUseAPI && (
                <span className="text-[var(--color-primary)]">
                  Dùng {quota?.minutesRemaining.toFixed(1)} phút còn lại của bạn
                </span>
              )}
              {transcribeMethod === 'byok' && hasBYOK && (
                <span>
                  Dùng API key riêng
                  {canUseAPI && (
                    <span className="text-[var(--color-text-muted)]">
                      {' '}• Còn {quota?.minutesRemaining.toFixed(1)} phút backup
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="flex-1">
                Chọn file khác
              </Button>
              <Button
                onClick={handleTranscribe}
                disabled={transcribeMethod === 'byok' ? !hasBYOK : !canUseAPI}
                className="flex-1"
              >
                Transcribe
              </Button>
            </div>
          </div>
        )}

        {step === 'transcribing' && <TranscribingState method={transcribeMethod} />}

        {step === 'error' && error && (
          <ErrorState
            message={getErrorMessage(error)}
            onRetry={reset}
            showApiSuggestion={byokFailed && canUseAPI}
            onTryApi={switchToApiAndRetry}
            quotaRemaining={quota?.minutesRemaining}
          />
        )}
      </main>

      {/* API Key Setup Sheet */}
      <ApiKeySetupSheet
        isOpen={showApiKeySetup}
        onClose={() => navigate('/')}
        onSuccess={() => setShowApiKeySetup(false)}
      />

      {/* Toast */}
      {ToastComponent}
    </div>
  );
}

function TranscribingState({ method }: { method: 'api' | 'byok' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex items-end gap-1 h-12 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-2 bg-[var(--color-primary)] rounded-full animate-pulse"
            style={{
              height: `${20 + Math.random() * 20}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      <p className="text-lg text-[var(--color-text-base)]">Đang transcribe...</p>
      <p className="text-sm text-[var(--color-text-muted)] mt-2">Quá trình này có thể mất vài giây</p>
      <p className="text-xs text-[var(--color-primary)] mt-4 opacity-70">
        {method === 'api' ? 'Dùng ShadowPod API' : 'Dùng Deepgram API key của bạn'}
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  showApiSuggestion,
  onTryApi,
  quotaRemaining,
}: {
  message: string;
  onRetry: () => void;
  showApiSuggestion?: boolean;
  onTryApi?: () => void;
  quotaRemaining?: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon name="error" size={64} className="text-[var(--color-negative)] mb-4" />
      <p className="text-[var(--color-text-base)] text-center mb-6">{message}</p>

      {showApiSuggestion && onTryApi && (
        <div className="w-full max-w-sm mb-4 p-4 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl text-center">
          <p className="text-sm text-[var(--color-text-base)] mb-2">
            Thử dùng ShadowPod API?
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            Bạn còn {quotaRemaining?.toFixed(1)} phút
          </p>
          <Button onClick={onTryApi} className="w-full">
            Dùng ShadowPod API
          </Button>
        </div>
      )}

      <Button variant="secondary" onClick={onRetry}>
        {showApiSuggestion ? 'Chọn file khác' : 'Thử lại'}
      </Button>
    </div>
  );
}
