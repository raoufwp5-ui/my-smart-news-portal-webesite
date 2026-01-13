import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    return (
        <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50 transition-colors duration-300">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI News
                </Link>

                <div className="hidden md:flex space-x-6">
                    <Link href="/business" className="nav-link">Business</Link>
                    <Link href="/technology" className="nav-link">Technology</Link>
                    <Link href="/politics" className="nav-link">Politics</Link>
                    <Link href="/sports" className="nav-link">Sports</Link>
                </div>

                <ThemeToggle />
            </div>
        </nav>
    );
}
