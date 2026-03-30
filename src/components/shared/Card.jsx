import React from 'react';

const paddingStyles = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
}) {
  return (
    <div
      className={[
        'rounded-[var(--radius,0.75rem)] border border-[var(--border,#e5e7eb)]',
        'bg-[var(--bg-card,#ffffff)]',
        'transition-shadow duration-200',
        hover && 'hover:shadow-md cursor-pointer',
        paddingStyles[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
