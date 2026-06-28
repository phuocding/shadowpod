import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from './ui/Icon';
import { useToast } from './ui/Toast';
import { TranscriptPanel } from './Player/TranscriptPanel';
import { PlaybackControls } from './Player/PlaybackControls';
import { LoopToggle } from './Player/LoopToggle';
import { SpeedToggle } from './Player/SpeedToggle';
import { ModeSwitcher } from './Player/ModeSwitcher';
import { audioEngine } from '../services/audioEngine';
import { toggleFavorite, mergeSegments, splitSegment, restoreOriginalTranscript } from '../services/storage';
import { useSettingsStore } from '../stores/settingsStore';
import { usePlayerStore } from '../stores/playerStore';
import type { Segment, LoopMode, PlaybackSpeed } from '../types';

interface PlayerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDictation?: () => void;
}

export function PlayerSheet({ isOpen, onClose, onOpenDictation }: PlayerSheetProps) {
  const { loopMode, playbackSpeed, setLoopMode, setPlaybackSpeed } = useSettingsStore();
  const playerStore = usePlayerStore();
  const { currentAudio, isPlaying, currentTime, currentSegmentIndex } = playerStore;
  const { showToast, ToastComponent } = useToast();

  const [practiceMode, setPracticeMode] = useState<'shadow' | 'dictate'>('shadow');
  const [localIsPlaying, setLocalIsPlaying] = useState(isPlaying);
  const [localCurrentTime, setLocalCurrentTime] = useState(currentTime);
  const [localSegmentIndex, setLocalSegmentIndex] = useState(currentSegmentIndex);
  const [loopSegmentId, setLoopSegmentId] = useState<number | undefined>();
  const [isClosing, setIsClosing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(currentAudio?.isFavorite ?? false);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedSegments, setSelectedSegments] = useState<number[]>([]);
  const [splitModalSegment, setSplitModalSegment] = useState<Segment | null>(null);
  const [localTranscript, setLocalTranscript] = useState<Segment[]>(currentAudio?.transcript ?? []);

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  // Sync with playerStore
  useEffect(() => {
    setLocalIsPlaying(isPlaying);
    setLocalCurrentTime(currentTime);
    setLocalSegmentIndex(currentSegmentIndex);
    setIsFavorite(currentAudio?.isFavorite ?? false);
    setLocalTranscript(currentAudio?.transcript ?? []);
  }, [isPlaying, currentTime, currentSegmentIndex, currentAudio]);

  // Setup audio listeners when sheet opens
  useEffect(() => {
    if (!isOpen || !currentAudio) return;

    audioEngine.setOnTimeUpdate((time) => {
      setLocalCurrentTime(time);
      playerStore.setCurrentTime(time);

      if (currentAudio?.transcript) {
        const index = currentAudio.transcript.findIndex(
          (seg) => time >= seg.startTime && time < seg.endTime
        );
        if (index !== -1) {
          setLocalSegmentIndex(index);
          playerStore.setCurrentSegmentIndex(index);
        }
      }
    });

    audioEngine.setOnEnded(() => {
      if (loopMode === 'all') {
        audioEngine.seek(0);
        audioEngine.play();
      } else {
        setLocalIsPlaying(false);
        playerStore.pause();
        playerStore.nextTrack();
      }
    });

    audioEngine.setSpeed(playbackSpeed);
  }, [isOpen, currentAudio, loopMode, playbackSpeed, playerStore]);

  // Loop mode effect
  useEffect(() => {
    if (loopMode === 'sentence' && loopSegmentId !== undefined && currentAudio?.transcript) {
      const segment = currentAudio.transcript.find((s) => s.id === loopSegmentId);
      if (segment) {
        audioEngine.setLoop(segment.startTime, segment.endTime);
      }
    } else if (loopMode === 'all') {
      audioEngine.setLoop(null, null);
      audioEngine.setLoopAll(true);
    } else {
      audioEngine.setLoop(null, null);
      audioEngine.setLoopAll(false);
    }
  }, [loopMode, loopSegmentId, currentAudio]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    // Exit edit mode when closing
    setIsEditMode(false);
    setSelectedSegments([]);
    setSplitModalSegment(null);

    // Reset playback settings to defaults
    setLoopMode('none');
    setPlaybackSpeed('default');
    audioEngine.setLoop(null, null);
    audioEngine.setLoopAll(false);
    audioEngine.setSpeed('default');

    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose, setLoopMode, setPlaybackSpeed]);

  // Drag to dismiss handlers
  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    currentTranslateY.current = 0;
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (dragStartY.current === null) return;

    const deltaY = clientY - dragStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragStartY.current === null) return;

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

      if (currentTranslateY.current > 150) {
        sheetRef.current.style.transform = 'translateY(100%)';
        setTimeout(handleClose, 300);
      } else {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    }

    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [handleClose]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleDragStart(e.clientY);

    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const handleMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // Playback handlers
  const handlePlayPause = useCallback(() => {
    if (localIsPlaying) {
      audioEngine.pause();
      playerStore.pause();
    } else {
      audioEngine.play();
      playerStore.play();
    }
    setLocalIsPlaying(!localIsPlaying);
  }, [localIsPlaying, playerStore]);

  const handleSeek = useCallback((time: number) => {
    audioEngine.seek(time);
    setLocalCurrentTime(time);
    playerStore.setCurrentTime(time);
  }, [playerStore]);

  const handleSegmentClick = useCallback((segment: Segment) => {
    audioEngine.seek(segment.startTime);
    if (loopMode === 'sentence') {
      setLoopSegmentId(segment.id);
    }
    if (!localIsPlaying) {
      audioEngine.play();
      playerStore.play();
      setLocalIsPlaying(true);
    }
  }, [loopMode, localIsPlaying, playerStore]);

  const handleSpeedChange = useCallback((speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    audioEngine.setSpeed(speed);
  }, [setPlaybackSpeed]);

  const handleLoopChange = useCallback((mode: LoopMode) => {
    setLoopMode(mode);
    if (mode === 'sentence' && currentAudio?.transcript) {
      setLoopSegmentId(currentAudio.transcript[localSegmentIndex]?.id);
    } else {
      setLoopSegmentId(undefined);
    }
  }, [setLoopMode, currentAudio, localSegmentIndex]);

  const goToPrevSentence = useCallback(() => {
    if (!currentAudio?.transcript || localSegmentIndex <= 0) return;
    const prev = currentAudio.transcript[localSegmentIndex - 1];
    handleSegmentClick(prev);
  }, [currentAudio, localSegmentIndex, handleSegmentClick]);

  const goToNextSentence = useCallback(() => {
    if (!currentAudio?.transcript || localSegmentIndex >= currentAudio.transcript.length - 1) return;
    const next = currentAudio.transcript[localSegmentIndex + 1];
    handleSegmentClick(next);
  }, [currentAudio, localSegmentIndex, handleSegmentClick]);

  const copyTranscript = useCallback(() => {
    if (!currentAudio?.transcript) return;
    const text = currentAudio.transcript.map((s) => s.text).join('\n');
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  }, [currentAudio, showToast]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentAudio) return;
    await playerStore.toggleCurrentFavorite();
    setIsFavorite(!isFavorite);
  }, [currentAudio, isFavorite, playerStore]);

  const handleModeChange = useCallback((mode: 'shadow' | 'dictate') => {
    setPracticeMode(mode);
    if (mode === 'dictate' && onOpenDictation) {
      // Pause audio when switching to dictation
      if (localIsPlaying) {
        audioEngine.pause();
        playerStore.pause();
        setLocalIsPlaying(false);
      }
      onOpenDictation();
      setPracticeMode('shadow'); // Reset for next time
    }
  }, [onOpenDictation, localIsPlaying, playerStore]);

  // Edit Mode handlers
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => {
      const newEditMode = !prev;
      // Pause audio when entering edit mode
      if (newEditMode && localIsPlaying) {
        audioEngine.pause();
        playerStore.pause();
        setLocalIsPlaying(false);
      }
      return newEditMode;
    });
    setSelectedSegments([]);
    setSplitModalSegment(null);
  }, [localIsPlaying, playerStore]);

  const handleEditSegmentClick = useCallback((segment: Segment) => {
    if (!isEditMode) return;

    setSelectedSegments(prev => {
      if (prev.includes(segment.id)) {
        return prev.filter(id => id !== segment.id);
      }
      // Only allow selecting adjacent segments
      if (prev.length === 0) {
        return [segment.id];
      }
      const sorted = [...prev].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      if (segment.id === min - 1 || segment.id === max + 1) {
        return [...prev, segment.id];
      }
      // Start new selection
      return [segment.id];
    });
  }, [isEditMode]);

  const handleMerge = useCallback(async () => {
    if (!currentAudio || selectedSegments.length < 2) return;
    const newTranscript = await mergeSegments(currentAudio.id, selectedSegments);
    if (newTranscript) {
      setLocalTranscript(newTranscript);
      playerStore.updateCurrentTranscript(newTranscript);
      setSelectedSegments([]);
      showToast('Segments merged', 'success');
    }
  }, [currentAudio, selectedSegments, showToast, playerStore]);

  const handleSplitOpen = useCallback((segment: Segment) => {
    setSplitModalSegment(segment);
  }, []);

  const handleSplitConfirm = useCallback(async (wordIndex: number) => {
    if (!currentAudio || !splitModalSegment) return;
    const newTranscript = await splitSegment(currentAudio.id, splitModalSegment.id, wordIndex);
    if (newTranscript) {
      setLocalTranscript(newTranscript);
      playerStore.updateCurrentTranscript(newTranscript);
      setSplitModalSegment(null);
      showToast('Segment split', 'success');
    }
  }, [currentAudio, splitModalSegment, showToast, playerStore]);

  const handleRestore = useCallback(async () => {
    if (!currentAudio) return;
    const restored = await restoreOriginalTranscript(currentAudio.id);
    if (restored) {
      setLocalTranscript(restored);
      playerStore.updateCurrentTranscript(restored);
      setSelectedSegments([]);
      showToast('Transcript restored', 'success');
    } else {
      showToast('No changes to restore', 'info');
    }
  }, [currentAudio, showToast, playerStore]);

  if (!isOpen && !isClosing) return null;
  if (!currentAudio) return null;

  return (
    <div className="fixed inset-0 z-50">
      {ToastComponent}

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isClosing ? 'backdrop-exit' : 'backdrop-enter'}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 h-[92vh] bg-[var(--color-surface-container)] rounded-t-3xl flex flex-col ${isClosing ? 'sheet-exit' : 'sheet-enter'}`}
      >
        {/* Drag Handle */}
        <div
          className="shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-[var(--color-border-gray)] rounded-full mx-auto" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 shrink-0">
          <button onClick={handleClose} className="p-2 -ml-2">
            <Icon name="keyboard_arrow_down" className="text-[var(--color-text-base)]" size={28} />
          </button>
          <h1 className="text-lg font-bold text-[var(--color-text-base)] truncate mx-4 flex-1 text-center">
            {currentAudio.name}
          </h1>
          <button onClick={handleToggleFavorite} className="p-2">
            <Icon
              name="favorite"
              filled={isFavorite}
              className={isFavorite ? 'text-[var(--color-negative)]' : 'text-[var(--color-text-silver)]'}
            />
          </button>
          <button onClick={copyTranscript} className="p-2 -mr-2">
            <Icon name="content_copy" className="text-[var(--color-text-muted)]" />
          </button>
        </header>

        {/* Mode Switcher */}
        <div className="px-4 pt-2">
          <ModeSwitcher mode={practiceMode} onModeChange={handleModeChange} />
        </div>

        {/* Transcript */}
        <TranscriptPanel
          segments={localTranscript}
          currentSegmentIndex={localSegmentIndex}
          loopMode={loopMode}
          loopSegmentId={loopSegmentId}
          onSegmentClick={isEditMode ? handleEditSegmentClick : handleSegmentClick}
          isEditMode={isEditMode}
          selectedSegments={selectedSegments}
          onLongPress={isEditMode ? handleSplitOpen : undefined}
        />

        {/* Edit Mode Action Bar */}
        {isEditMode && (
          <div className="shrink-0 px-4 py-3 bg-[var(--color-surface-dark)] border-t border-[var(--color-border-gray)] flex justify-between items-center">
            <button
              onClick={handleRestore}
              className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
            >
              Restore All
            </button>
            <span className="text-sm text-[var(--color-text-muted)]">
              {selectedSegments.length > 0 ? `${selectedSegments.length} selected` : 'Tap to select'}
            </span>
            <button
              onClick={handleMerge}
              disabled={selectedSegments.length < 2}
              className={`px-4 py-2 text-sm rounded-full ${selectedSegments.length >= 2 ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)]'}`}
            >
              Merge
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="shrink-0 px-4 pb-6 pt-4 bg-[var(--color-surface-container)]">
          <div className="flex justify-center gap-4 mb-4">
            <LoopToggle mode={loopMode} onChange={handleLoopChange} />
            <SpeedToggle speed={playbackSpeed} onChange={handleSpeedChange} />
            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${isEditMode ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface-card)] text-[var(--color-text-muted)]'}`}
            >
              <Icon name={isEditMode ? 'check' : 'edit'} size={18} />
            </button>
          </div>
          <PlaybackControls
            isPlaying={localIsPlaying}
            currentTime={localCurrentTime}
            duration={currentAudio.duration}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onPrevSentence={goToPrevSentence}
            onNextSentence={goToNextSentence}
          />
        </div>

        {/* Split Modal */}
        {splitModalSegment && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
            <div className="bg-[var(--color-surface-container)] rounded-2xl p-4 mx-4 max-w-md w-full max-h-[60vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-[var(--color-text-base)] mb-2">Split segment</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">Tap a word to split before it</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {splitModalSegment.words.map((word, idx) => (
                  idx === 0 ? (
                    <span
                      key={idx}
                      className="px-2 py-1.5 text-[var(--color-text-muted)] bg-[var(--color-surface-card)] rounded-lg"
                    >
                      {word.text}
                    </span>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => handleSplitConfirm(idx)}
                      className="px-3 py-1.5 text-[var(--color-text-base)] bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/40 active:bg-[var(--color-primary)] active:text-[var(--color-on-primary)] rounded-lg transition-colors"
                    >
                      {word.text}
                    </button>
                  )
                ))}
              </div>
              <button
                onClick={() => setSplitModalSegment(null)}
                className="w-full py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
