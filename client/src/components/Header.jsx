import { Search, Bell, Menu } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function Header({ onMenuClick }) {
    const { companyName, logo, loading } = useSettings() || {};

    // Show company name or fallback to InvoiceFlow
    const displayName = companyName || 'InvoiceFlow';

    return (
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 md:px-8 py-3 z-10 flex-shrink-0">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden min-w-0 flex-1">
                <button
                    onClick={onMenuClick}
                    className="text-text-secondary hover:text-text-main transition-colors flex-shrink-0"
                >
                    <Menu size={24} />
                </button>
                <h2
                    className="text-lg font-bold text-text-main dark:text-white truncate"
                    title={displayName}
                >
                    {displayName}
                </h2>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex items-center max-w-md w-full">
                <label className="flex items-center w-full bg-background-light dark:bg-gray-800 rounded-xl px-3 py-2 border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                    <Search size={20} className="text-text-secondary dark:text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari dokumen, klien..."
                        className="bg-transparent border-none text-sm w-full ml-2 text-text-main dark:text-white placeholder:text-text-secondary dark:placeholder:text-gray-500 focus:ring-0 focus:outline-none"
                    />
                </label>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                <button className="flex items-center justify-center size-10 rounded-xl hover:bg-background-light dark:hover:bg-gray-800 text-text-secondary dark:text-gray-400 transition-colors relative">
                    <Bell size={24} />
                    <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border border-surface-light dark:border-surface-dark"></span>
                </button>

                {/* Mobile Avatar - Show company logo if available */}
                {logo ? (
                    <img
                        src={logo}
                        alt="Company Logo"
                        className="md:hidden size-8 rounded-full object-cover border border-border-light dark:border-border-dark"
                    />
                ) : (
                    <div
                        className="md:hidden size-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold"
                    >
                        {displayName.slice(0, 2).toUpperCase()}
                    </div>
                )}
            </div>
        </header>
    );
}
