interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  tone?: 'ink' | 'moss' | 'ochre' | 'rust';
}

const toneMap: Record<NonNullable<ProgressBarProps['tone']>, string> = {
  ink: 'bg-ink-700',
  moss: 'bg-moss-600',
  ochre: 'bg-ochre-600',
  rust: 'bg-rust-600',
};

// Plain, square progress bar — no rounded pills, no gradients.
export function ProgressBar({ value, className = '', tone = 'ink' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={`h-2 w-full border border-ink-300 bg-paper ${className}`}>
      <div className={`h-full ${toneMap[tone]}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
