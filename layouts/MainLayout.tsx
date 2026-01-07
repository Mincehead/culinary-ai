import React from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { ScrollToTop } from '../components/ScrollToTop';

export const MainLayout: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-culinary-dark text-culinary-cream font-sans">
            <ScrollToTop />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
