const GITHUB_API = 'https://api.github.com/repos/phuocding/shadowpod/releases/latest';
const CACHE_KEY = 'shadowpod_release_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface GitHubRelease {
  version: string;
  releaseNotes: string;
  publishedAt: string;
  url: string;
}

interface CachedRelease {
  data: GitHubRelease;
  cachedAt: number;
}

export async function getLatestRelease(): Promise<GitHubRelease | null> {
  // Check cache first
  const cached = getFromCache();
  if (cached) return cached;

  try {
    const response = await fetch(GITHUB_API, {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });

    if (!response.ok) {
      console.warn('[GitHub] Failed to fetch release:', response.status);
      return null;
    }

    const data = await response.json();
    const release: GitHubRelease = {
      version: data.tag_name?.replace(/^v/, '') || 'unknown',
      releaseNotes: data.body || '',
      publishedAt: data.published_at || '',
      url: data.html_url || '',
    };

    // Cache the result
    saveToCache(release);
    return release;
  } catch (error) {
    console.warn('[GitHub] Error fetching release:', error);
    return null;
  }
}

function getFromCache(): GitHubRelease | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cached: CachedRelease = JSON.parse(raw);
    if (Date.now() - cached.cachedAt > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cached.data;
  } catch {
    return null;
  }
}

function saveToCache(data: GitHubRelease): void {
  try {
    const cached: CachedRelease = { data, cachedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore cache errors
  }
}
