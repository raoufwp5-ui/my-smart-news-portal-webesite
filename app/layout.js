import './globals.css';
import Navbar from '@/components/Navbar';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
    title: 'AI News - Smart News Aggregator',
    description: 'AI-powered news aggregator delivering humanized summaries of the latest business, tech, and political news.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300`}>
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    {children}
                </main>
                <footer className="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-gray-500 text-sm">
                    <p>© {new Date().getFullYear()} AI News. Powered by Gemini 1.5 Flash.</p>
                </footer>
            </body>
        </html>
    );
}
