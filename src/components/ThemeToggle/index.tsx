'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { BsSunFill } from 'react-icons/bs';
import { FaMoon } from 'react-icons/fa';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const darkMode = theme === 'dark';

    return (
        <div
            className="relative w-16 h-8 flex items-center shadow-sm drop-shadow-lg dark:bg-dark-300 bg-teal-500 cursor-pointer rounded-full p-1"
            onClick={() => setTheme(darkMode ? 'light' : 'dark')} >
            <AnimatePresence mode='wait' initial={false}>
                {!darkMode && (
                    <motion.div
                        key="moon"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}>
                        <FaMoon className="text-white" size={18} />
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                layout
                className="absolute bg-white dark:bg-dark-800 w-6 h-6 rounded-full shadow-md"
                transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                initial={false}
                style={{ left: darkMode ? '2px' : 'auto', right: darkMode ? 'auto' : '2px' }}
            />

            <AnimatePresence mode='wait' initial={false}>
                {darkMode && (
                    <motion.div
                        className='absolute right-2'
                        key="sun"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}>
                        <BsSunFill className=" text-yellow-500" size={18} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* <BsSunFill className="ml-auto text-yellow-500" size={18} /> */}
        </div>
    );
}