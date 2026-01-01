export function StatusBadge({ status }) {
    const statusStyles = {
        paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600',
        sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
        expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
        cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600',
    };

    const style = statusStyles[status.toLowerCase()] || statusStyles.draft;

    return (
        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export function KPICard({ icon: Icon, iconBgColor, title, value, trend, trendValue, trendLabel }) {
    const isPositiveTrend = trend === 'up';

    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-border-light dark:border-border-dark shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${iconBgColor}`}>
                    <Icon size={24} />
                </div>
                {trendValue && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${isPositiveTrend
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}>
                        {trendValue}
                    </span>
                )}
                {trendLabel && !trendValue && (
                    <span className="text-text-secondary dark:text-gray-500 text-xs font-medium">
                        {trendLabel}
                    </span>
                )}
            </div>
            <div>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-text-main dark:text-white mt-1">{value}</h3>
            </div>
        </div>
    );
}

export function Button({ children, variant = 'primary', icon: Icon, onClick, className = '', ...props }) {
    const variants = {
        primary: 'bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md',
        secondary: 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${variants[variant]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={18} className={variant === 'secondary' ? 'text-text-secondary' : ''} />}
            {children}
        </button>
    );
}
