'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { App, Category } from '@/types';
import LayoutShell from '@/components/LayoutShell';
import AppCard from '@/components/AppCard';
import { 
  Sparkles, 
  Search, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Star, 
  Grid, 
  SlidersHorizontal 
} from 'lucide-react';
import Link from 'next/link';

interface FeaturedAppJoin {
  id: string;
  app_id: string;
  banner_image: string;
  display_order: number;
  is_active: boolean;
  app: App & { developer?: { full_name: string; username: string; is_verified: boolean } };
}

export default function AllAppsPage() {
  const [settings, setSettings] = useState({
    all_apps_enabled: true,
    slider_autoplay_speed: 4000,
    show_downloads_count: true,
    show_ratings: true,
    install_button_enabled: true
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [featuredApps, setFeaturedApps] = useState<FeaturedAppJoin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'rating'>('newest');
  
  // Carousel states
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Pagination states
  const [displayCount, setDisplayCount] = useState(8);

  useEffect(() => {
    async function loadAllAppsData() {
      try {
        setLoading(true);
        
        // 1. Fetch store settings
        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('*')
          .single();
        if (settingsData) {
          setSettings(settingsData);
        }

        // 2. Fetch active categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true });
        setCategories(categoriesData || []);

        // 3. Fetch approved apps
        const { data: appsData } = await supabase
          .from('apps')
          .select('*, developer:profiles(*)')
          .eq('status', 'approved')
          .order('display_order', { ascending: true });
        setApps((appsData as App[]) || []);

        // 4. Fetch featured slider apps
        const { data: featuredData } = await supabase
          .from('featured_apps')
          .select('*, app:apps(*, developer:profiles(*))')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        setFeaturedApps((featuredData as any[]) || []);
      } catch (err) {
        console.error('Failed to load All Apps page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAllAppsData();
  }, []);

  // Slider Autoplay Effect
  useEffect(() => {
    if (featuredApps.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredApps.length);
    }, settings.slider_autoplay_speed || 4000);

    return () => clearInterval(interval);
  }, [featuredApps.length, isHovered, settings.slider_autoplay_speed]);

  // Touch handlers for carousel swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCarouselIndex((prev) => (prev + 1) % featuredApps.length);
    } else if (isRightSwipe) {
      setCarouselIndex((prev) => (prev === 0 ? featuredApps.length - 1 : prev - 1));
    }
  };

  // Direct download logic for install button in carousel
  const handleFeaturedInstall = async (e: React.MouseEvent, appItem: App) => {
    e.preventDefault();
    try {
      // Track download
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('downloads').insert({
        user_id: user ? user.id : null,
        app_id: appItem.id
      });

      if (appItem.download_type === 'link' && appItem.download_url) {
        window.open(appItem.download_url, '_blank');
      } else if (appItem.apk_url) {
        window.open(appItem.apk_url, '_blank');
      } else {
        window.location.href = `/app/${appItem.slug}`;
      }
    } catch (err) {
      console.error('Failed to trigger download:', err);
    }
  };

  // Filter & Sort Apps Logic
  const filteredApps = apps.filter((app) => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      app.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      selectedCategory === 'All' || 
      app.category.toLowerCase() === selectedCategory.toLowerCase();
      
    return matchesSearch && matchesCategory;
  });

  // Sort filtered list
  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'downloads') {
      return b.download_count - a.download_count;
    }
    if (sortBy === 'rating') {
      // Mock average rating as 4.8, but if there's real rating we could use it
      return b.download_count - a.download_count; 
    }
    return 0;
  });

  const paginatedApps = sortedApps.slice(0, displayCount);

  if (!loading && !settings.all_apps_enabled) {
    return (
      <LayoutShell>
        <div className="text-center py-24 glass-card max-w-md mx-auto bg-white border border-gray-100 shadow-sm">
          <Grid className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700">All Apps Maintenance</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            The All Apps directory is currently disabled by store administrators. Please explore the Home page.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-xs text-blue-500 font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Go Store Home
          </Link>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8 text-left max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Grid className="w-6 h-6 text-blue-500" />
              All Applications
            </h1>
            <p className="text-sm text-gray-400">Discover and download approved APK packages and mods</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors font-semibold min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* FEATURED CAROUSEL SECTION */}
        {loading ? (
          <div className="w-full h-72 rounded-3xl skeleton" />
        ) : (
          featuredApps.length > 0 && (
            <div 
              className="group relative w-full min-h-[300px] md:h-[350px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl touch-pan-y"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Slides */}
              <div className="relative w-full h-full min-h-[300px] md:h-[350px]">
                {featuredApps.map((slide, index) => {
                  const isActive = index === carouselIndex;
                  if (!slide.app) return null;

                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 w-full h-full flex items-center p-5 sm:p-8 md:p-10 transition-all duration-700 ease-in-out ${
                        isActive 
                          ? 'opacity-100 z-10 pointer-events-auto' 
                          : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      {/* Banner Background */}
                      <div className="absolute inset-0 z-0 select-none pointer-events-none">
                        <img
                          src={slide.banner_image || slide.app.banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop'}
                          alt="Banner background"
                          className="w-full h-full object-cover opacity-25 sm:opacity-30"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                      </div>

                      {/* Content */}
                      <div className={`relative z-10 max-w-xl text-left space-y-3 sm:space-y-4 transition-all duration-700 delay-100 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}>
                        
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider font-outfit">
                          <Sparkles className="w-3.5 h-3.5" />
                          Featured
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 shadow-lg">
                            <img src={slide.app.icon_url || ''} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h2 className="text-lg sm:text-2xl font-extrabold font-outfit text-white leading-tight">
                              {slide.app.name}
                            </h2>
                            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                              By {slide.app.developer?.full_name || 'Modded Team'}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                          {slide.app.description || 'No description provided.'}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Link 
                            href={`/app/${slide.app.slug}`} 
                            className="btn-primary py-2 px-4 font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-700 border-none shadow-md shadow-blue-500/10 min-h-[40px]"
                          >
                            View Details
                          </Link>

                          {settings.install_button_enabled && (
                            <button
                              onClick={(e) => handleFeaturedInstall(e, slide.app)}
                              className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-all flex items-center gap-1.5 min-h-[40px]"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Install APK
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slider Manual Buttons */}
              {featuredApps.length > 1 && (
                <>
                  <button
                    onClick={() => setCarouselIndex((prev) => (prev === 0 ? featuredApps.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/40 hover:bg-slate-950/75 border border-white/10 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 min-w-[32px] min-h-[32px]"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCarouselIndex((prev) => (prev + 1) % featuredApps.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-950/40 hover:bg-slate-950/75 border border-white/10 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 min-w-[32px] min-h-[32px]"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )
        )}

        {/* CONTROLS HEADER (Search, Categories, Sort) */}
        <div className="glass-card p-5 space-y-4 bg-white border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search approved mods and apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs glass-input bg-slate-50 focus:bg-white border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold uppercase">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="glass-input text-xs px-3 py-1.5 border-slate-200 bg-white font-semibold text-slate-700 select-arrow min-h-[36px]"
              >
                <option value="newest">Newest Releases</option>
                <option value="downloads">Most Downloaded</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Dynamic Categories Pills */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Categories</span>
            <div className="flex gap-2 overflow-x-auto pb-1.5 -mx-4 px-4 md:-mx-0 md:px-0 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all min-h-[32px] ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all min-h-[32px] flex items-center gap-1.5 ${
                    selectedCategory.toLowerCase() === cat.name.toLowerCase()
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                  style={
                    selectedCategory.toLowerCase() === cat.name.toLowerCase() && cat.color
                      ? { backgroundColor: cat.color, borderColor: cat.color }
                      : {}
                  }
                >
                  {cat.icon && <span className="mr-0.5">{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESPONSIVE GRID LIST */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="glass-card p-4 flex flex-col h-full bg-white border border-gray-100 shadow-sm skeleton">
                <div className="w-full h-32 rounded-lg bg-slate-200 mb-3" />
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedApps.length === 0 ? (
          <div className="text-center py-20 glass-card bg-white border border-slate-100">
            <p className="text-slate-400 text-sm font-semibold">No applications found matching the selected criteria.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  showDownloads={settings.show_downloads_count}
                  showRatings={settings.show_ratings}
                  showInstallButton={settings.install_button_enabled}
                />
              ))}
            </div>

            {/* Pagination Load More Button */}
            {sortedApps.length > displayCount && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setDisplayCount((prev) => prev + 8)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 font-bold text-xs text-slate-600 transition-all shadow-sm min-h-[44px]"
                >
                  Load More Applications
                </button>
              </div>
            )}
          </div>
        )}
        
      </div>
    </LayoutShell>
  );
}
