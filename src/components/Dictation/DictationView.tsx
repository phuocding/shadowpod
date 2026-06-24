import { useState, useCallback, useRef, useEffect } from 'react';
import { DictationHeader } from './DictationHeader';
import { DictationInput } from './DictationInput';
import { DictationResult } from './DictationResult';
import { DictationSummary } from './DictationSummary';
import { Icon } from '../ui/Icon';
import { audioEngine } from '../../services/audioEngine';
import { compareTexts } from '../../utils/textComparison';
import type { AudioRecord } from '../../types';
import type { DictationStep, SegmentResult } from '../../types/dictation';

interface DictationViewProps {
  audio: AudioRecord;
  onClose: () => void;
}

export function DictationView({ audio, onClose }: DictationViewProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [step, setStep] = useState<DictationStep>('input');
  const [userInput, setUserInput] = useState('');
  const [segmentResults, setSegmentResults] = useState<SegmentResult[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const checkEndIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const segments = audio.transcript || [];
  const currentSegment = segments[currentSegmentIndex];
  const totalSegments = segments.length;
  const isLastSegment = currentSegmentIndex === totalSegments - 1;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (checkEndIntervalRef.current) {
        clearInterval(checkEndIntervalRef.current);
        checkEndIntervalRef.current = null;
      }
    };
  }, []);

  const playSegment = useCallback(() => {
    if (!currentSegment) return;

    // Clear any existing interval first
    if (checkEndIntervalRef.current) {
      clearInterval(checkEndIntervalRef.current);
      checkEndIntervalRef.current = null;
    }

    audioEngine.seek(currentSegment.startTime);
    audioEngine.play();
    setIsPlaying(true);

    checkEndIntervalRef.current = setInterval(() => {
      const currentTime = audioEngine.getCurrentTime();
      if (currentTime >= currentSegment.endTime) {
        audioEngine.pause();
        setIsPlaying(false);
        if (checkEndIntervalRef.current) {
          clearInterval(checkEndIntervalRef.current);
          checkEndIntervalRef.current = null;
        }
      }
    }, 100);
  }, [currentSegment]);

  const handleSubmit = useCallback(() => {
    if (!currentSegment) return;

    const result = compareTexts(userInput, currentSegment.text);

    const segmentResult: SegmentResult = {
      segmentIndex: currentSegmentIndex,
      userInput,
      correctText: currentSegment.text,
      score: result.score,
      wordCount: result.totalWords,
      correctCount: result.correctCount,
      diffs: result.diffs,
    };

    setSegmentResults(prev => {
      const filtered = prev.filter(r => r.segmentIndex !== currentSegmentIndex);
      return [...filtered, segmentResult];
    });

    setStep('result');
  }, [userInput, currentSegment, currentSegmentIndex]);

  const stopPlayback = useCallback(() => {
    if (checkEndIntervalRef.current) {
      clearInterval(checkEndIntervalRef.current);
      checkEndIntervalRef.current = null;
    }
    audioEngine.pause();
    setIsPlaying(false);
  }, []);

  const handleRetry = useCallback(() => {
    stopPlayback();
    setUserInput('');
    setStep('input');
  }, [stopPlayback]);

  const handleNext = useCallback(() => {
    stopPlayback();
    if (isLastSegment) {
      setStep('summary');
    } else {
      setCurrentSegmentIndex(prev => prev + 1);
      setUserInput('');
      setStep('input');
    }
  }, [isLastSegment, stopPlayback]);

  const handleRetryAll = useCallback(() => {
    stopPlayback();
    setCurrentSegmentIndex(0);
    setUserInput('');
    setSegmentResults([]);
    setStep('input');
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'summary' || segmentResults.length === 0) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  }, [step, segmentResults.length, onClose]);

  const currentResult = segmentResults.find(r => r.segmentIndex === currentSegmentIndex);

  if (!currentSegment && step !== 'summary') {
    return (
      <div className="fixed inset-0 bg-[var(--color-background)] z-50 flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">No transcript available</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-background)] z-50 flex flex-col">
      <DictationHeader
        onBack={handleBack}
        currentSegment={currentSegmentIndex + 1}
        totalSegments={totalSegments}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {step === 'summary' ? (
          <DictationSummary
            results={segmentResults}
            totalSegments={totalSegments}
            onRetry={handleRetryAll}
            onDone={onClose}
          />
        ) : (
          <>
            {/* Audio Player Section */}
            <div className="flex flex-col items-center mb-8">
              <button
                onClick={playSegment}
                className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center mb-3 hover:bg-[var(--color-primary)]/80 transition-colors"
              >
                <Icon
                  name={isPlaying ? 'pause' : 'play_arrow'}
                  size={32}
                  className="text-white"
                  filled
                />
              </button>
              <button
                onClick={playSegment}
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                {isPlaying ? 'Playing...' : 'Replay'}
              </button>
            </div>

            {/* Input or Result */}
            {step === 'input' ? (
              <DictationInput
                value={userInput}
                onChange={setUserInput}
                onSubmit={handleSubmit}
                disabled={!userInput.trim()}
              />
            ) : currentResult ? (
              <DictationResult
                diffs={currentResult.diffs}
                score={currentResult.score}
                correctCount={currentResult.correctCount}
                totalWords={currentResult.wordCount}
                correctText={currentResult.correctText}
                onRetry={handleRetry}
                onNext={handleNext}
                isLastSegment={isLastSegment}
              />
            ) : null}
          </>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-[var(--color-surface-container)] rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-[var(--color-text-base)] mb-2">
              Exit Practice?
            </h3>
            <p className="text-[var(--color-text-muted)] mb-6">
              Your progress will be lost if you exit now.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2 px-4 rounded-xl border border-[var(--color-border-gray)] text-[var(--color-text-base)]"
              >
                Continue
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 rounded-xl bg-[var(--color-negative)] text-white"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
