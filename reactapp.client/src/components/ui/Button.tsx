import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md max-w-xs mx-auto';

  const variantClasses = {
    primary: 'bg-gradient-to-b from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 focus:ring-green-300 active:from-green-600 active:to-green-800 border-2 border-green-500 hover:border-green-600 active:border-green-700',
    secondary: 'bg-gradient-to-b from-slate-200 to-slate-300 text-slate-900 hover:from-slate-300 hover:to-slate-400 focus:ring-slate-300 active:from-slate-400 active:to-slate-500 border-2 border-slate-400 hover:border-slate-500',
    outline: 'border-2 border-green-400 bg-white text-green-700 hover:bg-green-50 hover:border-green-500 focus:ring-green-300 active:border-green-600 shadow-lg',
    soft: 'bg-gradient-to-b from-emerald-100 to-emerald-200 text-emerald-700 hover:from-emerald-200 hover:to-emerald-300 focus:ring-emerald-300 active:from-emerald-300 active:to-emerald-400 border-2 border-emerald-300 hover:border-emerald-400',
  };

  const sizeClasses = {
    sm: 'px-6 py-3 text-sm min-h-[44px]',
    md: 'px-8 py-4 text-base min-h-[52px]',
    lg: 'px-10 py-5 text-lg min-h-[60px]',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-3" />}
      {children}
    </button>
  );
}