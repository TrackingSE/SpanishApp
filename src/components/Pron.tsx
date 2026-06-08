import { usePronMode } from '../hooks/usePronMode';
import type { PronunciationSupport } from '../types';

// Shared pronunciation display. Honours the user's support level (Part 7):
//   off   -> nothing
//   basic -> English-style respelling only
//   full  -> respelling + IPA + stress + warnings

export interface PronData {
  pronunciation?: string;
  ipa?: string;
  syllables?: string;
  stress?: string;
  notes?: string[];
}

/** One-line respelling, e.g. under a Spanish word in a list. */
export function PronInline({ data, mode }: { data: PronData; mode?: PronunciationSupport }) {
  const auto = usePronMode();
  const m = mode ?? auto;
  if (m === 'off' || !data.pronunciation) return null;
  return (
    <span className="font-mono text-[11px] tracking-wide text-ochre-700">
      {data.pronunciation}
      {m === 'full' && data.ipa && <span className="ml-2 text-ink-400">{data.ipa}</span>}
    </span>
  );
}

/** Stacked block: respelling, then IPA, stress and notes in full mode. */
export function Pron({
  data,
  mode,
  showNotes = true,
  className = '',
}: {
  data: PronData;
  mode?: PronunciationSupport;
  showNotes?: boolean;
  className?: string;
}) {
  const auto = usePronMode();
  const m = mode ?? auto;
  if (m === 'off' || !data.pronunciation) return null;

  const notes = data.notes ?? [];
  return (
    <div className={`space-y-0.5 ${className}`}>
      <p className="font-mono text-[12px] tracking-wide text-ochre-700">{data.pronunciation}</p>
      {m === 'full' && data.ipa && (
        <p className="font-mono text-[11px] text-ink-400">
          {data.ipa}
          {data.stress && <span className="ml-2 text-ink-500">· {data.stress}</span>}
        </p>
      )}
      {m === 'full' && showNotes && notes.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {notes.map((n, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-ink-500">
              <span className="text-rust-500">!</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
