import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon = '',
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <span className="text-5xl mb-4 block" aria-hidden="true">
          {icon}
        </span>
      )}

      <h3 className="text-lg font-semibold text-[var(--text-primary,#111827)] mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-[var(--text-secondary,#6b7280)] max-w-sm mb-6">
          {description}
        </p>
      )}

      {action && (
        <Button
          variant={action.variant || 'primary'}
          size="md"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
