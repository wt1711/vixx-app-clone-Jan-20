import { useEffect, useState } from 'react';
import { useUrlPreview } from 'react-native-preview-url';

export type LinkPreviewData = {
  url: string;
  title?: string;
  description?: string;
  images?: string[];
  siteName?: string;
  favicon?: string;
};

type CacheEntry = {
  data: LinkPreviewData | null;
  timestamp: number;
};

type OEmbedResponse = {
  title?: string;
  author_name?: string;
  provider_name?: string;
  thumbnail_url?: string;
  html?: string;
};

const previewCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Platform detection patterns (for oEmbed)
const PLATFORM_PATTERNS = {
  tiktok: /tiktok\.com/i,
  twitter: /(?:twitter\.com|x\.com)/i,
  vimeo: /vimeo\.com/i,
} as const;

// Video URL patterns - used to determine if we should hide the link text
// Note: Instagram/Facebook excluded - require Graph API auth, show as regular links
const VIDEO_URL_PATTERNS = [
  /youtube\.com\/(?:watch|shorts|embed)/i,
  /youtu\.be\//i,
  /tiktok\.com/i,
  /vimeo\.com/i,
];

type Platform = keyof typeof PLATFORM_PATTERNS;

export function isVideoUrl(url: string): boolean {
  return VIDEO_URL_PATTERNS.some((pattern) => pattern.test(url));
}

function detectPlatform(url: string): Platform | null {
  for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
    if (pattern.test(url)) {
      return platform as Platform;
    }
  }
  return null;
}

function getOEmbedEndpoint(platform: Platform, url: string): string {
  const encodedUrl = encodeURIComponent(url);
  switch (platform) {
    case 'tiktok':
      return `https://www.tiktok.com/oembed?url=${encodedUrl}`;
    case 'twitter':
      return `https://publish.twitter.com/oembed?url=${encodedUrl}`;
    case 'vimeo':
      return `https://vimeo.com/api/oembed.json?url=${encodedUrl}`;
  }
}

async function fetchOEmbed(url: string): Promise<LinkPreviewData | null> {
  const platform = detectPlatform(url);
  if (!platform) return null;

  try {
    const endpoint = getOEmbedEndpoint(platform, url);
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const data: OEmbedResponse = await response.json();

    return {
      url,
      title: data.title || data.author_name,
      description: data.author_name ? `by ${data.author_name}` : undefined,
      images: data.thumbnail_url ? [data.thumbnail_url] : undefined,
      siteName: data.provider_name,
    };
  } catch {
    return null;
  }
}

function getCachedPreview(url: string): LinkPreviewData | null | undefined {
  const entry = previewCache.get(url);
  if (!entry) return undefined;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    previewCache.delete(url);
    return undefined;
  }

  return entry.data;
}

function setCachedPreview(url: string, data: LinkPreviewData | null): void {
  previewCache.set(url, { data, timestamp: Date.now() });
}

export function useLinkPreview(url: string | null): {
  preview: LinkPreviewData | null;
  loading: boolean;
  error: Error | null;
} {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if this URL needs oEmbed (for platforms the library doesn't handle well)
  const platform = url ? detectPlatform(url) : null;

  // Use the library hook for non-oEmbed URLs
  const {
    loading: libLoading,
    data: libData,
    error: libError,
  } = useUrlPreview(url && !platform ? url : '', 5000);

  // Handle URL changes and oEmbed fetching
  useEffect(() => {
    if (!url) {
      setPreview(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Check cache first
    const cached = getCachedPreview(url);
    if (cached !== undefined) {
      setPreview(cached);
      setLoading(false);
      setError(null);
      return;
    }

    // If it's a platform that needs oEmbed, fetch it
    if (platform) {
      setLoading(true);
      setError(null);

      fetchOEmbed(url)
        .then((data) => {
          setCachedPreview(url, data);
          setPreview(data);
          setLoading(false);
        })
        .catch((err) => {
          setCachedPreview(url, null);
          setError(err);
          setPreview(null);
          setLoading(false);
        });
    }
  }, [url, platform]);

  // Handle library data for non-oEmbed URLs
  useEffect(() => {
    if (!url || platform) return;

    if (libData) {
      const previewData: LinkPreviewData = {
        url: libData.url,
        title: libData.title,
        description: libData.description,
        images: libData.images,
        siteName: libData.siteName,
        favicon: libData.favicons?.[0],
      };
      setCachedPreview(url, previewData);
      setPreview(previewData);
      setError(null);
    } else if (libError) {
      setCachedPreview(url, null);
      setError(new Error(libError));
      setPreview(null);
    }
  }, [url, platform, libData, libError]);

  // Update loading state from library
  useEffect(() => {
    if (!platform && url) {
      setLoading(libLoading);
    }
  }, [libLoading, platform, url]);

  return { preview, loading, error };
}

export function clearLinkPreviewCache(): void {
  previewCache.clear();
}
