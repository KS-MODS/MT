'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { App } from '@/types';
import LayoutShell from '@/components/LayoutShell';
import AppCard from '@/components/AppCard';
import { Search, Compass, ArrowUpDown, HelpCircle } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialFilter = searchParams.get('filter') || '';

  const [query, setQuery] = useState(initialQuery);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('downloads'); // downloads, likes, date

  const categories = ['All', 'Games', 'Tools', 'Health', 'Music', 'Productivity', 'News'];

  useEffect(() => {
    // Keep local query input synced with URL param changes
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    async function performSearch() {
      try {
        setLoading(true);

        let selectQuery = supabase
          .from('apps')
          .select('*, developer:profiles(*)')
          .eq('status', 'approved');

        const filterVal = searchParams.get('filter') || initialFilter;
        
        // Handle quick landing filters from home page
        if (filterVal === 'editors_choice') {
          selectQuery = selectQuery.eq('is_editor_choice', true);
        } else if (filterVal === 'trending') {
          setSortBy('likes');
        } else if (filterVal === 'downloads') {
          setSortBy('downloads');
        }

        const { data, error } = await selectQuery;
        if (error) throw error;

        setApps((data as App[]) || []);
      } catch (err) {
        console.error('Failed to query apps:', err);
      } finally {
        setLoading(false);
      }
    }

    performSearch();
  }, [searchParams]);

  // Client-side filtering & sorting
  const getFilteredApps = () => {
    let result = [...apps];

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        app =>
          app.name.toLowerCase().includes(q) ||
          (app.description && app.description.toLowerCase().includes(q)) ||
          app.category.toLowerCase().includes(q) ||
          (app.developer?.full_name && app.developer.full_name.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      result = result.filter(
        app => app.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    // Sorting
    if (sortBy === 'downloads') {
      result.sort((a, b) => b.download_count - a.download_count);
    } else if (sortBy === 'likes') {
      result.sort((a, b) => b.likes_count - a.likes_count);
    } else if (sortBy === 'date') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  };

  const results = getFilteredApps();

  return (
    <LayoutShell>
      <div className="space-y-8 text-left max-w-6xl mx-auto">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-slate-800">
            Explore Application Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Discover utility toolkits, high performance games, and security APKs</p>
        </div>

        {/* Filters Top Bar */}
        <div className="glass-card p-4 bg-white border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Live Search Box */}
          <div className="relative w-full md:max-w-md flex-1">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by app name, description, developer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-slate-800 bg-white"
            />
          </div>

          {/* Sorter Selector */}
          <div className="flex gap-4 w-full md:w-auto items-center justify-between md:justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span>Sort By:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
            >
              <option value="downloads">Most Downloaded</option>
              <option value="likes">Most Liked</option>
              <option value="date">New Releases</option>
            </select>
          </div>
        </div>

        {/* Mobile Horizontal Categories Filters (Visible on mobile only) */}
        <div className="space-y-2 md:hidden">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-500" />
            Select Category
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  categoryFilter === cat
                    ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Desktop Category Sidebar + Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Categories Sidebar (Desktop only) */}
          <div className="hidden md:block space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Compass className="w-4 h-4 text-blue-500" />
              Filter Category
            </h3>
            <div className="flex flex-col gap-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold rounded-xl transition-all border ${
                    categoryFilter === cat
                      ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          <div className="md:col-span-3 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold text-slate-400">
                Found {results.length} results {query && `for "${query}"`} {categoryFilter !== 'All' && `in ${categoryFilter}`}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="glass-card p-4 flex flex-col h-full bg-white border border-gray-100 shadow-sm skeleton">
                    <div className="w-full h-32 rounded-lg bg-slate-200 mb-3 animate-pulse" />
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 glass-card bg-white border border-gray-100 shadow-sm">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-700">No results found</h2>
                <p className="text-slate-400 mt-2 text-sm max-w-sm mx-auto leading-relaxed">
                  Try checking your spelling, clear search strings, or explore categories for interesting applications.
                </p>
                <button
                  onClick={() => {
                    setQuery('');
                    setCategoryFilter('All');
                  }}
                  className="mt-6 btn-primary py-2.5 px-6 text-xs font-semibold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map(app => (
                  <AppCard key={app.id} app={app} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <LayoutShell>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 max-w-6xl mx-auto p-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="glass-card p-4 flex flex-col h-full bg-white border border-gray-100 shadow-sm skeleton">
              <div className="w-full h-32 rounded-lg bg-slate-200 mb-3 animate-pulse" />
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </LayoutShell>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
