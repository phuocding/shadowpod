import type { FeaturedAudio } from '../types/featured';

// Tencent Product Management content
const FEATURED_CONTENT: FeaturedAudio[] = [
  {
    id: 'featured-tencent-needs',
    title: 'Defining Real Human Needs',
    description: 'How Tencent identifies user needs',
    level: 'beginner',
    levelLabel: 'Beginner',
    duration: 92,
    episodeCount: 1,
    audioUrl: '/featured/beginner.mp3',
    gradient: 'from-blue-500 to-cyan-400',
    isFeatured: true,
    transcript: [
      { id: 0, text: 'This is the brief on the core definition of real human needs.', startTime: 0, endTime: 4.0, words: [] },
      { id: 1, text: 'According to elite product management training from the tech giant Tencent, figuring out what humans actually need is literally the foundation of creating anything valuable, separating the massive successes from the total failures.', startTime: 4.08, endTime: 16.72, words: [] },
      { id: 2, text: 'First, a real human need is defined by actual usefulness.', startTime: 16.8, endTime: 20.72, words: [] },
      { id: 3, text: 'You know, think about a simple brick just sitting out in the dirt.', startTime: 20.8, endTime: 23.44, words: [] },
      { id: 4, text: 'Is that a product?', startTime: 23.44, endTime: 24.56, words: [] },
      { id: 5, text: 'Well, not really.', startTime: 24.56, endTime: 25.36, words: [] },
      { id: 6, text: 'So, what transforms a random object into a valuable solution?', startTime: 25.69, endTime: 29.29, words: [] },
      { id: 7, text: "It's the presence of a real need.", startTime: 29.45, endTime: 31.37, words: [] },
      { id: 8, text: 'If someone actually uses that brick to build a house, boom, it suddenly has use value.', startTime: 31.45, endTime: 36.49, words: [] },
      { id: 9, text: 'Second, you must distinguish real needs from fake needs, which are basically the exact opposite, just self indulgent design.', startTime: 36.65, endTime: 43.98, words: [] },
      { id: 10, text: 'Even massive tech companies fall into this trap all the time, right?', startTime: 44.07, endTime: 47.11, words: [] },
      { id: 11, text: 'They build these highly sophisticated, gorgeous things that completely bomb, because they only satisfy the creator.', startTime: 47.11, endTime: 52.55, words: [] },
      { id: 12, text: "Just because something is beautiful or technically impressive, doesn't mean a single person actually needs it.", startTime: 52.9, endTime: 58.1, words: [] },
      { id: 13, text: 'Finally, identifying real needs requires radical empathy and structured psychology.', startTime: 58.18, endTime: 63.46, words: [] },
      { id: 14, text: 'To find them, you basically have to become a totally clueless user and dig into those underlying psychological drivers.', startTime: 63.54, endTime: 69.81, words: [] },
      { id: 15, text: 'A really cool tool for this is the gamer motivation model, which breaks down our core human drives into specific buckets like action, social connection, mastery, and immersion.', startTime: 69.89, endTime: 78.69, words: [] },
      { id: 16, text: "It's like putting on different pairs of psychological glasses to see the hidden engines driving human behavior.", startTime: 78.98, endTime: 84.42, words: [] },
      { id: 17, text: 'Ultimately, defining a real human need means completely stripping away your own assumptions to find the true underlying problem that demands a useful solution.', startTime: 84.42, endTime: 92.26, words: [] },
    ],
  },
  {
    id: 'featured-tencent-playbook',
    title: 'Human-Centered Products',
    description: "Tencent's playbook for product design",
    level: 'intermediate',
    levelLabel: 'Intermediate',
    duration: 98,
    episodeCount: 1,
    audioUrl: '/featured/intermediate.mp3',
    gradient: 'from-purple-500 to-pink-400',
    isFeatured: true,
    transcript: [
      { id: 0, text: "This is the brief on Tencent's product management playbook.", startTime: 0, endTime: 4.0, words: [] },
      { id: 1, text: "This internal training from a tech giant reveals a simple truth: successful products aren't about stacking flashy features, they're about ruthlessly prioritizing actual human needs through empathy and rapid validation.", startTime: 4.08, endTime: 17.84, words: [] },
      { id: 2, text: '1st, if you strip away the marketing, a product is literally just a solution to a human need.', startTime: 17.99, endTime: 23.35, words: [] },
      { id: 3, text: 'Instead of getting bogged down in endless development phases, we condensed this life cycle into a practical 3 step method: find, compare, and test.', startTime: 23.59, endTime: 32.8, words: [] },
      { id: 4, text: "It's like tailoring a suit.", startTime: 33.12, endTime: 34.64, words: [] },
      { id: 5, text: 'You measure the client to find the fit, check materials against the market to compare, and do multiple fittings to test it, rather than just blindly sewing.', startTime: 34.8, endTime: 42.4, words: [] },
      { id: 6, text: '2nd, to test that fit, great product managers temporarily become foolish users to really evaluate usability.', startTime: 42.91, endTime: 49.95, words: [] },
      { id: 7, text: 'We have to ask, are we building this because the user actually needs it or just to show off?', startTime: 49.95, endTime: 54.99, words: [] },
      { id: 8, text: 'Think about WeChat.', startTime: 55.15, endTime: 56.11, words: [] },
      { id: 9, text: 'Despite countless features, they limit their bottom tab to just 4 items.', startTime: 56.54, endTime: 60.94, words: [] },
      { id: 10, text: "That's the less is more concept.", startTime: 61.02, endTime: 62.86, words: [] },
      { id: 11, text: 'Or take QQmail, which prevents errors by warning you if you type attached but completely forget the file.', startTime: 63.1, endTime: 68.86, words: [] },
      { id: 12, text: 'Finally, strict values and research keep everything on track.', startTime: 69.44, endTime: 73.36, words: [] },
      { id: 13, text: 'Techniques like AB testing and eye tracking let us see what users actually do, but core values guide those features.', startTime: 73.52, endTime: 80.4, words: [] },
      { id: 14, text: "When a wealthy user asked to pay to bypass WeChat's $8.88 RMB red envelope limit, the team flat out refused, proving fairness and user experience absolutely trump a quick buck.", startTime: 80.64, endTime: 92.07, words: [] },
      { id: 15, text: 'Ultimately, winning products are built on understanding the user so deeply that the technology feels completely invisible.', startTime: 92.39, endTime: 98.15, words: [] },
    ],
  },
  {
    id: 'featured-tencent-internal',
    title: 'Building Products at Tencent',
    description: 'Internal playbook deep dive',
    level: 'advanced',
    levelLabel: 'Advanced',
    duration: 1371,
    episodeCount: 1,
    audioUrl: '/featured/advanced.mp3',
    gradient: 'from-orange-500 to-amber-400',
    isFeatured: true,
    transcript: [
      {
        id: 0,
        text: 'Tencent internal playbook for building products.',
        startTime: 0,
        endTime: 4.0,
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
