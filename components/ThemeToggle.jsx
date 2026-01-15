'use client';
import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        // 1. Check LocalStorage (User Manual Override)
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme) {
            setDarkMode(savedTheme === 'dark');
            if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        } else {
            // 2. Smart Auto-Detect (No manual override found)
            const hour = new Date().getHours();
            const isNight = hour >= 19 || hour < 6; // 7 PM to 6 AM
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (isNight || prefersDark) {
                setDarkMode(true);
                document.documentElement.classList.add('dark');
                // We don't save to localStorage here to keep it "auto" until user clicks
            }
        }
    }, []);

    const toggleTheme = () => {
        if (darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        setDarkMode(!darkMode);
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Dark Mode"
        >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
        </button>
    );
}
