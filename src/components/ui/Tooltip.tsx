import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  key?: React.Key;
}

export default function Tooltip({ 
  content, 
  children, 
  className, 
  position = 'top', 
  delay = 0 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return '-top-2 left-1/2 -translate-x-1/2 -translate-y-full';
      case 'bottom':
        return '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full';
      case 'left':
        return 'top-1/2 -left-2 -translate-x-full -translate-y-1/2';
      case 'right':
        return 'top-1/2 -right-2 translate-x-full -translate-y-1/2';
      default:
        return '-top-2 left-1/2 -translate-x-1/2 -translate-y-full';
    }
  };

  const getAnimationProps = () => {
    switch (position) {
      case 'top':
        return { initial: { opacity: 0, y: -5, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -5, scale: 0.95 } };
      case 'bottom':
        return { initial: { opacity: 0, y: 5, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 5, scale: 0.95 } };
      case 'left':
        return { initial: { opacity: 0, x: -5, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -5, scale: 0.95 } };
      case 'right':
        return { initial: { opacity: 0, x: 5, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: 5, scale: 0.95 } };
      default:
        return { initial: { opacity: 0, y: -5, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -5, scale: 0.95 } };
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            {...getAnimationProps()}
            transition={{ duration: 0.15, delay: delay / 1000 }}
            className={cn(
              "absolute z-50 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-xl pointer-events-none whitespace-normal max-w-[200px] text-center sm:whitespace-nowrap sm:max-w-none",
              getPositionClasses(),
              className
            )}
          >
            {content}
            <div 
              className={cn(
                "absolute w-2 h-2 bg-slate-900 rotate-45",
                position === 'top' && "bottom-[-4px] left-1/2 -translate-x-1/2",
                position === 'bottom' && "top-[-4px] left-1/2 -translate-x-1/2",
                position === 'left' && "right-[-4px] top-1/2 -translate-y-1/2",
                position === 'right' && "left-[-4px] top-1/2 -translate-y-1/2"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
