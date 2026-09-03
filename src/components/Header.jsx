'use client';

import { Menu } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Header({ onMenuClick }) {
    const { companyName, logo } = useSettings() || {};

    const displayName = companyName || 'InvoiceFlow';

    return (
        <header className="h-14 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 md:px-8 z-10 flex-shrink-0">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 md:hidden min-w-0 flex-1">
                <button
                    onClick={onMenuClick}
                    className="text-text-secondary hover:text-text-main transition-colors flex-shrink-0"
                >
                    <Menu size={22} />
                </button>
                <h2
                    className="text-base font-semibold text-text-main dark:text-white truncate"
                    title={displayName}
                >
                    {displayName}
                </h2>
            </div>

            {/* Desktop spacer */}
            <div className="hidden md:block flex-1" />

            {/* Right Side */}
            <div className="flex items-center gap-3">
                {logo ? (
                    <img
                        src={logo}
                        alt="Company Logo"
                        className="md:hidden size-7 rounded-full object-cover border border-border-light dark:border-border-dark"
                    />
                ) : (
                    <div className="md:hidden size-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                        {displayName.slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
        </header>
    );
}
