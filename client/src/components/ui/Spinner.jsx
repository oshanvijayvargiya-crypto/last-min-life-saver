import React from 'react';
import clsx from 'clsx';

export const Spinner = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4"
  };

  return (
    <div className={clsx("flex justify-center items-center", className)}>
      <div
        className={clsx(
          "animate-spin rounded-full border-t-accentPurple border-r-transparent border-b-accentBlue border-l-transparent",
          sizeClasses[size]
        )}
      />
    </div>
  );
};

export default Spinner;
