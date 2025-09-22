import { CheckCircleIcon, XCircleIcon, ArchiveBoxIcon } from '@heroicons/react/24/solid';

interface StatusPillProps {
  status: 'active' | 'archived' | 'inactive';
  size?: 'sm' | 'md';
}

const statusConfig = {
  active: {
    label: 'Active',
    icon: CheckCircleIcon,
    className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  },
  archived: {
    label: 'Archived',
    icon: ArchiveBoxIcon,
    className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
  },
  inactive: {
    label: 'Inactive',
    icon: XCircleIcon,
    className: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  },
};

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1.5 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border transition-all duration-200 ${config.className} ${sizeClasses}`}>
      <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />
      {config.label}
    </span>
  );
}