import { useEffect, useRef, useState } from 'react';
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

const previewCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
  const [cachedPreview, setCachedPreviewState] = useState<LinkPreviewData | null | undefined>(() =>
    url ? getCachedPreview(url) : null,
  );
  const prevUrlRef = useRef(url);

  // Use the library hook - it only accepts string, so pass empty string when null
  const { loading: libLoading, data, error: libError } = useUrlPreview(url || '', 5000);

  // Check cache when URL changes
  useEffect(() => {
    if (url !== prevUrlRef.current) {
      prevUrlRef.current = url;
      if (url) {
        const cached = getCachedPreview(url);
        setCachedPreviewState(cached);
      } else {
        setCachedPreviewState(null);
      }
    }
  }, [url]);

  // When library returns data, cache it
  useEffect(() => {
    if (data && url) {
      const previewData: LinkPreviewData = {
        url: data.url,
        title: data.title,
        description: data.description,
        images: data.images,
        siteName: data.siteName,
        favicon: data.favicons?.[0],
      };
      setCachedPreview(url, previewData);
      setCachedPreviewState(previewData);
    } else if (libError && url) {
      setCachedPreview(url, null);
      setCachedPreviewState(null);
    }
  }, [data, libError, url]);

  // If we have cached data, return it immediately
  if (cachedPreview !== undefined && cachedPreview !== null) {
    return { preview: cachedPreview, loading: false, error: null };
  }

  // No URL provided
  if (!url) {
    return { preview: null, loading: false, error: null };
  }

  // Return library state
  const preview: LinkPreviewData | null = data
    ? {
        url: data.url,
        title: data.title,
        description: data.description,
        images: data.images,
        siteName: data.siteName,
        favicon: data.favicons?.[0],
      }
    : null;

  return {
    preview,
    loading: libLoading,
    error: libError ? new Error(libError) : null,
  };
}

export function clearLinkPreviewCache(): void {
  previewCache.clear();
}
