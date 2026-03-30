import React from 'react';

const variantStyles = {
  primary:
    'text-white shadow-sm hover:opacity-90 active:opacity-80',
  secondary:
    'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300',
  outline:
    'bg-transparent border-2 hover:opacity-80 active:opacity-70',
  ghost:
    'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10',
  danger:
    'bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-base rounded-lg gap-2',
  lg: 'px-6 py-3 text-lg rounded-xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled = false,
  onClick,
  ...rest
}) {
  const accentBg = variant === 'primary' ? 'bg-[var(--accent,#6366f1)]' : '';
  const accentBorder = variant === 'outline' ? 'border-[var(--accent,#6366f1)] text-[var(--accent,#6366f1)]' : '';
  const accentText = variant === 'ghost' ? 'text-[var(--accent,#6366f1)]' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#6366f1)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeStyles[size],
        variantStyles[variant],
        accentBg,
        accentBorder,
        accentText,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
