'use client';

import { useRef, useState } from 'react';

interface NameInputProps {
  initial?: string;
  placeholder?: string;
  className?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

/** Autofocused one-line input: Enter/blur submits, Escape (or empty) cancels. */
export function NameInput({ initial = '', placeholder, className, onSubmit, onCancel }: NameInputProps): JSX.Element {
  const [value, setValue] = useState(initial);
  const done = useRef(false);

  const finish = (submit: boolean): void => {
    if (done.current) return;
    done.current = true;
    const name = value.trim();
    if (submit && name && name !== initial) onSubmit(name);
    else onCancel();
  };

  return (
    <input
      autoFocus
      value={value}
      placeholder={placeholder}
      maxLength={60}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true);
        else if (e.key === 'Escape') finish(false);
      }}
      onBlur={() => finish(true)}
      className={className}
    />
  );
}
