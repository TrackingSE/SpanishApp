import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: string | (() => void);
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  const navigate = useNavigate();

  function handleBack() {
    if (typeof back === 'function') back();
    else if (typeof back === 'string') navigate(back);
    else navigate(-1);
  }

  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {back !== undefined && (
          <button
            onClick={handleBack}
            className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-900"
          >
            <span aria-hidden>&larr;</span> Back
          </button>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
