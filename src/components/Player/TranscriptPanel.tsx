import { useRef, useEffect, useState, useCallback } from 'react';
import type { Segment, LoopMode } from '../../types';
import { SentenceLine } from './SentenceLine';
import { FloatingMenu } from './FloatingMenu';

interface TranscriptPanelProps {
  segments: Segment[];
  currentSegmentIndex: number;
  loopMode: LoopMode;
  loopSegmentId?: number;
  onSegmentClick: (segment: Segment) => void;
  isEditMode?: boolean;
  selectedSegments?: number[];
  pendingMergeSegmentId?: number;
  onSplit?: (segment: Segment) => void;
  onMerge?: (segment: Segment) => void;
  onCancelMerge?: () => void;
}

export function TranscriptPanel({
  segments,
  currentSegmentIndex,
  loopMode,
  loopSegmentId,
  onSegmentClick,
  isEditMode = false,
  selectedSegments = [],
  pendingMergeSegmentId,
  onSplit,
  onMerge,
  onCancelMerge,
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [menuSegment, setMenuSegment] = useState<Segment | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, segmentHeight: 0 });

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeRef.current && containerRef.current && !isEditMode) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentSegmentIndex, isEditMode]);

  // Close menu when exiting edit mode
  useEffect(() => {
    if (!isEditMode) {
      setMenuSegment(null);
    }
  }, [isEditMode]);

  const handleSegmentClick = useCallback((segment: Segment, e: React.MouseEvent | React.TouchEvent) => {
    if (isEditMode) {
      // If there's a pending merge (segment already selected), forward to parent for merge
      if (selectedSegments.length > 0) {
        onSegmentClick(segment);
        return;
      }
      // Otherwise show floating menu
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const relativeY = rect.top - containerRect.top + (containerRef.current?.scrollTop || 0);
        setMenuPosition({
          x: rect.left + rect.width / 2 - containerRect.left,
          y: relativeY,
          segmentHeight: rect.height,
        });
      }
      setMenuSegment(segment);
    } else {
      onSegmentClick(segment);
    }
  }, [isEditMode, selectedSegments, onSegmentClick]);

  const handleSplit = useCallback(() => {
    if (menuSegment && onSplit) {
      onSplit(menuSegment);
      setMenuSegment(null);
    }
  }, [menuSegment, onSplit]);

  const handleMerge = useCallback(() => {
    if (menuSegment && onMerge) {
      onMerge(menuSegment);
      setMenuSegment(null);
    }
  }, [menuSegment, onMerge]);

  const handleMenuClose = useCallback(() => {
    setMenuSegment(null);
  }, []);

  // Calculate adjacent segment IDs for merge targeting (direct calculation, no memoization)
  let prevId: number | null = null;
  let nextId: number | null = null;

  if (pendingMergeSegmentId !== undefined && pendingMergeSegmentId !== null) {
    const idx = segments.findIndex(s => s.id === pendingMergeSegmentId);
    if (idx !== -1) {
      prevId = idx > 0 ? segments[idx - 1].id : null;
      nextId = idx < segments.length - 1 ? segments[idx + 1].id : null;
    }
  }

  // Handle click on container to cancel merge
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current && pendingMergeSegmentId && onCancelMerge) {
      onCancelMerge();
    }
  }, [pendingMergeSegmentId, onCancelMerge]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto hide-scrollbar px-4 py-6 space-y-2 relative"
      onClick={handleContainerClick}
    >
      {/* Floating Menu */}
      {menuSegment && (
        <FloatingMenu
          position={menuPosition}
          onSplit={handleSplit}
          onMerge={handleMerge}
          onClose={handleMenuClose}
        />
      )}

      {segments.map((segment, index) => {
        const isMergeTarget = (pendingMergeSegmentId != null) && (segment.id === prevId || segment.id === nextId);
        const isDimmed = (pendingMergeSegmentId != null) && segment.id !== pendingMergeSegmentId && !isMergeTarget;

        return (
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
              isMergeTarget={!!isMergeTarget}
              isDimmed={!!isDimmed}
              onClick={(e: React.MouseEvent) => handleSegmentClick(segment, e)}
            />
          </div>
        );
      })}
    </div>
  );
}
