'use client';

import { useEffect, useState, memo } from 'react';

interface AnimatedBackgroundProps {
  imageUrl: string;
}

function AnimatedBackgroundComponent({ imageUrl }: AnimatedBackgroundProps): JSX.Element {
  const [currentImage, setCurrentImage] = useState(imageUrl);
  const [nextImage, setNextImage] = useState(imageUrl);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (imageUrl === currentImage) return;

    setNextImage(imageUrl);
    setIsTransitioning(true);

    const timer = setTimeout(() => {
      setCurrentImage(imageUrl);
      setIsTransitioning(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [imageUrl, currentImage]);

  return (
    <>
      <div
        className="fixed inset-0 bg-cover bg-center transition-opacity duration-1000"
        style={{
          backgroundImage: `url(${currentImage})`,
          filter: 'blur(6px) brightness(0.5)',
          transform: 'translate3d(0, 0, 0) scale(1.08)',
          willChange: 'opacity',
          opacity: isTransitioning ? 0 : 1,
        }}
      />
      
      {isTransitioning && (
        <div
          className="fixed inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${nextImage})`,
            filter: 'blur(10px) brightness(0.6)',
            transform: 'translate3d(0, 0, 0) scale(1.1)',
            willChange: 'opacity',
            opacity: 1,
          }}
        />
      )}

      <div className="fixed inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50 pointer-events-none" />
    </>
  );
}

export const AnimatedBackground = memo(AnimatedBackgroundComponent);
