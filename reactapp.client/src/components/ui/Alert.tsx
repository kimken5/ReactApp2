import React from 'react';
import { HiXMark, HiExclamationTriangle, HiCheckCircle, HiExclamationCircle, HiInformationCircle } from 'react-icons/hi2';

interface AlertProps {
  variant?: 'error' | 'success' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  onClose, 
  className = '' 
}: AlertProps) {
  const baseClasses = 'rounded-lg border p-4 shadow-sm transition-all duration-200 ease-out';
  
  const variantClasses = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const iconComponents = {
    error: HiExclamationTriangle,
    success: HiCheckCircle,
    warning: HiExclamationCircle,
    info: HiInformationCircle,
  };

  const iconColors = {
    error: 'text-red-500',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  const IconComponent = iconComponents[variant];

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent 
            className={`w-5 h-5 ${iconColors[variant]}`}
            aria-hidden="true"
          />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-semibold mb-2">
              {title}
            </h3>
          )}
          <div className="text-sm leading-relaxed">
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className="inline-flex rounded-lg p-1.5 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
              onClick={onClose}
              aria-label="閉じる"
            >
              <HiXMark className="w-4 h-4 text-slate-500 hover:text-slate-700" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}