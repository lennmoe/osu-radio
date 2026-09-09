'use client';

import { useEffect, useRef, useState } from 'react';

interface ProgressBarVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export function ProgressBarVisualizer({ audioRef, isPlaying }: ProgressBarVisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    const initAudioContext = (): void => {
      if (analyserRef.current || !audio) return;

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audio);
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 128;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    if (!isInitialized && isPlaying) {
      initAudioContext();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (): void => {
      if (!analyserRef.current || !dataArrayRef.current || !ctx) return;

      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const bufferLength = analyserRef.current.frequencyBinCount;

      animationIdRef.current = requestAnimationFrame(draw);

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const barWidth = WIDTH / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * HEIGHT;

        ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + (dataArrayRef.current[i] / 255) * 0.6})`;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    if (isPlaying && isInitialized) {
      draw();
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [audioRef, isPlaying, isInitialized]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={4}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
