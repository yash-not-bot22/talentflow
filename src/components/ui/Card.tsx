import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hover = false, padding = 'md', onClick, style }, ref) => {
    const baseClasses = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 shadow-soft transition-all duration-200';
    
    const hoverClasses = hover ? 'hover:shadow-lift hover:-translate-y-1 cursor-pointer' : '';
    
    const classes = [
      baseClasses,
      paddingClasses[padding],
      hoverClasses,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div 
        ref={ref}
        style={style}
        className={classes} 
        onClick={onClick}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';