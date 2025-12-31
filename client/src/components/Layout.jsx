import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-text-main antialiased">
            {/* Sidebar with mobile support */}
            <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:px-12">
                    <div className="max-w-[1200px] mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
