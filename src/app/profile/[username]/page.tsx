'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { App, Profile } from '@/types';
import { useApp } from '@/context/AppContext';
import LayoutShell from '@/components/LayoutShell';
import AppCard from '@/components/AppCard';
import { 
  ShieldCheck, 
  Globe, 
  Download, 
  Heart, 
  ArrowLeft, 
  FolderCode, 
  Flag,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react';
import Link from 'next/link';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function PublicUserProfilePage({ params }: PublicProfilePageProps) {
  const { username } = use(params);
  const { user, profile: currentUserProfile } = useApp();

  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [userApps, setUserApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  // Report Modal States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setLoading(true);
        // Fetch target user profile by username
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (userError) throw userError;
        const currentTarget = userData as Profile;
        setTargetUser(currentTarget);

        // Fetch their approved apps
        const { data: appsData } = await supabase
          .from('apps')
          .select('*, developer:profiles(*)')
          .eq('developer_id', currentTarget.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        
        const appsList = (appsData as App[]) || [];
        setUserApps(appsList);

        // Sum downloads and likes
        const dlSum = appsList.reduce((acc, a) => acc + a.download_count, 0);
        const lkSum = appsList.reduce((acc, a) => acc + a.likes_count, 0);
        setTotalDownloads(dlSum);
        setTotalLikes(lkSum);

      } catch (err) {
        console.error('Error loading public profile details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [username]);

  const handleReportUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    setSubmittingReport(true);

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          user_id: user ? user.id : null, // Reporter
          reported_user_id: targetUser.id, // Reported User
          app_id: null,
          reason: reportReason,
          details: reportDetails,
          status: 'pending'
        });

      if (error) throw error;
      alert('User report submitted successfully to administrators.');
      setReportModalOpen(false);
      setReportDetails('');
      setReportReason('Spam');
    } catch (err: any) {
      alert(err.message || 'Failed to submit report.');
    } finally {
      setSubmittingReport(false);
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
        </div>
      </LayoutShell>
    );
  }

  if (!targetUser) {
    return (
      <LayoutShell>
        <div className="text-center py-20 max-w-xl mx-auto glass-card bg-white border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">User Profile Not Found</h2>
          <p className="text-slate-500 mt-2 text-sm">The user profile you are looking for does not exist.</p>
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

        {/* User Cover Deck */}
        <div className="relative w-full rounded-3xl overflow-hidden">
          <div className="h-32 md:h-44 w-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/15" />
          
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left -mt-16 mx-4 relative z-10 bg-white border border-gray-100 shadow-sm">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-md flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center text-blue-600 font-extrabold text-3xl uppercase">
                {targetUser.avatar_url ? (
                  <img src={targetUser.avatar_url} alt={targetUser.full_name || ''} className="w-full h-full object-cover" />
                ) : (
                  targetUser.username?.[0] || 'U'
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 space-y-2 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl font-extrabold font-outfit text-slate-800 tracking-tight">
                  {targetUser.full_name || 'Anonymous User'}
                </h1>
                {targetUser.role === 'developer' && targetUser.is_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-500/10 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-500/25 select-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    Verified Developer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-semibold">@{targetUser.username}</p>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                {targetUser.bio || 'App creator & community member on Modded Team.'}
              </p>

              {/* Links and Actions */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {targetUser.website_url && (
                  <a
                    href={targetUser.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/10"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Joined: {new Date(targetUser.created_at).toLocaleDateString()}</span>
                </div>

                {targetUser.id !== user?.id && (
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold hover:bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors ml-auto md:ml-0"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Report User
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
                <p className="text-xl font-extrabold text-slate-800 font-outfit">{userApps.length}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Apps Uploaded</p>
              </div>
            </div>
          </div>
        </div>

        {/* Published Applications Grid */}
        <div className="space-y-5 pt-4">
          <h2 className="text-lg font-bold font-outfit tracking-tight text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FolderCode className="w-5 h-5 text-blue-500" />
            Recent Uploaded Applications ({userApps.length})
          </h2>
          {userApps.length === 0 ? (
            <div className="text-center py-16 glass-card bg-white border border-gray-100">
              <p className="text-slate-400 text-xs font-semibold">No applications uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {userApps.map(app => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Report User Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#131926] rounded-2xl max-w-md w-full p-6 border border-gray-100 dark:border-white/10 shadow-2xl relative">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white font-outfit">Report Profile</h3>
                <p className="text-xs text-gray-400">Help moderators keep Modded Team Store safe</p>
              </div>
            </div>

            <form onSubmit={handleReportUserSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-800 dark:text-white dark:bg-[#0d1220]"
                >
                  <option value="Spam">Spam</option>
                  <option value="Fake Apps">Fake Apps</option>
                  <option value="Copyright Violation">Copyright Violation</option>
                  <option value="Abuse">Abuse</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Details (Optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide additional details or links to support your report..."
                  className="w-full p-3 text-xs border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-slate-800 dark:text-white dark:bg-[#0d1220] h-24"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-gray-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-rose-600/10"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </LayoutShell>
  );
}
