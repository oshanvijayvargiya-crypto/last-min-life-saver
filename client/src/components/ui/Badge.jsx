import React from 'react';
import clsx from 'clsx';

export const Badge = ({ children, className, variant = 'info', ...props }) => {
  const variantStyles = {
    primary: "bg-accentPurple/10 text-accentPurple border border-accentPurple/30",
    secondary: "bg-accentBlue/10 text-accentBlue border border-accentBlue/30",
    success: "bg-success/10 text-success border border-success/30",
    warning: "bg-warning/10 text-warning border border-warning/30",
    danger: "bg-danger/10 text-danger border border-danger/30",
    info: "bg-white/5 text-textMuted border border-white/10"
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
