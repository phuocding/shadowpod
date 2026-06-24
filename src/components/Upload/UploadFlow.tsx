import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { FileDropzone } from './FileDropzone';
import { PreviewPlayer } from './PreviewPlayer';
import { ApiKeySetupSheet } from '../Onboarding';
import { transcribe } from '../../services/transcriber';
import { saveAudio } from '../../services/storage';
import { useSettingsStore } from '../../stores/settingsStore';
import { usePlayerStore } from '../../stores/playerStore';
import { getErrorMessage } from '../../utils/errorMessages';
import type { ErrorCode } from '../../types';

type Step = 'select' | 'preview' | 'transcribing' | 'error';

export function UploadFlow() {
  const navigate = useNavigate();
  const apiKey = useSettingsStore((s) => s.deepgramApiKey);
  const loadAndPlay = usePlayerStore((s) => s.loadAndPlay);
  const setPendingSheetOpen = usePlayerStore((s) => s.setPendingSheetOpen);

  const [step, setStep] = useState<Step>('select');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);

  // Auto-show API key setup when no key configured
  useEffect(() => {
    if (!apiKey) {
      setShowApiKeySetup(true);
    }
  }, [apiKey]);

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
    if (!file || !apiKey) return;

    setStep('transcribing');
    setError(null);

    const blob = new Blob([await file.arrayBuffer()], { type: file.type });
    const result = await transcribe(blob, apiKey);

    if (result.error) {
      setError(result.error);
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

    // Load audio (no auto-play), signal sheet to open, and navigate home
    await loadAndPlay(id, false);
    setPendingSheetOpen(true);
    navigate('/');
  }

  function reset() {
    setFile(null);
    setError(null);
    setStep('select');
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
            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="flex-1">
                Chọn file khác
              </Button>
              <Button onClick={handleTranscribe} disabled={!apiKey} className="flex-1">
                Transcribe
              </Button>
            </div>
          </div>
        )}

        {step === 'transcribing' && <TranscribingState />}

        {step === 'error' && error && (
          <ErrorState message={getErrorMessage(error)} onRetry={reset} />
        )}
      </main>

      {/* API Key Setup Sheet */}
      <ApiKeySetupSheet
        isOpen={showApiKeySetup}
        onClose={() => navigate('/')}
        onSuccess={() => setShowApiKeySetup(false)}
      />
    </div>
  );
}

function TranscribingState() {
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
      <p className="text-lg text-[var(--color-text-base)]">Transcribing...</p>
      <p className="text-sm text-[var(--color-text-muted)] mt-2">Quá trình này có thể mất vài giây</p>
      <p className="text-xs text-[var(--color-primary)] mt-4 opacity-70">
        Free • Using your Deepgram API key
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Icon name="error" size={64} className="text-[var(--color-negative)] mb-4" />
      <p className="text-[var(--color-text-base)] text-center mb-6">{message}</p>
      <Button onClick={onRetry}>Thử lại</Button>
    </div>
  );
}
