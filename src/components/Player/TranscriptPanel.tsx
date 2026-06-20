import { useRef, useEffect } from 'react';
import type { Segment, LoopMode } from '../../types';
import { SentenceLine } from './SentenceLine';

interface TranscriptPanelProps {
  segments: Segment[];
  currentSegmentIndex: number;
  loopMode: LoopMode;
  loopSegmentId?: number;
  onSegmentClick: (segment: Segment) => void;
  isEditMode?: boolean;
  selectedSegments?: number[];
  onLongPress?: (segment: Segment) => void;
}

export function TranscriptPanel({
  segments,
  currentSegmentIndex,
  loopMode,
  loopSegmentId,
  onSegmentClick,
  isEditMode = false,
  selectedSegments = [],
  onLongPress,
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSegmentIndex]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto hide-scrollbar px-4 py-6 space-y-2"
    >
      {segments.map((segment, index) => (
        <div
          key={segment.id}
          ref={index === currentSegmentIndex ? activeRef : undefined}
        >
          <SentenceLine
            segment={segment}
            isActive={index === currentSegmentIndex}
            isLooping={loopMode === 'sentence' && loopSegmentId === segment.id}
            isSelected={selectedSegments.includes(segment.id)}
            isEditMode={isEditMode}
            onClick={() => onSegmentClick(segment)}
            onLongPress={onLongPress ? () => onLongPress(segment) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
