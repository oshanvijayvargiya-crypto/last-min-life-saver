import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Card = ({ children, className, onClick, animateHover = false, ...props }) => {
  const Component = onClick ? motion.div : 'div';
  const interactionProps = onClick
    ? {
        whileHover: animateHover ? { scale: 1.02, translateY: -2 } : {},
        whileTap: animateHover ? { scale: 0.98 } : {},
        onClick
      }
    : {};

  return (
    <Component
      className={clsx(
        'glass-panel p-6 rounded-2xl text-textPrimary shadow-xl relative overflow-hidden transition-colors duration-300',
        onClick && 'cursor-pointer hover:border-accentPurple/30',
        className
      )}
      {...interactionProps}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
