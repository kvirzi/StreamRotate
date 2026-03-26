import { ReactNode } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-accent-orange hover:bg-accent-orange-hover text-white shadow-lg shadow-orange-900/20',
    secondary: 'bg-bg-hover border border-bg-border text-text-primary hover:border-accent-orange/40 hover:bg-bg-card',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
    danger: 'bg-red-900/30 border border-red-800/50 text-red-400 hover:bg-red-900/50',
    teal: 'bg-accent-teal hover:bg-accent-teal-hover text-white shadow-lg shadow-teal-900/20',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
}
