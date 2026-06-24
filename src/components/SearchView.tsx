import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { getFeaturedContent } from '../services/featuredContent';
import { formatTime } from '../utils/formatTime';
import type { AudioRecord } from '../types';
import type { FeaturedAudio } from '../types/featured';

interface SearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  userAudios: AudioRecord[];
  onSelectUserAudio: (audio: AudioRecord) => void;
  onSelectFeaturedAudio: (audio: FeaturedAudio) => void;
  onDeleteAudio?: (audio: AudioRecord) => void;
  onToggleFavorite?: (audio: AudioRecord) => void;
}

type SearchResult =
  | { type: 'user'; audio: AudioRecord }
  | { type: 'featured'; audio: FeaturedAudio };

export function SearchView({
  isOpen,
  onClose,
  userAudios,
  onSelectUserAudio,
  onSelectFeaturedAudio,
  onDeleteAudio,
  onToggleFavorite,
}: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);
  const featuredAudios = getFeaturedContent();

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // Clear query when closed
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  // Search through both featured and user audios
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    // Search featured audios
    featuredAudios.forEach(audio => {
      if (
        audio.title.toLowerCase().includes(lowerQuery) ||
        audio.description.toLowerCase().includes(lowerQuery) ||
        audio.levelLabel.toLowerCase().includes(lowerQuery)
      ) {
        matches.push({ type: 'featured', audio });
      }
    });

    // Search user audios
    userAudios.forEach(audio => {
      if (audio.name.toLowerCase().includes(lowerQuery)) {
        matches.push({ type: 'user', audio });
      }
    });

    return matches;
  }, [query, featuredAudios, userAudios]);

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent, audioId: string) => {
    touchStartX.current = e.touches[0].clientX;
    if (swipedId && swipedId !== audioId) {
      setSwipedId(null);
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, audioId: string) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    const threshold = 60;

    if (diff < -threshold) {
      setSwipedId(audioId);
      setSwipeDirection('left');
    } else if (diff > threshold) {
      setSwipedId(audioId);
      setSwipeDirection('right');
    } else {
      setSwipedId(null);
      setSwipeDirection(null);
    }
  };

  const resetSwipe = () => {
    setSwipedId(null);
    setSwipeDirection(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--color-background)] z-50 flex flex-col overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[var(--color-primary)]/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[var(--color-primary)]/10 blur-[120px] rounded-full" />
      </div>

      {/* Header with search input */}
      <header className="sticky top-0 z-10 flex items-center gap-4 px-4 h-16 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex-1 flex items-center bg-[var(--color-surface-container)] rounded-xl px-4 py-2.5 border border-white/5 group focus-within:border-[var(--color-primary)]/50 transition-all">
          <Icon
            name="search"
            size={20}
            className="mr-3 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-primary)] transition-colors"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audio..."
            className="flex-1 bg-transparent text-[var(--color-text-base)] placeholder-[var(--color-text-muted)]/50 outline-none border-none p-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-base)] transition-colors"
            >
              <Icon name="close" size={18} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-[var(--color-primary)] font-semibold text-sm hover:opacity-80 transition-opacity"
        >
          Cancel
        </button>
      </header>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!query.trim() ? (
          // Empty state - not typing yet
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            {/* Decorative icon with glow */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[var(--color-primary)]/10 blur-[60px] rounded-full scale-150" />
              <div className="relative w-32 h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center">
                <Icon name="manage_search" size={64} className="text-[var(--color-text-muted)]/40" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-base)] mb-2">
              Type to search your audio library
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] max-w-[240px] mb-8">
              Search in Featured and Your Library
            </p>

            {/* Category Filter Chips */}
            <div className="w-full max-w-sm">
              <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                Explore by Level
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['A1-A2', 'B1-B2', 'C1-C2'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setQuery(level)}
                    className="px-4 py-2 rounded-full border border-[var(--color-border-gray)] text-[var(--color-text-base)] text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] hover:border-transparent transition-all active:scale-95"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : results.length === 0 ? (
          // No results
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            {/* Decorative icon with glow */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[var(--color-primary)]/10 blur-[60px] rounded-full scale-150 opacity-50" />
              <div className="relative w-32 h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.15)]">
                <Icon name="search_off" size={64} className="text-[var(--color-text-muted)]/40" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-base)] mb-2">
              No audio found for "{query}"
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-[280px]">
              Try a different search term or browse our featured collection.
            </p>
            {/* CTA Button */}
            <button
              onClick={onClose}
              className="w-full max-w-sm px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold rounded-xl active:scale-[0.98] transition-transform hover:brightness-110 mb-6"
            >
              Browse Featured
            </button>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              <button
                onClick={() => setQuery('A1-A2')}
                className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-left hover:bg-white/10 transition-colors group"
              >
                <Icon name="bolt" size={24} className="text-[var(--color-primary)] mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Beginner
                </span>
              </button>
              <button
                onClick={() => setQuery('B1-B2')}
                className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-left hover:bg-white/10 transition-colors group"
              >
                <Icon name="trending_up" size={24} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                  Intermediate
                </span>
              </button>
            </div>
          </div>
        ) : (
          // Results list
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            {results.map((result) => (
              result.type === 'featured' ? (
                // Compact Featured Card (Spotify-style)
                <button
                  key={`featured-${result.audio.id}`}
                  onClick={() => {
                    onSelectFeaturedAudio(result.audio);
                    onClose();
                  }}
                  className="w-full bg-[#181818] rounded-lg p-4 flex items-center gap-4 hover:bg-[#282828] transition-colors text-left group"
                >
                  {/* Thumbnail with badge */}
                  <div className="w-16 h-16 relative shrink-0 rounded-md overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-blue-600 opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon name="podcasts" size={28} className="text-white opacity-60" />
                    </div>
                    <span className="absolute top-1 left-1 bg-[#1ed760] text-black text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                      FREE
                    </span>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-[16px] truncate">
                      {result.audio.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[#b3b3b3] text-[14px]">
                      <span>{formatTime(result.audio.duration)}</span>
                      <span>•</span>
                      <span>{result.audio.level === 'beginner' ? 'Beginner' : result.audio.level === 'intermediate' ? 'Intermediate' : 'Advanced'}</span>
                    </div>
                  </div>
                  {/* Play button */}
                  <button className="w-10 h-10 rounded-full bg-[#1ed760] flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Icon name="play_arrow" size={24} className="text-black" filled />
                  </button>
                </button>
              ) : (
                // Swipeable User Card
                <div
                  key={`user-${result.audio.id}`}
                  className="relative overflow-hidden rounded-lg"
                >
                  {/* Action buttons behind */}
                  <div className="absolute inset-y-0 left-0 w-20 bg-[#1ed760] flex items-center justify-center">
                    <Icon name={result.audio.isFavorite ? "heart_minus" : "favorite"} size={24} className="text-white" filled={result.audio.isFavorite} />
                  </div>
                  <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center">
                    <Icon name="delete" size={24} className="text-white" />
                  </div>

                  {/* Slideable card content */}
                  <div
                    className={`relative bg-[#181818] p-4 flex items-center gap-4 transition-transform duration-200 ${
                      swipedId === result.audio.id
                        ? swipeDirection === 'left'
                          ? '-translate-x-20'
                          : 'translate-x-20'
                        : ''
                    }`}
                    onTouchStart={(e) => handleTouchStart(e, result.audio.id)}
                    onTouchEnd={(e) => handleTouchEnd(e, result.audio.id)}
                    onClick={() => {
                      if (swipedId === result.audio.id) {
                        if (swipeDirection === 'left' && onDeleteAudio) {
                          onDeleteAudio(result.audio);
                          resetSwipe();
                        } else if (swipeDirection === 'right' && onToggleFavorite) {
                          onToggleFavorite(result.audio);
                          resetSwipe();
                        }
                      } else {
                        onSelectUserAudio(result.audio);
                        onClose();
                      }
                    }}
                  >
                    {/* Icon with badge */}
                    <div className="w-16 h-16 bg-[#282828] flex items-center justify-center shrink-0 rounded-md relative">
                      <Icon name="graphic_eq" size={28} className="text-[#b3b3b3]" />
                      <span className="absolute top-1 left-1 bg-white/10 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                        YOUR
                      </span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-bold text-[16px] truncate">
                        {result.audio.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[#b3b3b3] text-[14px]">
                        <span>{formatTime(result.audio.duration)}</span>
                        <span>•</span>
                        <span>{new Date(result.audio.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {/* Favorite indicator */}
                    {result.audio.isFavorite && (
                      <Icon name="favorite" size={20} className="text-[#1ed760] shrink-0" filled />
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
