import { useState, useEffect, useRef, useCallback, memo, CSSProperties } from "react";

interface RetryableImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

export const RetryableImage = memo(({ src, alt, className, style }: RetryableImageProps) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Reset state when src changes
    setImgSrc(src);
    setRetryCount(0);
    setError(false);
    
    // Clear any existing timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [src]);
  
  const handleError = useCallback(() => {
    if (retryCount < 3) {
      console.log(`Image load failed for ${src}, retrying (${retryCount + 1}/3) in 5 seconds...`);
      // Wait 5 seconds before retrying
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        // Force reload by appending a timestamp
        setImgSrc(`${src}?retry=${Date.now()}`);
      }, 5000);
    } else {
      console.log(`Image load failed for ${src} after 3 retries, using placeholder.`);
      // After 3 retries, show placeholder
      setError(true);
    }
  }, [retryCount, src]);
  
  return (
    <img
      src={error ? '/placeholder.png' : imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
}); 