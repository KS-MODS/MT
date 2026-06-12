'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import LayoutShell from '@/components/LayoutShell';
import AppCard from '@/components/AppCard';
import { Profile, App, Download, Favorite, Badge } from '@/types';
import { 
  User, 
  Settings, 
  Award, 
  History, 
  Heart, 
  Check, 
  Edit2, 
  ShieldAlert, 
  Sparkles, 
  Globe, 
  Download as DownloadIcon, 
  Users, 
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function UserProfilePage() {
  const { user, profile, refreshProfile, loading } = useApp();
  const router = useRouter();

  const [downloads, setDownloads] = useState<Download[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [followingDevs, setFollowingDevs] = useState<any[]>([]);

  // Tabs State
  const [activeTab, setActiveTab] = useState<'overview' | 'bookmarks' | 'settings'>('overview');

  // Profile Edit States
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setWebsiteUrl(profile.website_url || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function loadUserData() {
      try {
        setLoadingData(true);

        // Fetch download history
        const { data: dls } = await supabase
          .from('downloads')
          .select('*, app:apps(*, developer:profiles(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        setDownloads((dls as Download[]) || []);

        // Fetch favorite apps
        const { data: favs } = await supabase
          .from('favorites')
          .select('*, app:apps(*, developer:profiles(*))')
          .eq('user_id', user.id);
        
        setFavorites((favs as Favorite[]) || []);

        // Fetch badges
        const { data: bgs } = await supabase
          .from('badges')
          .select('*')
          .eq('user_id', user.id);

        setBadges((bgs as Badge[]) || []);

        // Fetch following developers
        const { data: followsData } = await supabase
          .from('follows')
          .select('*, following:profiles(*)')
          .eq('follower_id', user.id);

        setFollowingDevs(followsData || []);

      } catch (err) {
        console.error('Failed to load user records:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadUserData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaveLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          bio: bio,
          website_url: websiteUrl,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Profile update failed');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeveloperUpgrade = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'developer' })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Auto award badge
      await supabase.from('badges').insert({
        user_id: user.id,
        badge_type: 'top_developer'
      }).select().maybeSingle();

      await refreshProfile();
      alert('Congratulations! You are now registered as an App Developer. You can upload APKs in the Developer Portal!');
    } catch (err) {
      console.error(err);
    }
  };

  const badgeConfig: Record<string, { label: string; desc: string; color: string }> = {
    pioneer: { label: 'Beta Pioneer', desc: 'Early tester & reviewer of apps', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    top_developer: { label: 'Top Developer', desc: 'Verified application creator', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    super_downloader: { label: 'Super Downloader', desc: 'Downloaded over 10 apps', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    reviewer: { label: 'Star Reviewer', desc: 'Left detailed feedback reviews', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  };

  if (!user) {
    return (
      <LayoutShell>
        <div className="text-center py-20 glass-card bg-white border border-gray-100 max-w-xl mx-auto shadow-sm">
          <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800">Please sign in</h2>
          <p className="text-slate-500 mt-2 text-sm">You must be authenticated to view your profile and account settings.</p>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8 text-left max-w-5xl mx-auto">
        
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-slate-800">
            Developer & User Profile
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage your personal settings, favorites, and download statistics</p>
        </div>

        {/* Profile Card / Header Deck */}
        <div className="relative w-full rounded-3xl overflow-hidden">
          <div className="h-32 md:h-44 w-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/15" />
          
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left -mt-16 mx-4 relative z-10 bg-white border border-gray-100 shadow-md">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-blue-600 font-extrabold text-3xl uppercase">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.username?.[0] || 'U'
                )}
              </div>
            </div>

            {/* User Metadata */}
            <div className="flex-1 space-y-2 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl font-extrabold font-outfit text-slate-800 tracking-tight">
                  {profile?.full_name || 'Anonymous User'}
                </h2>
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 select-none">
                  {profile?.role}
                </span>
                {profile?.role === 'developer' && profile.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full border border-purple-100 select-none">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Developer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold">@{profile?.username || 'username'}</p>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                {profile?.bio || 'No bio description provided yet. Update your profile settings to add a bio.'}
              </p>
              {profile?.website_url && (
                <div className="flex justify-center md:justify-start pt-1">
                  <a 
                    href={profile.website_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {profile.website_url.replace(/(^\w+:|^)\/\//, '')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="flex gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-6 text-center md:text-right flex-shrink-0 select-none">
              <div>
                <p className="text-xl font-extrabold text-slate-800 font-outfit">{favorites.length}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-end mt-0.5">
                  <Heart className="w-3 h-3 text-rose-500" />
                  Favorites
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 font-outfit">{downloads.length}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-end mt-0.5">
                  <DownloadIcon className="w-3 h-3 text-emerald-500" />
                  Downloads
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 font-outfit">{badges.length}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-end mt-0.5">
                  <Award className="w-3 h-3 text-amber-500" />
                  Badges
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-6 text-xs font-bold font-outfit uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Overview & Activity
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-3 px-6 text-xs font-bold font-outfit uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'bookmarks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Bookmarks ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-6 text-xs font-bold font-outfit uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Account Settings
          </button>
        </div>

        {/* Tab Panels */}
        <div className="pt-2">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Badges and Follows */}
              <div className="space-y-6 lg:col-span-1">
                {/* Badges Box */}
                <div className="glass-card p-6 bg-white border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold font-outfit text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Award className="w-4 h-4 text-amber-500" />
                    Achievements ({badges.length})
                  </h3>
                  
                  {loadingData ? (
                    <div className="space-y-3">
                      {[1, 2].map(n => (
                        <div key={n} className="p-3 rounded-xl border border-slate-100 flex items-center gap-3 skeleton">
                          <div className="w-8 h-8 rounded-full bg-slate-200" />
                          <div className="space-y-2 flex-1">
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                            <div className="h-2 bg-slate-200 rounded w-5/6" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : badges.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400">No badges awarded yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Download apk tools or comment to unlock achievements!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {badges.map(b => {
                        const cfg = badgeConfig[b.badge_type] || { label: b.badge_type, desc: 'Achievement badge', color: 'bg-slate-50 text-slate-600 border-slate-100' };
                        return (
                          <div key={b.id} className={`p-3 rounded-xl border flex items-center gap-3 ${cfg.color}`}>
                            <Award className="w-7 h-7 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold">{cfg.label}</p>
                              <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed">{cfg.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Following Developers Box */}
                <div className="glass-card p-6 bg-white border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold font-outfit text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Users className="w-4 h-4 text-blue-500" />
                    Following ({followingDevs.length})
                  </h3>
                  
                  {loadingData ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(n => (
                        <div key={n} className="flex items-center justify-between py-2 skeleton">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-slate-200" />
                            <div className="space-y-1">
                              <div className="h-2.5 bg-slate-200 rounded w-16" />
                              <div className="h-2 bg-slate-200 rounded w-10" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : followingDevs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">You haven't followed any developers yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[240px] overflow-y-auto pr-1">
                      {followingDevs.map(f => (
                        <div key={f.id} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <Link href={`/developer/${f.following?.username}`} className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
                            <div className="w-7 h-7 rounded bg-blue-500/10 overflow-hidden flex items-center justify-center font-bold text-[10px] text-blue-500 uppercase flex-shrink-0">
                              {f.following?.avatar_url ? (
                                <img src={f.following.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                f.following?.username?.[0] || 'D'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 truncate">{f.following?.full_name}</p>
                              <p className="text-[9px] text-slate-400">@{f.following?.username}</p>
                            </div>
                          </Link>
                          <Link href={`/developer/${f.following?.username}`} className="text-[10px] font-semibold text-blue-500 hover:underline flex-shrink-0">
                            View
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Download History logs */}
              <div className="space-y-6 lg:col-span-2">
                <div className="glass-card p-6 bg-white border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold font-outfit text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <History className="w-4 h-4 text-emerald-500" />
                    App Download History ({downloads.length})
                  </h3>

                  {loadingData ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className="p-3 rounded-xl border border-slate-50 flex items-center gap-3 skeleton">
                          <div className="w-10 h-10 rounded bg-slate-200" />
                          <div className="space-y-2 flex-1">
                            <div className="h-3 bg-slate-200 rounded w-1/3" />
                            <div className="h-2 bg-slate-200 rounded w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : downloads.length === 0 ? (
                    <div className="text-center py-12">
                      <DownloadIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">You haven't downloaded any applications yet.</p>
                      <Link href="/" className="mt-4 inline-block text-xs font-bold text-blue-500 hover:underline">
                        Explore Store Apps
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-2">
                      {downloads.map(dl => dl.app && (
                        <div key={dl.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex-shrink-0">
                              <img src={dl.app.icon_url || ''} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-700 truncate">{dl.app.name}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{dl.app.category} • v{dl.app.version}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 pl-3">
                            <span className="block text-[10px] text-slate-400 font-medium">Downloaded</span>
                            <span className="block text-[9px] text-slate-500 mt-0.5">{new Date(dl.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold font-outfit text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  Your Saved Bookmarks
                </h3>
              </div>

              {loadingData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="glass-card p-5 space-y-4 bg-white border border-gray-100 skeleton">
                      <div className="w-12 h-12 rounded-xl bg-slate-200" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-16 glass-card bg-white border border-gray-100 shadow-sm max-w-md mx-auto">
                  <Heart className="w-10 h-10 text-rose-200 mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-semibold">No favorites bookmarked yet.</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">Click the like heart button on any application details page to save it here.</p>
                  <Link href="/" className="mt-4 inline-block text-xs font-bold text-blue-500 hover:underline">
                    Browse Apps Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {favorites.map(f => f.app && (
                    <AppCard key={f.id} app={f.app as App} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Profile Fields Form */}
              <div className="lg:col-span-2 glass-card p-6 md:p-8 bg-white border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-base font-bold font-outfit text-slate-800">Edit Profile Details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Keep your account details up to date</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Username</label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Bio Description</label>
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full p-3.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-800 h-24"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Website URL</label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Avatar Image URL</label>
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={e => setAvatarUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="btn-primary py-2.5 px-6 text-xs font-semibold"
                    >
                      {saveLoading ? 'Saving Settings...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Developer Sandbox Sandbox Upgrades */}
              <div className="lg:col-span-1 space-y-6">
                {profile?.role === 'user' ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider font-outfit">
                      <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                      Developer Sandbox
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Upgrade your account to a developer role to test the APK upload workspace and portal features immediately. 
                    </p>
                    <div className="bg-white/80 border border-indigo-100/50 p-3.5 rounded-xl space-y-2">
                      <div className="flex items-start gap-2 text-[10px] text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        Upload custom Android APK files
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        Manage releases and version logs
                      </div>
                      <div className="flex items-start gap-2 text-[10px] text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        Awarded Verified Developer badge
                      </div>
                    </div>
                    <button
                      onClick={handleDeveloperUpgrade}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/10"
                    >
                      Upgrade to Developer Account
                    </button>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider font-outfit">
                      <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
                      Developer Registered
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Your account role is currently configured as a registered Developer. You have access to publish and maintain apks on the platform.
                    </p>
                    <Link
                      href="/developer-portal"
                      className="block text-center w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/10"
                    >
                      Enter Developer Portal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </LayoutShell>
  );
}
