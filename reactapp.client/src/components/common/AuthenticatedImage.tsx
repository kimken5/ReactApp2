import React from 'react';
import { useAuthenticatedImage } from '../../hooks/useAuthenticatedImage';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Image component that fetches images with authentication headers
 * Useful for protected image endpoints that require JWT tokens
 */
export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({
  src,
  alt,
  style,
  className,
  onLoad,
  onError
}) => {
  const { blobUrl, loading, error } = useAuthenticatedImage(src);

  React.useEffect(() => {
    if (error && onError) {
      onError();
    } else if (blobUrl && onLoad) {
      onLoad();
    }
  }, [blobUrl, error, onLoad, onError]);

  if (loading) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0'
        }}
        className={className}
      >
        <span style={{ color: '#888', fontSize: '12px' }}>読込中...</span>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8d7da',
          color: '#721c24'
        }}
        className={className}
      >
        <span style={{ fontSize: '12px' }}>画像エラー</span>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      style={style}
      className={className}
    />
  );
};
