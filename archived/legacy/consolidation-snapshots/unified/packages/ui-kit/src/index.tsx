import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';

export function Container({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 ${className}`}
      {...props}
    />
  );
}

export function Button({
  tone = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger';
}) {
  const tones = {
    primary: 'bg-marine text-ivoire hover:bg-marine-3',
    secondary:
      'border border-marine bg-transparent text-marine hover:bg-marine hover:text-ivoire',
    quiet: 'bg-transparent text-marine hover:bg-sable/45',
    danger: 'border border-red-700 text-red-800 hover:bg-red-50',
  };
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-s px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'danger';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-sable/60 text-marine',
    accent: 'bg-champ-pale text-marine',
    success: 'bg-emerald-50 text-emerald-800',
    danger: 'bg-red-50 text-red-800',
  };
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-s px-2 text-[11px] font-bold uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  inverted = false,
  className = '',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between ${className}`}
    >
      <div className="max-w-3xl">
        {eyebrow && (
          <p
            className={`text-xs font-bold uppercase ${inverted ? 'text-champ' : 'text-champ-dark'}`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`mt-2 font-disp text-4xl font-semibold leading-none sm:text-5xl ${inverted ? 'text-ivoire' : 'text-marine'}`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-4 max-w-2xl leading-7 ${inverted ? 'text-txt-1' : 'text-dk-2'}`}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const id = props.id ?? props.name;
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;
  return (
    <label className={`grid gap-2 text-sm font-semibold text-marine ${className}`}>
      <span>{label}</span>
      <input
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`min-h-12 w-full rounded-s border bg-blanc px-3 font-normal outline-none transition focus:border-champ-dark focus:ring-2 focus:ring-champ/25 ${
          error ? 'border-red-700' : 'border-sable-dark'
        }`}
      />
      {error ? (
        <span id={`${id}-error`} role="alert" className="text-xs text-red-800">
          {error}
        </span>
      ) : hint ? (
        <span id={`${id}-hint`} className="text-xs font-normal text-dk-2">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-80 max-w-xl flex-col items-center justify-center px-5 text-center">
      {icon && (
        <span className="mb-5 grid h-12 w-12 place-items-center rounded-s bg-champ-pale text-champ-dark">
          {icon}
        </span>
      )}
      <h2 className="font-disp text-4xl font-semibold text-marine">{title}</h2>
      <p className="mt-3 leading-7 text-dk-2">{description}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-s bg-sable/70 ${className}`}
    />
  );
}
