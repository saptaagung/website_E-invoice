import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    FileQuestion,
    Users,
    Settings,
    LogOut,
    X
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/quotations', icon: FileQuestion, label: 'Quotations' },
    { to: '/invoices', icon: FileText, label: 'Invoices' },
    { to: '/clients', icon: Users, label: 'Clients' },
];

export default function Sidebar({ isOpen, onClose }) {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar - Desktop always visible, Mobile slide-out */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 bg-surface-light dark:bg-surface-dark 
                border-r border-border-light dark:border-border-dark 
                flex-shrink-0 flex flex-col h-full
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>
                {/* Logo */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h1 className="text-text-main dark:text-white text-lg font-bold leading-tight">InvoiceFlow</h1>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive
                                    ? 'bg-primary/10 text-primary font-semibold'
                                    : 'text-text-secondary hover:bg-background-light hover:text-text-main dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </NavLink>
                    ))}

                    <div className="my-4 border-t border-border-light dark:border-border-dark"></div>

                    <NavLink
                        to="/settings"
                        onClick={onClose}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-semibold'
                                : 'text-text-secondary hover:bg-background-light hover:text-text-main dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                            }`
                        }
                    >
                        <Settings size={20} />
                        <span className="text-sm font-medium">Settings</span>
                    </NavLink>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-background-light dark:hover:bg-gray-800 cursor-pointer">
                        <div
                            className="size-8 rounded-full bg-cover bg-center bg-primary/20"
                            style={{ backgroundImage: "url('https://api.dicebear.com/7.x/initials/svg?seed=JD')" }}
                        ></div>
                        <div className="flex flex-col flex-1">
                            <p className="text-sm font-medium text-text-main dark:text-white">Jane Doe</p>
                            <p className="text-xs text-text-secondary dark:text-gray-400">Admin</p>
                        </div>
                        <button className="text-text-secondary hover:text-red-500 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
