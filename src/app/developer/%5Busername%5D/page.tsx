'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { App, Profile } from '@/types';
import { useApp } from '@/context/AppContext';
import LayoutShell from '@/components/LayoutShell';
import AppCard from '@/components/AppCard';
import { ShieldCheck, UserPlus, UserMinus, Globe, Download, Heart, ArrowLeft, FolderCode } from 'lucide-react';
import Link from 'next/link';

interface DeveloperPageProps {
  params: Promise<{ username: string }>;
}

export default function DeveloperProfilePage({ params }: DeveloperPageProps) {
  const { username } = use(params);
  const { user, profile: currentUserProfile } = useApp();

  const [developer, setDeveloper] = useState<Profile | null>(null);
  const [devApps, setDevApps] = useState<App[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  useEffect(() => {
    async function loadDeveloperData() {
      try {
        setLoading(true);
        // Fetch developer profile
        const { data: devData, error: devError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (devError) throw devError;
        const currentDev = devData as Profile;
        setDeveloper(currentDev);

        // Fetch developer approved apps
        const { data: appsData } = await supabase
          .from('apps')
          .select('*, developer:profiles(*)')
          .eq('developer_id', currentDev.id)
          .eq('status', 'approved');
        
        const appsList = (appsData as App[]) || [];
        setDevApps(appsList);

        // Sum downloads and likes
        const dlSum = appsList.reduce((acc, a) => acc + a.download_count, 0);
        const lkSum = appsList.reduce((acc, a) => acc + a.likes_count, 0);
        setTotalDownloads(dlSum);
        setTotalLikes(lkSum);

        // Fetch followers
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('following_id', currentDev.id);

        setFollowersCount(followData?.length || 0);

        // Check if current user is following
        if (user) {
          const userFollow = followData?.find(f => f.follower_id === user.id);
          setIsFollowing(!!userFollow);
        }

      } catch (err) {
        console.error('Error loading developer details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDeveloperData();
  }, [username, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Please sign in to follow developers.');
      return;
    }
    if (!developer) return;

    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', developer.id);
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: developer.id
          });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);

        // Notify developer
        if (developer.id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: developer.id,
            type: 'follow',
            title: 'New Follower!',
            message: `${currentUserProfile?.full_name || 'A user'} followed you`,
            data: { sender_id: user.id }
          });
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (loading) {
    return (
      <LayoutShell>
        <div className="space-y-8 animate-pulse text-left max-w-5xl mx-auto">
          {/* Cover Header Skeleton */}
          <div className="h-32 md:h-44 w-full bg-slate-200 rounded-3xl" />
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 -mt-16 mx-4 relative z-10 bg-white border border-gray-100">
            <div className="w-24 h-24 rounded-full bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto md:mx-0" />
              <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto md:mx-0" />
              <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto md:mx-0" />
            </div>
            <div className="h-10 bg-slate-200 rounded w-32 md:ml-auto" />
          </div>

          {/* Projects Skeleton Grid */}
          <div className="space-y-5 pt-4">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="glass-card p-5 space-y-4 bg-white border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-slate-200" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutShell>
    );
  }

  if (!developer) {
    return (
      <LayoutShell>
        <div className="text-center py-20 max-w-xl mx-auto glass-card bg-white border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Developer Profile Not Found</h2>
          <p className="text-slate-500 mt-2 text-sm">The developer profile you are looking for does not exist.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8 text-left max-w-5xl mx-auto">
        
        {/* Back Navigation */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        {/* Developer Header Cover Deck */}
        <div className="relative w-full rounded-3xl overflow-hidden">
          <div className="h-32 md:h-44 w-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/15" />
          
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left -mt-16 mx-4 relative z-10 bg-white border border-gray-100 shadow-sm">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-blue-600 font-extrabold text-3xl uppercase">
                {developer.avatar_url ? (
                  <img src={developer.avatar_url} alt={developer.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  developer.username?.[0] || 'D'
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-extrabold font-outfit text-slate-800 tracking-tight">
                  {developer.full_name}
                </h1>
                {developer.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-500/25 select-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    Verified Developer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold">@{developer.username}</p>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                {developer.bio || 'Verified application developer on Modded Team.'}
              </p>

              {/* Links and Actions */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {developer.website_url && (
                  <a
                    href={developer.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
                {developer.github_url && (
                  <a
                    href={developer.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:underline bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                    </svg>
                    GitHub
                  </a>
                )}
                {developer.twitter_url && (
                  <a
                    href={developer.twitter_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sky-600 font-semibold hover:underline bg-sky-500/5 px-2.5 py-1 rounded-lg border border-sky-500/10"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Twitter
                  </a>
                )}
                {developer.id !== user?.id && (
                  <button
                    onClick={handleFollowToggle}
                    className={`btn-primary py-1 px-4 text-xs font-bold ${
                      isFollowing
                        ? 'bg-rose-500/10 border border-rose-500/25 text-rose-500 hover:bg-rose-500/20 shadow-none'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="w-3.5 h-3.5" /> Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> Follow
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Aggregate Stats */}
            <div className="flex gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-6 text-center md:text-right flex-shrink-0 select-none">
              <div>
                <p className="text-xl font-extrabold text-slate-800 font-outfit">{totalDownloads.toLocaleString()}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-end mt-0.5">
                  <Download className="w-3 h-3 text-slate-400" />
                  Downloads
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 font-outfit">{totalLikes.toLocaleString()}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-end mt-0.5">
                  <Heart className="w-3 h-3 text-rose-500" />
                  Likes
                </p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-800 font-outfit">{followersCount}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Followers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Published Applications Grid */}
        <div className="space-y-5 pt-4">
          <h2 className="text-lg font-bold font-outfit tracking-tight text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FolderCode className="w-5 h-5 text-blue-500" />
            Published Applications ({devApps.length})
          </h2>
          {devApps.length === 0 ? (
            <div className="text-center py-16 glass-card bg-white border border-gray-100">
              <p className="text-slate-400 text-xs font-semibold">No applications published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {devApps.map(app => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>

      </div>
    </LayoutShell>
  );
}
