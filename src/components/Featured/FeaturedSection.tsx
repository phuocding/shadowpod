import { FeaturedCard } from './FeaturedCard';
import { getFeaturedContent } from '../../services/featuredContent';
import type { FeaturedAudio } from '../../types/featured';

interface FeaturedSectionProps {
  onSelectAudio: (audio: FeaturedAudio) => void;
}

export function FeaturedSection({ onSelectAudio }: FeaturedSectionProps) {
  const featuredContent = getFeaturedContent();

  return (
    <section className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold text-[var(--color-text-base)]">Featured</h2>
        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)]">
          FREE
        </span>
      </div>

      {/* Horizontal Scroll - edge to edge with proper padding */}
      <div className="overflow-x-auto scrollbar-hide -mx-4">
        <div className="flex gap-3 px-4 pb-2 snap-x snap-mandatory">
          {featuredContent.map((audio) => (
            <div key={audio.id} className="snap-start flex-shrink-0">
              <FeaturedCard
                audio={audio}
                onSelect={() => onSelectAudio(audio)}
              />
            </div>
          ))}
          {/* End padding spacer */}
          <div className="w-1 flex-shrink-0" />
        </div>
      </div>
    </section>
  );
}
