'use client'

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (systemDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!mounted) return (
    <button className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2DBFB8]/20 text-[#6b7a7a] transition hover:bg-[#2DBFB8]/10">
      <Sun className="h-4 w-4" />
    </button>
  );

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2DBFB8]/20 text-[#6b7a7a] transition hover:bg-[#2DBFB8]/10 hover:text-[#2DBFB8] dark:border-[#2DBFB8]/30 dark:text-slate-400 dark:hover:text-[#2DBFB8]"
      aria-label="تبديل الوضع"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}