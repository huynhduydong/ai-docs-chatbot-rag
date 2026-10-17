"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Reveals `text` progressively to simulate token streaming. Long answers speed up
 * so the whole animation stays under ~2.5s.
 */
export function useTypewriter(text: string, active: boolean, onDone?: () => void, onTick?: () => void) {
  const [length, setLength] = useState(active ? 0 : text.length);
  const callbacks = useRef({ onDone, onTick });

  useEffect(() => {
    callbacks.current = { onDone, onTick };
  });

  useEffect(() => {
    if (!active) {
      setLength(text.length);
      return;
    }
    let i = 0;
    const step = Math.max(2, Math.ceil(text.length / 150));
    const timer = setInterval(() => {
      i = Math.min(text.length, i + step);
      // Finish the current word (up to a few chars) for a token-like feel.
      for (let extra = 0; extra < 8 && i < text.length && /\S/.test(text[i]); extra++) i++;
      setLength(i);
      callbacks.current.onTick?.();
      if (i >= text.length) {
        clearInterval(timer);
        callbacks.current.onDone?.();
      }
    }, 16);
    return () => clearInterval(timer);
  }, [text, active]);

  return { shown: text.slice(0, length), typing: active && length < text.length };
}
