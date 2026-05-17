'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-text-main antialiased">
            <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:px-12">
                    <div className="max-w-[1200px] mx-auto">{children}</div>
                </div>
            </main>
        </div>
    );
}
