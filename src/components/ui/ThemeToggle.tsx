import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <SunIcon className={`h-5 w-5 transition-all duration-300 ${theme === 'dark' ? 'rotate-180 scale-0' : 'rotate-0 scale-100'} absolute`} />
      <MoonIcon className={`h-5 w-5 transition-all duration-300 ${theme === 'light' ? 'rotate-180 scale-0' : 'rotate-0 scale-100'} absolute`} />
    </button>
  );
}