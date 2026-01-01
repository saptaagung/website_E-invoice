import { Search, Bell, Menu } from 'lucide-react';

export default function Header({ onMenuClick }) {
    return (
        <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 md:px-8 py-3 z-10 flex-shrink-0">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 lg:hidden">
                <button
                    onClick={onMenuClick}
                    className="text-text-secondary hover:text-text-main transition-colors"
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-lg font-bold text-text-main dark:text-white">InvoiceFlow</h2>
            </div>

            {/* Desktop Search */}
            <div className="hidden lg:flex items-center max-w-md w-full">
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

                {/* Mobile Avatar */}
                <div
                    className="lg:hidden size-8 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: "url('https://api.dicebear.com/7.x/initials/svg?seed=JD')" }}
                ></div>
            </div>
        </header>
    );
}
