'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { App, Profile } from '@/types';
import LayoutShell from '@/components/LayoutShell';
import AppCard from '@/components/AppCard';
import { Sparkles, Trophy, Plus, ShieldCheck, Flame, Compass, Star, Calendar, Download, RefreshCw, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function StoreHome() {
  const [apps, setApps] = useState<App[]>([]);
  const [developers, setDevelopers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    } else if (isRightSwipe) {
      setCurrentBannerIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
    }
  };

  // Autoplay functionality for the banner carousel
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // 5 seconds interval

    return () => clearInterval(interval);
  }, [banners.length, isHovered]);

  const categories = ['All', 'Games', 'Tools', 'Health', 'Music', 'Productivity', 'News'];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Fetch approved apps
        const { data: appsData, error: appsError } = await supabase
          .from('apps')
          .select('*, developer:profiles(*)')
          .eq('status', 'approved')
          .order('download_count', { ascending: false });

        if (appsError) throw appsError;

        // Fetch top developer profiles
        const { data: devsData, error: devsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'developer')
          .eq('is_verified', true)
          .limit(4);

        if (devsError) throw devsError;

        // Fetch active featured banners
        try {
          const { data: bannerData, error: bannerError } = await supabase
            .from('featured_banner')
            .select('*, featured_app:apps(*, developer:profiles(*))')
            .eq('is_active', true);

          if (bannerError) throw bannerError;

          const now = new Date();
          const scheduledBanners = (bannerData as any[])?.filter(b => {
            if (b.scheduled_start && new Date(b.scheduled_start) > now) return false;
            if (b.scheduled_end && new Date(b.scheduled_end) < now) return false;
            return true;
          });
          setBanners(scheduledBanners || []);
        } catch (bannerError) {
          console.warn('featured_banner query failed. Empty hero section fallback.', bannerError);
          setBanners([]);
        }

        setApps(appsData as App[] || []);
        setDevelopers(devsData as Profile[] || []);
      } catch (err) {
        console.error('Failed to load store data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Filter apps by active category
  const filteredApps = activeCategory === 'All' 
    ? apps 
    : apps.filter(app => app.category.toLowerCase() === activeCategory.toLowerCase());

  // Filter lists for sections
  const featuredApps = apps.filter(app => app.is_featured);
  const editorsChoice = apps.filter(app => app.is_editor_choice);
  const trending = [...apps].sort((a, b) => b.likes_count - a.likes_count).slice(0, 4);
  const mostDownloaded = [...apps].sort((a, b) => b.download_count - a.download_count).slice(0, 4);
  const newReleases = [...apps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4);
  const recentlyUpdated = [...apps].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 4);

  return (
    <LayoutShell>
      <div className="space-y-10">
        
        {/* HERO BANNER SECTION */}
        {loading ? (
          <div className="w-full h-80 rounded-3xl skeleton" />
        ) : (
          banners.length > 0 && (
            <div 
              className="group relative w-full min-h-[340px] sm:min-h-[320px] md:h-[400px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl touch-pan-y"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Slides Container */}
              <div className="relative w-full h-full min-h-[340px] sm:min-h-[320px] md:h-[400px]">
                {banners.map((banner, index) => {
                  const isActive = index === currentBannerIndex;
                  if (!banner.featured_app) return null;
                  
                  return (
                    <div
                      key={banner.id}
                      className={`absolute inset-0 w-full h-full flex items-center p-5 sm:p-6 md:p-12 transition-all duration-700 ease-in-out ${
                        isActive 
                          ? 'opacity-100 z-10 pointer-events-auto' 
                          : 'opacity-0 z-0 pointer-events-none'
                      }`}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0 z-0 select-none pointer-events-none">
                        <picture>
                          {banner.mobile_background_image && (
                            <source media="(max-w: 640px)" srcSet={banner.mobile_background_image} />
                          )}
                          <img
                            src={banner.background_image || banner.featured_app.banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop'}
                            alt="Hero Banner Background"
                            className={`w-full h-full object-cover opacity-25 sm:opacity-30 transition-transform duration-[4000ms] ease-out ${
                              isActive ? 'scale-[1.03]' : 'scale-100'
                            }`}
                            loading="lazy"
                          />
                        </picture>
                        
                        {/* Overlay gradients */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 sm:via-slate-950/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 opacity-60 mix-blend-overlay animate-gradient-shift" />
                      </div>

                      {/* Banner Content */}
                      <div className={`relative z-10 max-w-2xl text-left space-y-3 sm:space-y-4 transition-all duration-700 delay-100 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}>
                        
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider font-outfit">
                            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                            Featured Application
                          </div>
                          {banner.is_editors_choice && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider font-outfit">
                              <Trophy className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                              Editor's Choice
                            </div>
                          )}
                          {banner.is_trending && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider font-outfit">
                              <Flame className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                              Trending
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl flex-shrink-0">
                            <img src={banner.featured_app.icon_url || ''} alt="" className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold font-outfit tracking-tight text-white truncate">
                              {banner.custom_title || banner.featured_app.name}
                            </h1>
                            
                            <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-300">
                              {banner.featured_app.developer ? (
                                <Link 
                                  href={`/developer/${banner.featured_app.developer.username}`}
                                  className="hover:underline hover:text-blue-400 transition-colors flex items-center gap-1 font-semibold"
                                >
                                  By {banner.featured_app.developer.full_name}
                                  {(banner.is_verified_dev || banner.featured_app.developer.is_verified) && (
                                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                                  )}
                                </Link>
                              ) : (
                                <span>By Modded Team Developer</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
                          {banner.custom_description || banner.featured_app.description}
                        </p>

                        <div className="flex flex-wrap gap-2 sm:gap-3 pt-1 sm:pt-2">
                          <Link 
                            href={banner.button_url || `/app/${banner.featured_app.slug}`} 
                            className="btn-primary py-2 px-4 sm:py-2.5 sm:px-6 font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-700 border-none shadow-lg shadow-blue-500/20 min-h-[40px] sm:min-h-[44px]"
                          >
                            {banner.button_text || 'View App Details'}
                          </Link>

                          {banner.featured_app.apk_url && (
                            <a
                              href={banner.featured_app.apk_url}
                              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px] sm:min-h-[44px]"
                            >
                              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Download APK
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Controls (Chevrons) - Only show if > 1 banner */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/40 hover:bg-slate-950/75 border border-white/10 text-white hidden md:flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 min-h-[40px] min-w-[40px]"
                    aria-label="Previous banner"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-950/40 hover:bg-slate-950/75 border border-white/10 text-white hidden md:flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 min-h-[40px] min-w-[40px]"
                    aria-label="Next banner"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Indicator Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentBannerIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentBannerIndex 
                            ? 'w-6 bg-blue-500' 
                            : 'w-2 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        )}

        {/* CATEGORY PILL FILTERS */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-outfit tracking-tight flex items-center gap-2 text-slate-800">
            <Compass className="w-5 h-5 text-blue-500" />
            Browse Categories
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-0 md:px-0">
            {categories.map(cat => (
              <button
                key={cat}
                disabled={loading}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border min-h-[44px] ${
                  activeCategory === cat
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/15'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CONDITIONAL RENDER BY ACTIVE CATEGORY */}
        {activeCategory !== 'All' ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold font-outfit tracking-tight text-slate-800 border-b border-slate-100 pb-2">
              {activeCategory} Apps
            </h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
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
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-16 glass-card bg-white border border-gray-100">
                <p className="text-slate-400 text-sm">No apps found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredApps.map(app => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* PLAY STORE SECTIONS */
          <div className="space-y-12">
            
            {/* SECTION: Trending Apps */}
            <section className="space-y-5">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 text-slate-800">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Trending Apps
                </h2>
                <Link href="/search?filter=trending" className="text-xs text-blue-500 font-semibold hover:underline">
                  See All
                </Link>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(n => (
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
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {trending.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}
            </section>

            {/* SECTION: Editor's Choice */}
            <section className="space-y-5">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 text-slate-800">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                  Editor's Choice
                </h2>
                <Link href="/search?filter=editors_choice" className="text-xs text-blue-500 font-semibold hover:underline">
                  See All
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(n => (
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
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {editorsChoice.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}
            </section>

            {/* SECTION: Most Downloaded */}
            <section className="space-y-5">
              <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 text-slate-800">
                  <Download className="w-5 h-5 text-emerald-500" />
                  Most Downloaded
                </h2>
                <Link href="/search?filter=downloads" className="text-xs text-blue-500 font-semibold hover:underline">
                  See All
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(n => (
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
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {mostDownloaded.map(app => (
                    <AppCard key={app.id} app={app} />
                  ))}
                </div>
              )}
            </section>

            {/* SPLIT LISTS: New Releases & Recently Updated */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* New Releases */}
              <section className="space-y-5">
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <h2 className="text-lg font-bold font-outfit tracking-tight flex items-center gap-2 text-slate-800">
                    <Calendar className="w-4.5 h-4.5 text-blue-500" />
                    New Releases
                  </h2>
                  <Link href="/search?filter=new" className="text-xs text-blue-500 font-semibold hover:underline">
                    See All
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="p-3 rounded-xl border border-transparent skeleton flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/3" />
                          <div className="h-2 bg-slate-200 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {newReleases.map(app => (
                      <Link key={app.id} href={`/app/${app.slug}`} className="group flex gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={app.icon_url || ''} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate text-slate-800 group-hover:text-blue-500 transition-colors font-outfit">{app.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{app.category}</p>
                          <span className="text-[9px] text-slate-500 mt-1 block">Uploaded {new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              {/* Recently Updated */}
              <section className="space-y-5">
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <h2 className="text-lg font-bold font-outfit tracking-tight flex items-center gap-2 text-slate-800">
                    <RefreshCw className="w-4.5 h-4.5 text-indigo-500" />
                    Recently Updated
                  </h2>
                  <Link href="/search?filter=updated" className="text-xs text-blue-500 font-semibold hover:underline">
                    See All
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="p-3 rounded-xl border border-transparent skeleton flex gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/3" />
                          <div className="h-2 bg-slate-200 rounded w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {recentlyUpdated.map(app => (
                      <Link key={app.id} href={`/app/${app.slug}`} className="group flex gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all bg-white shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={app.icon_url || ''} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate text-slate-800 group-hover:text-blue-500 transition-colors font-outfit">{app.name}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">v{app.version} • {app.category}</p>
                          <span className="text-[9px] text-slate-500 mt-1 block">Updated {new Date(app.updated_at).toLocaleDateString()}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* SECTION: Featured Developers */}
            <section className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h2 className="text-xl font-bold font-outfit tracking-tight flex items-center gap-2 text-slate-800">
                  <Trophy className="w-5 h-5 text-violet-500" />
                  Featured Developers
                </h2>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="glass-card p-5 text-center flex flex-col items-center bg-white border border-gray-100 shadow-sm skeleton">
                      <div className="w-16 h-16 rounded-full bg-slate-200 mb-3" />
                      <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                      <div className="h-3 bg-slate-200 rounded w-1/3 mt-2 animate-pulse" />
                      <div className="h-3 bg-slate-200 rounded w-5/6 mt-2 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {developers.map(dev => (
                    <Link key={dev.id} href={`/developer/${dev.username}`} className="glass-card p-5 text-center flex flex-col items-center hover:scale-[1.03] transition-all group bg-white border border-gray-100 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md mb-3">
                        <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-blue-600 font-bold text-lg uppercase">
                          {dev.avatar_url ? (
                            <img src={dev.avatar_url} alt={dev.full_name || ''} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            dev.username?.[0].toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-500 transition-colors font-outfit">
                          {dev.full_name}
                        </h4>
                        <ShieldCheck className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">@{dev.username}</p>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {dev.bio || 'Verified application developer on Modded Team.'}
                      </p>
                      <span className="mt-4 inline-block text-[10px] font-bold text-blue-500 group-hover:underline">
                        View Profile
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

          </div>
        )}

      </div>
    </LayoutShell>
  );
}
