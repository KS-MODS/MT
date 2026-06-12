'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePathname, useRouter } from 'next/navigation';
import AuthModal from './AuthModal';
import {
  Home,
  Search,
  FolderCode,
  ShieldAlert,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  ShoppingBag,
  TrendingUp,
  Settings,
  Sparkles,
  Menu as MenuIcon,
  X,
  MapPin,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface LayoutShellProps {
  children: React.ReactNode;
}

export default function LayoutShell({ children }: LayoutShellProps) {
  const {
    user,
    profile,
    theme,
    toggleTheme,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    signOut,
  } = useApp();

  const pathname = usePathname();
  const router = useRouter();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menus on path change
  useEffect(() => {
    setNotifOpen(false);
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Store Home', href: '/', icon: Home },
    { name: 'Explore Search', href: '/search', icon: Search },
    {
      name: 'Developer Portal',
      href: '/developer-portal',
      icon: FolderCode,
    },
  ];

  // Add Admin Panel link if user is admin
  if (profile?.role === 'admin') {
    navLinks.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: ShieldAlert,
    });
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full bg-[var(--sidebar-bg)] backdrop-blur-md border-b border-gray-200 dark:border-white/5 py-3 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Hamburger Menu (Mobile Only) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2.5 -ml-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-white/5 transition-all relative z-50"
            aria-label="Open Menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 relative z-50">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-outfit font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
              Modded Team <span className="hidden sm:inline-flex text-[10px] bg-blue-500/10 text-blue-500 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20 whitespace-nowrap">Store</span>
            </span>
          </Link>
        </div>

        {/* Global Search Bar (Hidden on Mobile) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-8 relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search apps, categories, developers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm glass-input bg-gray-100/50 dark:bg-white/5 focus:bg-white dark:focus:bg-[#0d1220]"
          />
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-4">


          {/* Notifications Panel */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileMenuOpen(false);
                }}
                className="p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all relative min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 glass-card bg-white dark:bg-[#131926] shadow-xl overflow-hidden z-50 p-2 border border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-white/5">
                    <span className="text-xs font-bold font-outfit uppercase tracking-wider text-gray-900 dark:text-white">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[10px] text-blue-500 hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-gray-400">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-2.5 rounded-lg mb-1 cursor-pointer transition-colors text-left ${
                            !n.is_read
                              ? 'bg-blue-500/5 hover:bg-blue-500/10 border-l-2 border-blue-500'
                              : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-gray-900 dark:text-white">{n.title}</span>
                            <span className="text-[9px] text-gray-500">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Menu / Sign In Button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-left min-w-[44px] min-h-[44px]"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 overflow-hidden flex items-center justify-center font-bold text-sm text-blue-500 uppercase">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile?.username?.[0] || 'U'
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 glass-card bg-white dark:bg-[#131926] shadow-xl overflow-hidden z-50 p-2 border border-gray-200 dark:border-white/10">
                  <div className="p-3 border-b border-gray-100 dark:border-white/5">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {profile?.full_name || 'Anonymous User'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      @{profile?.username || 'user'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {profile?.role || 'user'}
                    </span>
                  </div>
                  <div className="py-1 space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      My Profile
                    </Link>
                    {profile?.role === 'developer' && (
                      <Link
                        href="/developer-portal"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <FolderCode className="w-4 h-4 text-gray-400" />
                        Developer Portal
                      </Link>
                    )}
                    {profile?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={signOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-500 rounded-lg hover:bg-red-500/5 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-semibold min-h-[44px]"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex flex-1 relative min-h-screen">
        {/* Desktop Sidebar (Left side, hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-64 fixed top-16 bottom-0 left-0 glass-sidebar p-4 border-r border-gray-200 dark:border-white/5 z-30">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-l-2 border-blue-500 shadow-sm shadow-blue-500/5'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto space-y-4">
            {/* Developer Banner */}
            {profile?.role === 'user' && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/25">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Become a Developer
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                  Join other creators! Apply to upload your APKs and publish your Android projects.
                </p>
                <Link
                  href="/profile"
                  className="mt-3 block text-center py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 font-semibold text-[10px] rounded-lg border border-indigo-500/30 transition-all"
                >
                  Request Access
                </Link>
              </div>
            )}

            <div className="flex items-center justify-between p-2 text-[10px] text-gray-400 font-medium border-t border-gray-100 dark:border-white/5">
              <span>© 2026 Modded Team</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
            </div>
          </div>
        </aside>

        {/* Content Wrapper (Offset for desktop sidebar) */}
        <main className="flex-1 flex flex-col md:pl-64 pb-20 md:pb-0 bg-[var(--bg-color)] min-w-0">
          <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>

          {/* Red-Orange Footer styled like BhashaSetu */}
          <footer className="w-full bg-[#f13a1b] text-white border-t border-red-500/10 mt-auto">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
              {/* Col 1: Logo & Socials */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#f13a1b] shadow-lg">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="font-outfit font-extrabold text-xl tracking-tight">Modded Team</span>
                </div>
                <p className="text-xs text-white/85 leading-relaxed">
                  Modded Team Store is the ultimate APK sharing community. Download, upload, review, and follow developers in a secure android app ecosystem. Code, modify, innovate.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full border border-white/20 hover:border-yellow-400 hover:text-yellow-400 flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M9 8H7v3h2v9h3v-9h3.6L16 8h-3V6.5c0-.8.4-1 1-1h2V2h-3C10.5 2 9 3.5 9 6v2z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full border border-white/20 hover:border-yellow-400 hover:text-yellow-400 flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full border border-white/20 hover:border-yellow-400 hover:text-yellow-400 flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
                    aria-label="WhatsApp"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.79 1.451 5.485.002 9.952-4.466 9.954-9.956.001-2.66-1.036-5.161-2.92-7.047C16.53 1.71 14.027.674 11.367.674c-5.49 0-9.957 4.467-9.959 9.958-.001 1.905.495 3.766 1.439 5.397L1.83 20.354l4.817-1.2z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="w-8 h-8 rounded-full border border-white/20 hover:border-yellow-400 hover:text-yellow-400 flex items-center justify-center transition-all bg-white/5 hover:bg-white/10"
                    aria-label="YouTube"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.555A3.003 3.003 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.555a3.003 3.003 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Col 2: Quick Links */}
              <div>
                <h3 className="font-outfit font-bold text-yellow-400 text-sm uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Quick Links</h3>
                <ul className="space-y-2 text-xs text-white/90">
                  <li>
                    <Link href="/" className="hover:text-yellow-400 flex items-center gap-1.5 transition-colors">
                      <span className="text-[10px] text-yellow-400">&gt;</span> Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/search" className="hover:text-yellow-400 flex items-center gap-1.5 transition-colors">
                      <span className="text-[10px] text-yellow-400">&gt;</span> Explore Search
                    </Link>
                  </li>
                  <li>
                    <Link href="/developer-portal" className="hover:text-yellow-400 flex items-center gap-1.5 transition-colors">
                      <span className="text-[10px] text-yellow-400">&gt;</span> Developer Portal
                    </Link>
                  </li>
                  {profile?.role === 'admin' && (
                    <li>
                      <Link href="/admin" className="hover:text-yellow-400 flex items-center gap-1.5 transition-colors">
                        <span className="text-[10px] text-yellow-400">&gt;</span> Admin Panel
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              {/* Col 3: Categories */}
              <div>
                <h3 className="font-outfit font-bold text-yellow-400 text-sm uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Our Categories</h3>
                <ul className="space-y-2 text-xs text-white/90">
                  {['Games', 'Tools', 'Health', 'Music', 'Productivity'].map((cat) => (
                    <li key={cat}>
                      <Link href={`/search?q=${cat.toLowerCase()}`} className="hover:text-yellow-400 flex items-center gap-1.5 transition-colors">
                        <span className="text-[10px] text-yellow-400">&gt;</span> {cat}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Col 4: Contact Info */}
              <div>
                <h3 className="font-outfit font-bold text-yellow-400 text-sm uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Contact Info</h3>
                <ul className="space-y-3 text-xs text-white/90">
                  <li className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <span>Noida, Uttar Pradesh, India</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <a href="mailto:contact@moddedteam.com" className="hover:underline">contact@moddedteam.com</a>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span>+91 8219602196</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span>Mon - Sat: 9AM - 6PM</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Copyright Bar */}
            <div className="bg-[#c22e14] border-t border-red-800/10">
              <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/80">
                <p>© 2026 Modded Team. All Rights Reserved.</p>
                <div className="flex items-center gap-4">
                  <Link href="/privacy" className="hover:underline">Terms & Conditions</Link>
                  <span>|</span>
                  <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                </div>
                <div className="flex items-center gap-1">
                  <span>Designed with ❤️ by</span>
                  <span className="inline-flex items-center bg-white px-2 py-0.5 rounded text-[10px] font-extrabold ml-1 shadow-sm select-none">
                    <span className="text-[#3b82f6]">KS</span>
                    <span className="text-[#f5af19]">MODS</span>
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Navigation (Sticky Bottom, visible on mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--sidebar-bg)] backdrop-blur-md border-t border-gray-200 dark:border-white/5 pb-safe pt-2 px-2 flex items-center justify-around z-[60]">
        <Link
          href="/"
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 text-[9px] font-semibold transition-all ${
            pathname === '/'
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <Home className="w-5 h-5" />
          Home
        </Link>
        <Link
          href="/search"
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 text-[9px] font-semibold transition-all ${
            pathname === '/search'
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <Search className="w-5 h-5" />
          Explore
        </Link>
        <Link
          href="/developer-portal"
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 text-[9px] font-semibold transition-all ${
            pathname === '/developer-portal'
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <FolderCode className="w-5 h-5" />
          Dev Portal
        </Link>
        {profile?.role === 'admin' ? (
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 text-[9px] font-semibold transition-all ${
              pathname === '/admin'
                ? 'text-red-500'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            Admin
          </Link>
        ) : (
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 text-[9px] font-semibold transition-all ${
              pathname === '/profile'
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <User className="w-5 h-5" />
            Profile
          </Link>
        )}
      </nav>

      {/* Mobile Drawer Slide-out Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-gradient-to-b from-[#ff3b11] to-[#ff0f00] text-white shadow-2xl z-50 animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                {/* Book icon style */}
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="font-outfit font-extrabold text-2xl tracking-tight">Menu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-white/15 transition-all text-white/80 hover:text-white"
                aria-label="Close Menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Links List */}
            <div className="flex-1 py-4 overflow-y-auto space-y-0.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 text-sm font-bold transition-all relative ${
                      isActive
                        ? 'text-yellow-400 bg-white/5 border-l-4 border-yellow-400'
                        : 'text-white/95 hover:text-yellow-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}

              {/* Conditional Profile & Sign In/Out inside drawer */}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-4 text-sm font-bold transition-all relative ${
                      pathname === '/profile'
                        ? 'text-yellow-400 bg-white/5 border-l-4 border-yellow-400'
                        : 'text-white/95 hover:text-yellow-300 hover:bg-white/5'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-red-200 hover:text-red-100 hover:bg-white/5 transition-all text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-white/95 hover:text-yellow-300 hover:bg-white/5 transition-all text-left border-t border-white/5 mt-4 pt-4"
                >
                  <LogOut className="w-5 h-5 rotate-180" />
                  Sign In / Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
