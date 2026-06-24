import type { FeaturedAudio } from '../types/featured';

// Test data using LibriVox public domain audio from archive.org
const FEATURED_CONTENT: FeaturedAudio[] = [
  {
    id: 'featured-aesop-fable-19',
    title: "Aesop's Fable",
    description: 'Classic short story - Beginner',
    level: 'beginner',
    levelLabel: 'A1-A2',
    duration: 90,
    episodeCount: 1,
    audioUrl: 'https://dn711007.ca.archive.org/0/items/aesops_fables_-_new_translation_1407_librivox/aesops_fables_-_new_translation_19_aesop_64kb.mp3',
    gradient: 'from-blue-500 to-teal-400',
    isFeatured: true,
    transcript: [
      {
        id: 0,
        text: 'This is a classic fable from Aesop.',
        startTime: 0,
        endTime: 3.0,
        words: [],
      },
      {
        id: 1,
        text: 'Listen carefully and repeat after the narrator.',
        startTime: 3.5,
        endTime: 7.0,
        words: [],
      },
    ],
  },
  {
    id: 'featured-aesop-intro',
    title: "Aesop's Fables Intro",
    description: 'Introduction to the collection',
    level: 'intermediate',
    levelLabel: 'B1-B2',
    duration: 120,
    episodeCount: 1,
    audioUrl: 'https://dn711007.ca.archive.org/0/items/aesops_fables_-_new_translation_1407_librivox/aesops_fables_-_new_translation_00_aesop_128kb.mp3',
    gradient: 'from-purple-500 to-indigo-400',
    isFeatured: true,
    transcript: [
      {
        id: 0,
        text: 'Welcome to Aesop\'s Fables, a new translation.',
        startTime: 0,
        endTime: 4.0,
        words: [],
      },
      {
        id: 1,
        text: 'These timeless stories teach valuable lessons.',
        startTime: 4.5,
        endTime: 8.0,
        words: [],
      },
    ],
  },
  {
    id: 'featured-aesop-fable-06',
    title: 'The Fable Collection',
    description: 'Advanced vocabulary & pacing',
    level: 'advanced',
    levelLabel: 'C1-C2',
    duration: 180,
    episodeCount: 1,
    audioUrl: 'https://dn711007.ca.archive.org/0/items/aesops_fables_-_new_translation_1407_librivox/aesops_fables_-_new_translation_06_aesop_128kb.mp3',
    gradient: 'from-orange-500 to-red-400',
    isFeatured: true,
    transcript: [
      {
        id: 0,
        text: 'This fable explores deeper themes and moral lessons.',
        startTime: 0,
        endTime: 5.0,
        words: [],
      },
      {
        id: 1,
        text: 'Pay attention to the vocabulary and sentence structure.',
        startTime: 5.5,
        endTime: 10.0,
        words: [],
      },
    ],
  },
];

export function getFeaturedContent(): FeaturedAudio[] {
  return FEATURED_CONTENT;
}

export function getFeaturedById(id: string): FeaturedAudio | null {
  return FEATURED_CONTENT.find((audio) => audio.id === id) || null;
}

export function isFeaturedAudio(audio: unknown): audio is FeaturedAudio {
  return (
    typeof audio === 'object' &&
    audio !== null &&
    'isFeatured' in audio &&
    (audio as FeaturedAudio).isFeatured === true
  );
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
