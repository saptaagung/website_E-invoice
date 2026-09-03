'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, FileQuestion, Users, Settings, LogOut, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const mainNav = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
];
const docNav = [
    { to: '/quotations', icon: FileQuestion, label: 'Penawaran' },
    { to: '/invoices', icon: FileText, label: 'Faktur' },
    { to: '/clients', icon: Users, label: 'Klien' },
];

function NavItem({ to, icon: Icon, label, onClose }) {
    const pathname = usePathname();
    const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);
    return (
        <Link href={to} onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                isActive
                    ? 'border-l-2 border-primary bg-primary/5 text-primary font-medium -ml-px'
                    : 'text-text-secondary hover:bg-background-light hover:text-text-main dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
        >
            <Icon size={18} /><span>{label}</span>
        </Link>
    );
}

function NavSection({ label, children }) {
    return (
        <div>
            <p className="px-3 mb-1.5 text-[10px] font-medium uppercase tracking-widest text-text-secondary/60 dark:text-gray-500">{label}</p>
            <div className="flex flex-col gap-0.5">{children}</div>
        </div>
    );
}

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const { companyName, logo } = useSettings() || {};
    const router = useRouter();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const handleLogoutConfirm = async () => { await logout(); router.push('/login'); };
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };
    const userInitials = getInitials(user?.name);
    const displayName = companyName || 'InvoiceFlow';

    return (
        <>
            {isOpen && (<div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />)}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark shadow-lg p-6 max-w-sm w-full">
                        <h3 className="text-base font-semibold text-text-main dark:text-white mb-2">Konfirmasi Keluar</h3>
                        <p className="text-sm text-text-secondary mb-5">Apakah Anda yakin ingin keluar?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-main rounded-lg hover:bg-background-light dark:hover:bg-gray-800 transition-colors">Batal</button>
                            <button onClick={handleLogoutConfirm} className="px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">Keluar</button>
                        </div>
                    </div>
                </div>
            )}
            <aside className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex-shrink-0 flex flex-col h-full transform transition-transform duration-200 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>

                <div className="px-5 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {logo ? (
                            <img src={logo} alt="Logo" className="size-7 rounded-md object-cover flex-shrink-0" />
                        ) : (
                            <div className="size-7 rounded-md bg-primary flex items-center justify-center text-white flex-shrink-0"><FileText size={16} /></div>
                        )}
                        <h1 className="text-text-main dark:text-white text-sm font-semibold leading-tight truncate min-w-0 flex-1" title={displayName}>{displayName}</h1>
                    </div>
                    <button onClick={onClose} className="md:hidden p-1.5 rounded-md text-text-secondary hover:bg-background-light dark:hover:bg-gray-800 transition-colors flex-shrink-0"><X size={18} /></button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-4">
                    <div className="flex flex-col gap-0.5">
                        {mainNav.map((item) => (<NavItem key={item.to} {...item} onClose={onClose} />))}
                    </div>
                    <NavSection label="Dokumen">
                        {docNav.map((item) => (<NavItem key={item.to} {...item} onClose={onClose} />))}
                    </NavSection>
                    <NavSection label="Sistem">
                        <NavItem to="/settings" icon={Settings} label="Pengaturan" onClose={onClose} />
                    </NavSection>
                </nav>
                <div className="p-3 border-t border-border-light dark:border-border-dark">
                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors group">
                        {logo ? (
                            <img src={logo} alt="Logo" className="size-7 rounded-full object-cover flex-shrink-0" />
                        ) : (
                            <div className="size-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-medium text-xs flex-shrink-0">{userInitials}</div>
                        )}
                        <div className="flex flex-col flex-1 text-left min-w-0">
                            <p className="text-sm text-text-main dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">{user?.name || 'Pengguna'}</p>
                            <p className="text-xs text-text-secondary dark:text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                        <div className="text-text-secondary group-hover:text-red-500 transition-colors flex-shrink-0"><LogOut size={16} /></div>
                    </button>
                </div>
            </aside>
        </>
    );
}

