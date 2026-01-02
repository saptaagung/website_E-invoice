import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    FileQuestion,
    Users,
    Settings,
    LogOut,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/quotations', icon: FileQuestion, label: 'Penawaran' },
    { to: '/invoices', icon: FileText, label: 'Faktur' },
    { to: '/clients', icon: Users, label: 'Klien' },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const { companyName, logo } = useSettings() || {};
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = () => {
        logout();
        navigate('/login');
    };

    const handleLogoutCancel = () => {
        setShowLogoutConfirm(false);
    };

    // Get user initials for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const userInitials = getInitials(user?.name);

    // Display name with fallback
    const displayName = companyName || 'InvoiceFlow';

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">Konfirmasi Keluar</h3>
                        <p className="text-sm text-text-secondary mb-6">Apakah Anda yakin ingin keluar dari akun Anda?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleLogoutCancel}
                                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main dark:hover:text-white rounded-lg hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleLogoutConfirm}
                                className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                            >
                                Ya, Keluar
                            </button>
                        </div>
                    </div>
                </div>
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
                {/* Logo & Company Name */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Company Logo or Default Icon */}
                        {logo ? (
                            <img
                                src={logo}
                                alt="Logo"
                                className="size-8 rounded-lg object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white flex-shrink-0">
                                <FileText size={20} />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h1
                                className="text-text-main dark:text-white text-lg font-bold leading-tight truncate"
                                title={displayName}
                            >
                                {displayName}
                            </h1>
                        </div>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-background-light dark:hover:bg-gray-800 transition-colors flex-shrink-0"
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
                        <span className="text-sm font-medium">Pengaturan</span>
                    </NavLink>
                </nav>

                {/* User Profile - Clickable for logout */}
                <div className="p-4 border-t border-border-light dark:border-border-dark">
                    <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors group"
                    >
                        {/* User Avatar - Show company logo if available */}
                        {logo ? (
                            <img
                                src={logo}
                                alt="Logo"
                                className="size-8 rounded-full object-cover flex-shrink-0"
                            />
                        ) : (
                            <div
                                className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0"
                            >
                                {userInitials}
                            </div>
                        )}
                        <div className="flex flex-col flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-text-main dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">{user?.name || 'Pengguna'}</p>
                            <p className="text-xs text-text-secondary dark:text-gray-400 truncate">{user?.email || ''}</p>
                        </div>
                        <div className="text-text-secondary group-hover:text-red-500 transition-colors flex-shrink-0">
                            <LogOut size={18} />
                        </div>
                    </button>
                </div>
            </aside>
        </>
    );
}
