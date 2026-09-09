'use client';

import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export function AudioVisualizer({ audioRef, isPlaying }: AudioVisualizerProps): JSX.Element {
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
        analyser.fftSize = 256;

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

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLength) * 1.8;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArrayRef.current[i] / 255) * HEIGHT * 0.8;

        const gradient = ctx.createLinearGradient(0, HEIGHT - barHeight, 0, HEIGHT);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

        x += barWidth + 2;
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
      width={1600}
      height={80}
      className="w-full h-20"
    />
  );
}
