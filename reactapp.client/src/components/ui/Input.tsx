import React, { forwardRef } from 'react';
import { HiExclamationTriangle, HiInformationCircle } from 'react-icons/hi2';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-700 mb-3 text-center"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={`
            block w-full px-6 py-6 border-0 rounded-xl text-slate-900 text-center font-semibold
            placeholder:text-slate-400 placeholder:font-normal
            transition-all duration-200 ease-out
            focus:ring-4 focus:ring-opacity-20
            disabled:bg-slate-50 disabled:text-slate-500
            shadow-sm hover:shadow-md focus:shadow-md
            bg-white min-h-[80px] leading-tight
            ${className}
          `}
          style={{ fontSize: '32px', lineHeight: '1.2' }}
          placeholder="09012345678"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${inputId}-error` : 
          helperText ? `${inputId}-helper` : undefined
        }
          {...props}
        />
      </div>
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p id={`${inputId}-error`} className="text-sm text-red-700 font-medium flex items-center justify-center gap-2" role="alert">
            <HiExclamationTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}
      {helperText && !error && (
        <div className="mt-2 p-3 bg-slate-50 rounded-lg">
          <p id={`${inputId}-helper`} className="text-sm text-slate-600 flex items-center justify-center gap-2">
            <HiInformationCircle className="h-4 w-4 text-slate-500 flex-shrink-0" />
            {helperText}
          </p>
        </div>
      )}
    </div>
  );
});