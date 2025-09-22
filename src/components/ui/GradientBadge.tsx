interface GradientBadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  size?: 'sm' | 'md';
  outline?: boolean;
}

const variantConfig = {
  primary: {
    filled: 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white',
    outline: 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 p-[1px] text-blue-600 dark:text-blue-400'
  },
  secondary: {
    filled: 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 text-white',
    outline: 'bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 p-[1px] text-emerald-600 dark:text-emerald-400'
  },
  accent: {
    filled: 'bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 text-white',
    outline: 'bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 p-[1px] text-purple-600 dark:text-purple-400'
  },
  neutral: {
    filled: 'bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 text-white',
    outline: 'bg-gradient-to-r from-slate-500 to-slate-600 dark:from-slate-400 dark:to-slate-500 p-[1px] text-slate-600 dark:text-slate-400'
  },
};

export function GradientBadge({ children, variant = 'neutral', size = 'md', outline = false }: GradientBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-2.5 py-1 text-sm';
  
  if (outline) {
    return (
      <span className={`inline-flex items-center rounded-full font-medium shadow-sm transition-all duration-200 hover:shadow-md ${variantConfig[variant].outline}`}>
        <span className={`bg-white dark:bg-slate-800 rounded-full ${sizeClasses}`}>
          {children}
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full font-medium shadow-sm transition-all duration-200 hover:shadow-md ${variantConfig[variant].filled} ${sizeClasses}`}>
      {children}
    </span>
  );
}