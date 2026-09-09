'use client';

import { motion } from 'framer-motion';
import { PlaybackMod } from '@/types';

interface ModSelectorProps {
  mod: PlaybackMod;
  onChange: (mod: PlaybackMod) => void;
}

const OPTIONS: { value: PlaybackMod; label: string; hint: string }[] = [
  { value: 'none', label: '1.0x', hint: 'Normal speed' },
  { value: 'dt', label: 'DT', hint: 'Double Time · 1.5x' },
];

export function ModSelector({ mod, onChange }: ModSelectorProps): JSX.Element {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
      {OPTIONS.map((opt) => {
        const active = mod === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.hint}
            className={`relative px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              active ? 'text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {active && (
              <motion.span
                layoutId="mod-active"
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
