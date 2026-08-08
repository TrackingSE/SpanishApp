import { useEffect, useRef, useState } from 'react';
import { isTTSSupported, speakSpanish, cancelSpeech } from '../lib/speech';

// A small "play this aloud" button in the field-notebook style. Speaks the
// given Spanish text via the Web Speech API. Renders nothing when the browser
// has no text-to-speech, so callers can drop it in unconditionally.

interface SpeakButtonProps {
  text: string;
  /** 'icon' = compact round glyph; 'labeled' = glyph + word. */
  variant?: 'icon' | 'labeled';
  label?: string;
  /** Slower playback for careful listening. */
  slow?: boolean;
  className?: string;
  title?: string;
}

export function SpeakButton({
  text,
  variant = 'icon',
  label = 'Listen',
  slow = false,
  className = '',
  title,
}: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelSpeech();
    };
  }, []);

  if (!isTTSSupported()) return null;

  function handleClick() {
    if (speaking) {
      cancelSpeech();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakSpanish(text, {
      rate: slow ? 0.7 : 0.9,
      onEnd: () => {
        if (mounted.current) setSpeaking(false);
      },
    });
  }

  const base =
    'inline-flex items-center gap-1 rounded-sm border font-mono uppercase tracking-wider transition ' +
    (speaking
      ? 'border-ochre-500 bg-ochre-100 text-ochre-700'
      : 'border-ink-300 text-ink-600 hover:border-ink-500');

  if (variant === 'labeled') {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={title ?? 'Play in Spanish'}
        aria-label={title ?? 'Play in Spanish'}
        className={`${base} px-2 py-0.5 text-[11px] ${className}`}
      >
        <span aria-hidden>{speaking ? '■' : '▶'}</span>
        {speaking ? 'Stop' : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title ?? 'Play in Spanish'}
      aria-label={title ?? 'Play in Spanish'}
      className={`${base} h-7 w-7 justify-center text-sm ${className}`}
    >
      <span aria-hidden>{speaking ? '■' : '♪'}</span>
    </button>
  );
}
