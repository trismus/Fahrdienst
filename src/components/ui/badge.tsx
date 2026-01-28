import { HTMLAttributes, forwardRef } from 'react';
import type { RideStatus } from '@/types';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300',
      success: 'bg-success-light text-success-dark dark:bg-success-dark dark:text-success-light',
      warning: 'bg-warning-light text-warning-dark dark:bg-warning-dark dark:text-warning-light',
      danger: 'bg-error-light text-error-dark dark:bg-error-dark dark:text-error-light',
      info: 'bg-accent-50 text-accent-700 dark:bg-accent-900 dark:text-accent-100',
    };

    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge with German labels
const statusConfig: Record<RideStatus, { label: string; variant: BadgeProps['variant'] }> = {
  planned: { label: 'Geplant', variant: 'default' },
  confirmed: { label: 'Bestätigt', variant: 'info' },
  in_progress: { label: 'Unterwegs', variant: 'warning' },
  completed: { label: 'Abgeschlossen', variant: 'success' },
  cancelled: { label: 'Storniert', variant: 'danger' },
};

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: RideStatus;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const config = statusConfig[status];
    return (
      <Badge ref={ref} variant={config.variant} {...props}>
        {config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
