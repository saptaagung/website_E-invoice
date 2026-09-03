'use client';

export function StatusBadge({ status }) {
    const statusStyles = {
        paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        pending: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        overdue: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        sent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        rejected: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        partial: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        expired: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    };
    const style = statusStyles[status.toLowerCase()] || statusStyles.draft;
    return (
        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-medium ${style}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export function KPICard({ icon: Icon, iconBgColor, title, value, trend, trendValue, trendLabel }) {
    const isPositiveTrend = trend === 'up';
    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-lg p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className={`p-1.5 rounded-md ${iconBgColor}`}>
                    <Icon size={20} />
                </div>
                {trendValue && (
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded-md flex items-center gap-1 ${isPositiveTrend
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                        {trendValue}
                    </span>
                )}
                {trendLabel && !trendValue && (
                    <span className="text-text-secondary dark:text-gray-500 text-xs">
                        {trendLabel}
                    </span>
                )}
            </div>
            <div>
                <p className="text-text-secondary dark:text-gray-400 text-xs">{title}</p>
                <h3 className="text-xl font-semibold text-text-main dark:text-white mt-0.5 font-mono tabular-nums">{value}</h3>
            </div>
        </div>
    );
}

export function Button({ children, variant = 'primary', icon: Icon, onClick, className = '', ...props }) {
    const variants = {
        primary: 'bg-primary hover:bg-primary-dark text-white',
        secondary: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800',
    };
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={16} className={variant === 'secondary' ? 'text-text-secondary' : ''} />}
            {children}
        </button>
    );
}
