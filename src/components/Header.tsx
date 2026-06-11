"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RefreshCw, 
  Monitor, 
  FileText, 
  Gamepad2, 
  Key, 
  Cpu, 
  Search,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchVal, setSearchVal] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>('light');

  // Load theme preference on mount safely
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const resolvedTheme = isDark ? 'dark' : 'light';
    
    // Sync DOM class immediately
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Defer state update to next loop tick to comply with synchronous render cascade guidelines
    const t = setTimeout(() => {
      setTheme(resolvedTheme);
    }, 0);
    
    return () => clearTimeout(t);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Extract category selection from URL query parameters client-side
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveCategory(params.get('category') || '');
    };
    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Listen to external search queries to keep header search in sync
  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setSearchVal(customEvent.detail || '');
    };
    window.addEventListener('globalSearch', handleGlobalSearch);
    return () => window.removeEventListener('globalSearch', handleGlobalSearch);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    const event = new CustomEvent('globalSearch', { detail: val });
    window.dispatchEvent(event);
  };

  const navItems = [
    { label: 'Windows Update', key: 'windows-update', icon: RefreshCw },
    { label: 'BSOD', key: 'bsod', icon: Monitor },
    { label: 'DLL Errors', key: 'dll', icon: FileText },
    { label: 'Gaming', key: 'gaming', icon: Gamepad2 },
    { label: 'Activation', key: 'activation', icon: Key },
    { label: 'Drivers', key: 'driver', icon: Cpu },
  ];

  const handleNavClick = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    const isHome = window.location.pathname === '/';
    
    // Toggle state: if clicked active tab, clear it to go back to Home screen
    const newCategory = activeCategory === key ? '' : key;
    setActiveCategory(newCategory);
    setIsMobileMenuOpen(false);

    const event = new CustomEvent('categoryChange', { detail: newCategory });
    window.dispatchEvent(event);

    if (isHome) {
      const newUrl = newCategory ? `/?category=${newCategory}` : '/';
      window.history.pushState({}, '', newUrl);
    } else {
      // Direct navigation to home with query parameters pre-selected
      router.push(newCategory ? `/?category=${newCategory}` : '/');
    }
  };

  return (
    <header id="app-header" className="bg-white border-b border-slate-100 px-6 py-3.5 sticky top-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div id="header-row" className="flex items-center justify-between max-w-7xl mx-auto w-full">
        {/* Left: Blue branding logo */}
        <div id="header-logo-container" className="flex items-center">
          <Link 
            id="logo-link" 
            href="/" 
            onClick={() => {
              setActiveCategory('');
              setIsMobileMenuOpen(false);
              const catEvent = new CustomEvent('categoryChange', { detail: '' });
              window.dispatchEvent(catEvent);
              const searchEvent = new CustomEvent('globalSearch', { detail: '' });
              window.dispatchEvent(searchEvent);
            }}
            prefetch={true} 
            className="flex items-center gap-2 group transition-all font-extrabold tracking-tight"
          >
            <div className="bg-blue-600 text-white w-9 h-9 rounded-lg flex items-center justify-center font-extrabold text-xl shadow-sm group-hover:scale-105 transition-all">
              T
            </div>
            <span className="text-slate-900 font-extrabold text-lg tracking-tight">
              TechError<span className="text-blue-600">Log</span><span className="text-slate-300 font-normal">.com</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation capsule tags (visible on desktop) */}
        <nav id="header-navigation" className="hidden lg:flex gap-1.5">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeCategory === item.key;
            return (
              <a
                key={item.key}
                id={`nav-link-${item.key}`}
                href={`/?category=${item.key}`}
                onClick={(e) => handleNavClick(item.key, e)}
                className={`px-3 py-1.5 rounded-full font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 border border-blue-200 text-blue-600 shadow-sm'
                    : 'text-slate-550 hover:text-slate-900 border border-transparent hover:bg-slate-50'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Options container including Desktop/Mobile theme toggle and mobile menu activator */}
        <div id="header-right-controls" className="flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            className="p-1.5 md:p-2 rounded-xl text-slate-500 hover:text-slate-900 border border-slate-150 bg-slate-50/50 hover:bg-slate-55 transition-all cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500 hover:text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-550 hover:text-slate-700" />
            )}
          </button>

          <span className="hidden lg:inline text-slate-200">|</span>

          {/* Mobile Menu Action Trigger */}
          <div id="header-mobile-toggle" className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-600" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav dropdown panel (visible on mobile when open) */}
      {isMobileMenuOpen && (
        <nav 
          id="mobile-navigation" 
          className="lg:hidden mt-3.5 pt-3.5 border-t border-slate-100/90 flex flex-col gap-1 max-w-7xl mx-auto w-full transition-all animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeCategory === item.key;
            return (
              <a
                key={item.key}
                id={`mobile-nav-link-${item.key}`}
                href={`/?category=${item.key}`}
                onClick={(e) => handleNavClick(item.key, e)}
                className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-blue-50 border-blue-100 text-blue-600'
                    : 'text-slate-650 border-transparent hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
}
