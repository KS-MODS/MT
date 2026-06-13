'use client';

import React from 'react';
import Link from 'next/link';
import { App } from '@/types';
import { Download, Star, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AppCardProps {
  app: App;
  showDownloads?: boolean;
  showRatings?: boolean;
  showInstallButton?: boolean;
}

export default function AppCard({ 
  app, 
  showDownloads = true, 
  showRatings = true, 
  showInstallButton = true 
}: AppCardProps) {
  // Format download count (e.g., 12.4K)
  const formatDownloads = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Get current authenticated user if any
      const { data: { user } } = await supabase.auth.getUser();

      // Track download in database
      await supabase.from('downloads').insert({
        user_id: user ? user.id : null,
        app_id: app.id
      });

      // Determine install action
      if (app.download_type === 'link' && app.download_url) {
        window.open(app.download_url, '_blank');
      } else if (app.apk_url) {
        window.open(app.apk_url, '_blank');
      } else {
        // Fallback to details page
        window.location.href = `/app/${app.slug}`;
      }
    } catch (err) {
      console.error('Failed to trigger install:', err);
    }
  };

  return (
    <Link href={`/app/${app.slug}`} className="group block">
      <div className="glass-card overflow-hidden p-4 flex flex-col h-full hover:scale-[1.02] active:scale-[0.99] transition-all bg-white border border-gray-100 shadow-sm">
        {/* Banner/Feature Image (Optional / Fallback) */}
        <div className="relative w-full h-32 rounded-lg bg-slate-900/40 overflow-hidden mb-3">
          <img
            src={app.banner_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop'}
            alt={`${app.name} banner`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {app.is_editor_choice && (
            <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-blue-500 text-white px-2 py-0.5 rounded-full border border-blue-400/30 shadow-sm">
              Editor's Choice
            </span>
          )}
          {app.is_featured && (
            <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-full border border-purple-400/30 shadow-sm">
              Featured
            </span>
          )}
        </div>

        {/* App Info Grid */}
        <div className="flex gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
            <img
              src={app.icon_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100&auto=format&fit=crop'}
              alt={`${app.name} icon`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors font-outfit">
              {app.name}
            </h3>
            
            {/* Developer Details */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] text-slate-500 truncate">
                {app.developer?.full_name || 'Anonymous Developer'}
              </span>
              {app.developer?.is_verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="inline-block text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-100">
                {app.category}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">v{app.version}</span>
            </div>
          </div>
        </div>

        {/* Stats & Install Button Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-semibold min-h-[36px]">
          <div className="flex flex-col justify-center gap-0.5 text-left">
            {showDownloads && (
              <div className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDownloads(app.download_count)} downloads</span>
              </div>
            )}
            {showRatings && (
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-slate-700">4.8</span>
              </div>
            )}
          </div>
          
          {showInstallButton && (
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 font-bold transition-all text-[10px] min-h-[28px]"
            >
              Install
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
