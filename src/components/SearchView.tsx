import { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './ui/Icon';
import { AudioCard } from './Library/AudioCard';
import { FeaturedCard } from './Featured/FeaturedCard';
import { getFeaturedContent } from '../services/featuredContent';
import type { AudioRecord } from '../types';
import type { FeaturedAudio } from '../types/featured';

interface SearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  userAudios: AudioRecord[];
  onSelectUserAudio: (audio: AudioRecord) => void;
  onSelectFeaturedAudio: (audio: FeaturedAudio) => void;
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
}: SearchViewProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--color-background)] z-50 flex flex-col">
      {/* Header with search input */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border-gray)]">
        <button
          onClick={onClose}
          className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
          <Icon name="arrow_back" size={24} />
        </button>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search audio..."
            className="w-full bg-[var(--color-surface-card)] text-[var(--color-text-base)] placeholder-[var(--color-text-muted)] rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            >
              <Icon name="close" size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {!query.trim() ? (
          // Empty state - not typing yet
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon name="search" size={48} className="text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-muted)]">Type to search your audio library</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Search in Featured and Your Library
            </p>
          </div>
        ) : results.length === 0 ? (
          // No results
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icon name="search_off" size={48} className="text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-muted)]">No audio found for "{query}"</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Try a different search term
            </p>
          </div>
        ) : (
          // Results list
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            </p>
            {results.map((result) => (
              result.type === 'featured' ? (
                <div key={`featured-${result.audio.id}`} className="relative">
                  <span className="absolute -top-2 left-2 z-10 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-medium rounded-full">
                    FREE
                  </span>
                  <FeaturedCard
                    audio={result.audio}
                    onSelect={() => {
                      onSelectFeaturedAudio(result.audio);
                      onClose();
                    }}
                  />
                </div>
              ) : (
                <div key={`user-${result.audio.id}`} className="relative">
                  <span className="absolute -top-2 left-2 z-10 px-2 py-0.5 bg-[var(--color-primary)] text-white text-[10px] font-medium rounded-full">
                    YOUR
                  </span>
                  <AudioCard
                    audio={result.audio}
                    onDelete={() => {}}
                    onToggleFavorite={() => {}}
                    onOpenSheet={() => {
                      onSelectUserAudio(result.audio);
                      onClose();
                    }}
                  />
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
