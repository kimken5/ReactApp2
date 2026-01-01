import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseAuthenticatedImageResult {
  blobUrl: string | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch images that require authentication
 * Converts the image response to a blob URL for display
 */
export const useAuthenticatedImage = (src: string): UseAuthenticatedImageResult => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch the image with authentication headers
        const response = await axios.get(src, {
          responseType: 'blob',
          // Axios automatically includes JWT token from interceptors
        });

        if (cancelled) return;

        // Create blob URL
        objectUrl = URL.createObjectURL(response.data);
        setBlobUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load image'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    // Cleanup function
    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return { blobUrl, loading, error };
};
