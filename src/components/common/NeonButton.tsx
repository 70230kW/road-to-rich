import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'gradient' | 'ghost' | 'danger' | 'success';
interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

/** Keep the existing API; shared actions now use one quiet, semantic hierarchy. */
export function NeonButton({ variant = 'primary', children, className = '', type = 'button', ...rest }: NeonButtonProps) {
  const tone = variant === 'danger' ? 'danger' : variant === 'ghost' ? 'secondary' : 'primary';
  return <button {...rest} type={type} className={`league-action league-action-${tone} ${className}`}>{children}</button>;
}
