import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Button = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyle = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accentPurple/50 select-none overflow-hidden active:scale-95";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base"
  };

  const variantStyles = {
    primary: "bg-gradient-to-r from-accentPurple to-accentBlue text-white hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]",
    secondary: "glass-input text-textPrimary hover:bg-white/10 hover:border-white/20",
    success: "bg-success text-white hover:bg-emerald-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    danger: "bg-danger text-white hover:bg-rose-600 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    glass: "bg-white/5 border border-white/10 text-textPrimary hover:bg-white/10"
  };

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(
        baseStyle,
        sizeStyles[size],
        variantStyles[variant],
        (disabled || loading) && "opacity-50 cursor-not-allowed active:scale-100",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};

export default Button;
