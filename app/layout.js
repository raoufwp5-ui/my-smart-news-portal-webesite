import './globals.css';
import Navbar from '@/components/Navbar';
import { Inter } from 'next/font/google';

import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    metadataBase: new URL('https://my-smart-news-portal-webesite.vercel.app'),
    title: 'Global Brief - World News, Business, Tech & Politics',
    description: 'In-depth reporting and analysis on the latest global trends using primary sources.',
    openGraph: {
        title: 'Global Brief - Premium News Portal',
        description: 'Elite reporting from business, technology, politics, and sports.',
        url: 'https://my-smart-news-portal-webesite.vercel.app',
        siteName: 'Global Brief',
        images: [
            {
                url: '/default-news.jpg',
                width: 1200,
                height: 630,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Global Brief - Premium News',
        description: 'Elite reporting from business, technology, politics, and sports.',
        images: ['/default-news.jpg'],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300 flex flex-col`}>
                <Navbar />
                <main className="flex-grow container mx-auto px-4 py-8">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
