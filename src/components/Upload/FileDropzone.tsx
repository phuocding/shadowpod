import { useCallback } from 'react';
import { Icon } from '../ui/Icon';
import type { ErrorCode } from '../../types';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  onError: (error: ErrorCode) => void;
}

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function FileDropzone({ onFileSelect, onError }: FileDropzoneProps) {
  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|m4a|wav|webm|ogg)$/i)) {
      onError('INVALID_FORMAT');
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      onError('FILE_TOO_LARGE');
      return false;
    }
    return true;
  }, [onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, validateFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  }, [onFileSelect, validateFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-[var(--color-border-gray)] rounded-2xl p-12 text-center hover:border-[var(--color-primary)] transition-colors cursor-pointer"
    >
      <label className="cursor-pointer flex flex-col items-center">
        <Icon name="cloud_upload" size={64} className="text-[var(--color-text-muted)] mb-4" />
        <p className="text-lg text-[var(--color-text-base)] mb-2">
          Drag & drop audio file here
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          or tap to browse
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          MP3, M4A, WAV, WEBM, OGG • Max {MAX_SIZE_MB}MB
        </p>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </label>
    </div>
  );
}
