import React from 'react';
import clsx from 'clsx';

export const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className,
  error,
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-textMuted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={clsx(
          "glass-input px-4 py-2.5 rounded-xl text-sm w-full focus:outline-none focus:border-accentPurple focus:ring-2 focus:ring-accentPurple/25 transition-all duration-200",
          error && "border-danger focus:ring-danger/25",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-danger font-medium mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
