'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { App, Profile, Report, FeaturedBanner } from '@/types';
import { useApp } from '@/context/AppContext';
import LayoutShell from '@/components/LayoutShell';
import {
  ShieldAlert,
  Users,
  Layers,
  Download,
  AlertOctagon,
  Check,
  X,
  ShieldCheck,
  Ban,
  Trash2,
  PieChart as ChartIcon,
  Search,
  Sparkles,
  Trophy,
  Upload,
  Eye,
  Calendar,
  Flame,
  Globe,
  Plus,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const { user, profile } = useApp();

  const [apps, setApps] = useState<App[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'moderate' | 'developers' | 'users' | 'reports' | 'featured_banner'>('stats');

  // Featured Banner States
  const [banners, setBanners] = useState<FeaturedBanner[]>([]);
  const [editingBanner, setEditingBanner] = useState<Partial<FeaturedBanner> | null>(null);
  const [submittingBanner, setSubmittingBanner] = useState(false);
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string>('');
  const [mobilePreview, setMobilePreview] = useState<string>('');
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [tableExists, setTableExists] = useState(true);

  // Computed variables for live preview
  const selectedApp = apps.find(a => a.id === editingBanner?.featured_app_id);
  const previewTitle = editingBanner?.custom_title || selectedApp?.name || 'Application Name';
  const previewDesc = editingBanner?.custom_description || selectedApp?.description || 'Outline app features and capabilities...';
  const previewBg = desktopPreview || editingBanner?.background_image || selectedApp?.banner_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop';
  const previewMobileBg = mobilePreview || editingBanner?.mobile_background_image || previewBg;

  // Stats Counters
  const [stats, setStats] = useState({
    users: 0,
    apps: 0,
    downloads: 0,
    developers: 0,
    reports: 0
  });

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Fetch all apps with developer
      const { data: appsData } = await supabase
        .from('apps')
        .select('*, developer:profiles(*)');
      
      const appsList = (appsData as App[]) || [];
      setApps(appsList);

      // Fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const profilesList = (profilesData as Profile[]) || [];
      setProfiles(profilesList);

      // Fetch all reports with app and reporter
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*, app:apps(*), user:profiles(*)');

      const reportsList = (reportsData as Report[]) || [];
      setReports(reportsList);

      // Fetch featured banners safely
      try {
        const { data: bannersData, error: bannersErr } = await supabase
          .from('featured_banner')
          .select('*, featured_app:apps(*)');
        
        if (bannersErr) throw bannersErr;
        setBanners((bannersData as FeaturedBanner[]) || []);
        setTableExists(true);
      } catch (bannersErr) {
        console.warn('featured_banner table query failed. Ensure schema SQL is run.', bannersErr);
        setTableExists(false);
      }

      // Aggregate Counters
      const totalDownloads = appsList.reduce((acc, a) => acc + a.download_count, 0);
      const developerCount = profilesList.filter(p => p.role === 'developer').length;

      setStats({
        users: profilesList.length,
        apps: appsList.length,
        downloads: totalDownloads,
        developers: developerCount,
        reports: reportsList.filter(r => r.status === 'pending').length
      });

    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadAdminData();
    }
  }, [profile]);

  // App moderation actions
  const handleAppStatus = async (appId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('apps')
        .update({ status: status })
        .eq('id', appId);

      if (error) throw error;

      // Find the app to notify developer
      const appItem = apps.find(a => a.id === appId);
      if (appItem) {
        await supabase.from('notifications').insert({
          user_id: appItem.developer_id,
          type: `app_${status}`,
          title: `Application ${status === 'approved' ? 'Approved!' : 'Rejected'}`,
          message: `Your application "${appItem.name}" has been ${status} by administrator.`,
          data: { app_id: appId }
        });
      }

      setApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
      alert(`App successfully ${status}!`);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Developer verification actions
  const handleDevVerification = async (devId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: isVerified })
        .eq('id', devId);

      if (error) throw error;

      // Notify developer
      if (isVerified) {
        await supabase.from('notifications').insert({
          user_id: devId,
          type: 'verification',
          title: 'Developer Verified!',
          message: 'You have been awarded the blue verified developer badge.',
          data: {}
        });
      }

      setProfiles(prev => prev.map(p => p.id === devId ? { ...p, is_verified: isVerified } : p));
      alert(`Developer verification status updated!`);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // User ban/role actions
  const handleUserRole = async (userId: string, targetRole: 'admin' | 'developer' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: targetRole })
        .eq('id', userId);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: targetRole } : p));
      alert(`User role updated to ${targetRole}!`);
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      setStats(prev => ({ ...prev, reports: Math.max(0, prev.reports - 1) }));
      alert('Report resolved!');
    } catch (err) {
      console.error(err);
    }
  };

  const startNewBanner = () => {
    setEditingBanner({
      featured_app_id: '',
      background_image: '',
      mobile_background_image: '',
      custom_title: '',
      custom_description: '',
      button_text: 'View App Details',
      button_url: '',
      is_editors_choice: false,
      is_trending: false,
      is_verified_dev: false,
      is_active: true,
      scheduled_start: '',
      scheduled_end: ''
    });
    setDesktopFile(null);
    setMobileFile(null);
    setDesktopPreview('');
    setMobilePreview('');
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this featured banner?')) return;
    try {
      const { error } = await supabase
        .from('featured_banner')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBanners(prev => prev.filter(b => b.id !== id));
      alert('Featured banner deleted successfully!');
      if (editingBanner?.id === id) {
        setEditingBanner(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete banner');
    }
  };

  // Simulated chart data
  const chartData = {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'],
    datasets: [
      {
        label: 'Platform Downloads',
        data: [15000, 24000, 31000, 48000, 69000, 85000],
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { ticks: { color: '#9ca3af' } },
      y: { ticks: { color: '#9ca3af' } }
    }
  };

  if (!user || profile?.role !== 'admin') {
    return (
      <LayoutShell>
        <div className="text-center py-20 glass-card">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-lg font-bold text-red-400">Access Denied</h2>
          <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto">
            This workspace panel requires Administrator credentials. Log in with the pre-seeded Admin account to manage resources.
          </p>
        </div>
      </LayoutShell>
    );
  }

  const pendingApps = apps.filter(a => a.status === 'pending');
  const allDevelopers = profiles.filter(p => p.role === 'developer');
  const allStandardUsers = profiles.filter(p => p.role === 'user');

  return (
    <LayoutShell>
      <div className="space-y-8 text-left max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-500" />
              Administrator Control Panel
            </h1>
            <p className="text-sm text-gray-400">App store moderator, developer verification, and platform analytics</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'stats', label: 'Stats Hub' },
              { id: 'moderate', label: `App Moderation (${pendingApps.length})` },
              { id: 'developers', label: 'Verifications' },
              { id: 'users', label: 'User Roles' },
              { id: 'reports', label: `Reports (${reports.filter(r => r.status === 'pending').length})` },
              { id: 'featured_banner', label: 'Featured Banner' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                    : 'bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin"></div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest animate-pulse">Syncing Database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'stats' && (
              <div className="space-y-8">
                {/* Metrics Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: 'Total Users', count: stats.users, icon: Users, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
                    { label: 'Applications', count: stats.apps, icon: Layers, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
                    { label: 'Downloads', count: stats.downloads, icon: Download, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Developers', count: stats.developers, icon: ShieldCheck, color: 'text-violet-500 bg-violet-500/10 border-violet-500/20' },
                    { label: 'Pending Reports', count: stats.reports, icon: AlertOctagon, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' }
                  ].map((m, i) => {
                    const Icon = m.icon;
                    return (
                      <div key={i} className="glass-card p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${m.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-lg font-bold font-outfit text-gray-900 dark:text-white">{m.count.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">{m.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Platform Download Analytics chart */}
                <div className="glass-card p-6 space-y-4">
                  <h3 className="text-md font-bold font-outfit flex items-center gap-1.5">
                    <ChartIcon className="w-5 h-5 text-red-500" />
                    Overall Download Volume Trends
                  </h3>
                  <div className="h-72 flex items-center justify-center">
                    <Line data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* App Submissions Moderation Tab */}
            {activeTab === 'moderate' && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-md font-bold font-outfit">App Submission Approvals</h3>
                {pendingApps.length === 0 ? (
                  <p className="text-xs text-gray-500 py-12 text-center">No pending applications for review.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5 space-y-4">
                    {pendingApps.map(app => (
                      <div key={app.id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-xl bg-slate-900 overflow-hidden border border-white/5">
                            <img src={app.icon_url || ''} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white font-outfit">{app.name}</h4>
                            <p className="text-[10px] text-gray-500">v{app.version} • {app.category} • Developer: {app.developer?.full_name}</p>
                            <p className="text-xs text-gray-400 mt-2 max-w-xl line-clamp-2 leading-relaxed">{app.description}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                          <button
                            onClick={() => handleAppStatus(app.id, 'approved')}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold transition-all"
                          >
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => handleAppStatus(app.id, 'rejected')}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all"
                          >
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Developer Verification Badge Tab */}
            {activeTab === 'developers' && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-md font-bold font-outfit">Developer Verification Panel</h3>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {allDevelopers.length === 0 ? (
                    <p className="text-xs text-gray-500 py-12 text-center">No developers registered in the database.</p>
                  ) : (
                    allDevelopers.map(dev => (
                      <div key={dev.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-xs uppercase text-gray-400">
                            {dev.avatar_url ? <img src={dev.avatar_url} alt="" className="w-full h-full object-cover" /> : dev.username?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                              {dev.full_name}
                              {dev.is_verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                            </p>
                            <span className="text-[10px] text-gray-500">@{dev.username} • {dev.website_url}</span>
                          </div>
                        </div>

                        <div>
                          {dev.is_verified ? (
                            <button
                              onClick={() => handleDevVerification(dev.id, false)}
                              className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 text-yellow-500 rounded-lg text-[10px] font-bold transition-all"
                            >
                              Revoke Blue Tick
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDevVerification(dev.id, true)}
                              className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold transition-all"
                            >
                              Grant Blue Tick
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* User Roles Management Tab */}
            {activeTab === 'users' && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-md font-bold font-outfit">User Role Moderation</h3>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {allStandardUsers.map(usr => (
                    <div key={usr.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-xs uppercase text-gray-400">
                          {usr.avatar_url ? <img src={usr.avatar_url} alt="" className="w-full h-full object-cover" /> : usr.username?.[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{usr.full_name}</p>
                          <span className="text-[10px] text-gray-500">@{usr.username}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUserRole(usr.id, 'developer')}
                          className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-semibold transition-all"
                        >
                          Make Developer
                        </button>
                        <button
                          onClick={() => handleUserRole(usr.id, 'admin')}
                          className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-semibold transition-all"
                        >
                          Make Admin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Filed Tab */}
            {activeTab === 'reports' && (
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-md font-bold font-outfit">Submitted Bug & Infringement Reports</h3>
                {reports.length === 0 ? (
                  <p className="text-xs text-gray-500 py-12 text-center">No reports filed yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-white/5 space-y-4">
                    {reports.map(rep => (
                      <div key={rep.id} className="pt-4 first:pt-0 flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">
                              {rep.reason}
                            </span>
                            <span className="text-xs text-gray-400">App: <strong>{rep.app?.name}</strong></span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pt-1">
                            {rep.details}
                          </p>
                          <p className="text-[9px] text-gray-500">Filed by @{rep.user?.username} on {new Date(rep.created_at).toLocaleDateString()}</p>
                        </div>

                        <div>
                          {rep.status === 'pending' ? (
                            <button
                              onClick={() => handleResolveReport(rep.id)}
                              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold transition-all"
                            >
                              Mark Resolved
                            </button>
                          ) : (
                            <span className="inline-block text-[9px] font-bold uppercase text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded">
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Featured Banner Tab Logic & UI */}
            {activeTab === 'featured_banner' && (
              <div className="space-y-6">
                {!tableExists ? (
                  <div className="glass-card p-6 text-center space-y-4 border-amber-500/25 bg-amber-500/5">
                    <AlertOctagon className="w-12 h-12 text-amber-500 mx-auto animate-pulse" />
                    <h3 className="text-md font-bold text-amber-400 font-outfit uppercase">Database Table Missing</h3>
                    <p className="text-xs text-gray-400 max-w-lg mx-auto leading-relaxed">
                      The table <code>featured_banner</code> does not exist in your Supabase database yet. 
                      Please execute the SQL commands below in your Supabase SQL Editor to initialize the table and configure permissions.
                    </p>
                    <div className="max-w-xl mx-auto p-4 bg-black/40 rounded-lg text-left overflow-x-auto text-[10px] text-gray-300 font-mono select-all border border-white/5 whitespace-pre">
{`CREATE TABLE IF NOT EXISTS featured_banner (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    featured_app_id uuid REFERENCES apps(id) ON DELETE CASCADE,
    background_image text,
    mobile_background_image text,
    custom_title text,
    custom_description text,
    button_text text DEFAULT 'View App Details',
    button_url text,
    is_editors_choice boolean DEFAULT false,
    is_trending boolean DEFAULT false,
    is_verified_dev boolean DEFAULT false,
    is_active boolean DEFAULT true,
    scheduled_start timestamp with time zone,
    scheduled_end timestamp with time zone,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE featured_banner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON featured_banner FOR SELECT USING (true);
CREATE POLICY "Allow admin all" ON featured_banner FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND role = 'admin')
);`}
                    </div>
                    <button 
                      onClick={loadAdminData}
                      className="px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-all"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : editingBanner ? (
                  /* Form and live preview layout */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Form Controls Column */}
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!editingBanner.featured_app_id) {
                        alert('Please select an application.');
                        return;
                      }
                      setSubmittingBanner(true);
                      try {
                        let bgUrl = editingBanner.background_image || '';
                        let mobileBgUrl = editingBanner.mobile_background_image || '';

                        // Upload Desktop Banner if changed
                        if (desktopFile) {
                          const fileExt = desktopFile.name.split('.').pop();
                          const fileName = `desktop_${Math.random().toString(36).substring(2)}.${fileExt}`;
                          const filePath = `banners/${user?.id}/${fileName}`;
                          const { error } = await supabase.storage.from('app-images').upload(filePath, desktopFile, { cacheControl: '3600', upsert: true });
                          if (error) throw error;
                          bgUrl = supabase.storage.from('app-images').getPublicUrl(filePath).data.publicUrl;
                        }

                        // Upload Mobile Banner if changed
                        if (mobileFile) {
                          const fileExt = mobileFile.name.split('.').pop();
                          const fileName = `mobile_${Math.random().toString(36).substring(2)}.${fileExt}`;
                          const filePath = `banners/${user?.id}/${fileName}`;
                          const { error } = await supabase.storage.from('app-images').upload(filePath, mobileFile, { cacheControl: '3600', upsert: true });
                          if (error) throw error;
                          mobileBgUrl = supabase.storage.from('app-images').getPublicUrl(filePath).data.publicUrl;
                        }

                        const payload = {
                          featured_app_id: editingBanner.featured_app_id,
                          background_image: bgUrl || null,
                          mobile_background_image: mobileBgUrl || bgUrl || null,
                          custom_title: editingBanner.custom_title || null,
                          custom_description: editingBanner.custom_description || null,
                          button_text: editingBanner.button_text || 'View App Details',
                          button_url: editingBanner.button_url || null,
                          is_editors_choice: !!editingBanner.is_editors_choice,
                          is_trending: !!editingBanner.is_trending,
                          is_verified_dev: !!editingBanner.is_verified_dev,
                          is_active: !!editingBanner.is_active,
                          scheduled_start: editingBanner.scheduled_start || null,
                          scheduled_end: editingBanner.scheduled_end || null,
                          updated_at: new Date().toISOString()
                        };

                        if (editingBanner.id) {
                          const { data, error } = await supabase
                            .from('featured_banner')
                            .update(payload)
                            .eq('id', editingBanner.id)
                            .select('*, featured_app:apps(*)')
                            .single();
                          if (error) throw error;
                          setBanners(prev => prev.map(b => b.id === editingBanner.id ? (data as FeaturedBanner) : b));
                          alert('Banner updated successfully!');
                        } else {
                          const { data, error } = await supabase
                            .from('featured_banner')
                            .insert(payload)
                            .select('*, featured_app:apps(*)')
                            .single();
                          if (error) throw error;
                          setBanners(prev => [data as FeaturedBanner, ...prev]);
                          alert('Banner created successfully!');
                        }

                        setEditingBanner(null);
                        setDesktopFile(null);
                        setMobileFile(null);
                        setDesktopPreview('');
                        setMobilePreview('');
                      } catch (err: any) {
                        alert(err.message || 'Failed to save banner settings');
                      } finally {
                        setSubmittingBanner(false);
                      }
                    }} className="lg:col-span-7 glass-card p-6 space-y-6">
                      <h3 className="text-md font-bold font-outfit border-b border-gray-100 dark:border-white/5 pb-3">
                        {editingBanner.id ? 'Edit Featured Banner' : 'Create New Featured Banner'}
                      </h3>

                      <div className="space-y-4">
                        {/* Selected Approved App */}
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Application</label>
                          <select
                            required
                            value={editingBanner.featured_app_id || ''}
                            onChange={(e) => {
                              const appId = e.target.value;
                              const selectedApp = apps.find(a => a.id === appId);
                              setEditingBanner(prev => ({
                                ...prev,
                                featured_app_id: appId,
                                custom_title: prev?.custom_title || selectedApp?.name || '',
                                custom_description: prev?.custom_description || selectedApp?.description || ''
                              }));
                            }}
                            className="w-full px-3 py-2 text-xs glass-input select-arrow"
                          >
                            <option value="">-- Choose an approved app --</option>
                            {apps.filter(a => a.status === 'approved').map(app => (
                              <option key={app.id} value={app.id}>{app.name} (By @{app.developer?.username})</option>
                            ))}
                          </select>
                        </div>

                        {/* Graphic Uploads */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Desktop Background (.jpg/.png)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setDesktopFile(file);
                                if (file) setDesktopPreview(URL.createObjectURL(file));
                              }}
                              className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mobile Background (Optional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setMobileFile(file);
                                if (file) setMobilePreview(URL.createObjectURL(file));
                              }}
                              className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                            />
                          </div>
                        </div>

                        {/* Text Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Custom Title (Overrides app name)</label>
                            <input
                              type="text"
                              value={editingBanner.custom_title || ''}
                              onChange={(e) => setEditingBanner(prev => ({ ...prev, custom_title: e.target.value }))}
                              placeholder="e.g. FitPulse Premium"
                              className="w-full px-3 py-2 text-xs glass-input"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">CTA Button Text</label>
                            <input
                              type="text"
                              value={editingBanner.button_text || ''}
                              onChange={(e) => setEditingBanner(prev => ({ ...prev, button_text: e.target.value }))}
                              placeholder="View App Details"
                              className="w-full px-3 py-2 text-xs glass-input"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Custom Description (Overrides description)</label>
                          <textarea
                            value={editingBanner.custom_description || ''}
                            onChange={(e) => setEditingBanner(prev => ({ ...prev, custom_description: e.target.value }))}
                            placeholder="Brief catchy phrase showing key features on the banner..."
                            className="w-full p-3 text-xs glass-input h-20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">CTA Redirect Link (Optional)</label>
                          <input
                            type="text"
                            value={editingBanner.button_url || ''}
                            onChange={(e) => setEditingBanner(prev => ({ ...prev, button_url: e.target.value }))}
                            placeholder="Leave blank to use app details page"
                            className="w-full px-3 py-2 text-xs glass-input"
                          />
                        </div>

                        {/* Badges and Config */}
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Banner Badges</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              { key: 'is_editors_choice', label: "Editor's Choice" },
                              { key: 'is_trending', label: 'Trending App' },
                              { key: 'is_verified_dev', label: 'Verified Dev' },
                              { key: 'is_active', label: 'Banner Active' }
                            ].map(badge => (
                              <label key={badge.key} className="flex items-center gap-2 px-3 py-2 border border-white/5 bg-white/5 rounded-lg text-[10px] font-bold text-gray-300 select-none cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!(editingBanner as any)[badge.key]}
                                  onChange={(e) => setEditingBanner(prev => ({ ...prev, [badge.key]: e.target.checked }))}
                                  className="rounded text-red-500 bg-[#0d1220] border-white/10"
                                />
                                {badge.label}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Scheduling dates */}
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Schedule Timeframe (Optional)</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold mb-1">Start Date</span>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                  type="datetime-local"
                                  value={editingBanner.scheduled_start ? editingBanner.scheduled_start.substring(0, 16) : ''}
                                  onChange={(e) => setEditingBanner(prev => ({ ...prev, scheduled_start: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                                  className="w-full pl-9 pr-3 py-2 text-xs glass-input"
                                />
                              </div>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-semibold mb-1">End Date</span>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                  type="datetime-local"
                                  value={editingBanner.scheduled_end ? editingBanner.scheduled_end.substring(0, 16) : ''}
                                  onChange={(e) => setEditingBanner(prev => ({ ...prev, scheduled_end: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                                  className="w-full pl-9 pr-3 py-2 text-xs glass-input"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBanner(null);
                            setDesktopPreview('');
                            setMobilePreview('');
                            setDesktopFile(null);
                            setMobileFile(null);
                          }}
                          className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingBanner}
                          className="btn-primary py-2 px-6 text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 border border-red-500/20"
                        >
                          {submittingBanner ? 'Saving...' : 'Save Banner'}
                        </button>
                      </div>
                    </form>

                    {/* Live Preview Column */}
                    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-outfit uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-red-500" />
                          Live Layout Preview
                        </span>
                        
                        <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-[10px]">
                          <button
                            onClick={() => setPreviewViewport('desktop')}
                            className={`px-3 py-1 rounded-md font-semibold transition-all ${
                              previewViewport === 'desktop' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            Desktop
                          </button>
                          <button
                            onClick={() => setPreviewViewport('mobile')}
                            className={`px-3 py-1 rounded-md font-semibold transition-all ${
                              previewViewport === 'mobile' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            Mobile
                          </button>
                        </div>
                      </div>

                      {/* Mockup Renderer */}
                      <div className="w-full flex items-center justify-center p-4 bg-black/40 border border-white/5 rounded-2xl">
                        {previewViewport === 'desktop' ? (
                          /* Desktop Live Preview */
                          <div className="relative w-full h-[220px] rounded-2xl overflow-hidden shadow-2xl flex items-center p-6 border border-white/10">
                            {/* Background image & gradient overlay */}
                            <div className="absolute inset-0 z-0">
                              <img
                                src={previewBg}
                                alt="desktop-bg-preview"
                                className="w-full h-full object-cover opacity-40"
                              />
                              <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19] via-[#0b0f19]/90 to-transparent" />
                            </div>

                            {/* Content overlay */}
                            <div className="relative z-10 space-y-3 max-w-sm text-left">
                              <div className="flex flex-wrap gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[9px] font-bold uppercase tracking-wider">
                                  <Sparkles className="w-2.5 h-2.5" /> Featured
                                </span>
                                {editingBanner.is_editors_choice && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[9px] font-bold uppercase tracking-wider">
                                    <Trophy className="w-2.5 h-2.5 text-yellow-400" /> Editor's Choice
                                  </span>
                                )}
                                {editingBanner.is_trending && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[9px] font-bold uppercase tracking-wider">
                                    <Flame className="w-2.5 h-2.5" /> Trending
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0">
                                  <img src={selectedApp?.icon_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100'} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-md font-extrabold text-white font-outfit truncate">{previewTitle}</h4>
                                  <p className="text-[10px] text-gray-300 flex items-center gap-1 mt-0.5 truncate">
                                    By {selectedApp?.developer?.full_name || 'Developer'}
                                    {(editingBanner.is_verified_dev || selectedApp?.developer?.is_verified) && (
                                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                    )}
                                  </p>
                                </div>
                              </div>

                              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{previewDesc}</p>

                              <div className="flex gap-2">
                                <button type="button" className="btn-primary py-1.5 px-4 font-bold text-[10px] bg-gradient-to-r from-blue-500 to-indigo-600 shadow-none pointer-events-none">
                                  {editingBanner.button_text || 'View App Details'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Mobile Live Preview */
                          <div className="relative w-[280px] h-[340px] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-end p-5 border border-white/10">
                            {/* Background image & gradient overlay */}
                            <div className="absolute inset-0 z-0">
                              <img
                                src={previewMobileBg}
                                alt="mobile-bg-preview"
                                className="w-full h-full object-cover opacity-45"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/70 to-[#0b0f19]/20" />
                            </div>

                            {/* Content overlay */}
                            <div className="relative z-10 space-y-2.5 text-left">
                              <div className="flex flex-wrap gap-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[8px] font-bold uppercase tracking-wider">
                                  Featured
                                </span>
                                {editingBanner.is_editors_choice && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[8px] font-bold uppercase tracking-wider">
                                    Editor's Choice
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0">
                                  <img src={selectedApp?.icon_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100'} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-white font-outfit truncate">{previewTitle}</h4>
                                  <p className="text-[8px] text-gray-300 flex items-center gap-0.5 mt-0.5 truncate">
                                    @{selectedApp?.developer?.username || 'developer'}
                                    {(editingBanner.is_verified_dev || selectedApp?.developer?.is_verified) && (
                                      <ShieldCheck className="w-3 h-3 text-blue-400" />
                                    )}
                                  </p>
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-400 line-clamp-3 leading-relaxed">{previewDesc}</p>

                              <button type="button" className="w-full btn-primary py-1.5 px-3 font-bold text-[9px] bg-gradient-to-r from-blue-500 to-indigo-600 shadow-none pointer-events-none text-center justify-center">
                                {editingBanner.button_text || 'View App Details'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Banner list view */
                  <div className="glass-card p-6 space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-3">
                      <div>
                        <h3 className="text-md font-bold font-outfit">Featured Banners</h3>
                        <p className="text-xs text-gray-500">Enable, schedule, and configure homepage showcase hero sections</p>
                      </div>
                      <button
                        onClick={startNewBanner}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-4 h-4" /> Create New Banner
                      </button>
                    </div>

                    {banners.length === 0 ? (
                      <div className="text-center py-16 text-xs text-gray-500 space-y-1.5">
                        <Sparkles className="w-8 h-8 text-gray-500 mx-auto animate-pulse" />
                        <p>No featured application banners set up yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {banners.map((b) => (
                          <div key={b.id} className="p-4 border border-white/5 bg-[#131926]/40 rounded-2xl flex flex-col justify-between gap-4">
                            <div className="flex gap-3">
                              <div className="w-12 h-12 rounded-lg bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0">
                                <img src={b.featured_app?.icon_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-bold text-white font-outfit truncate">
                                    {b.custom_title || b.featured_app?.name}
                                  </h4>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                    b.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500'
                                  }`}>
                                    {b.is_active ? 'Active' : 'Disabled'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                                  {b.custom_description || b.featured_app?.description}
                                </p>
                              </div>
                            </div>

                            {/* Info & schedule line */}
                            <div className="border-t border-white/5 pt-3 flex items-center justify-between text-[10px] text-gray-400">
                              <div>
                                {b.scheduled_start || b.scheduled_end ? (
                                  <span className="flex items-center gap-1 text-[9px] text-yellow-500/80 font-medium">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {b.scheduled_start ? new Date(b.scheduled_start).toLocaleDateString() : 'Now'} - {b.scheduled_end ? new Date(b.scheduled_end).toLocaleDateString() : '∞'}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-emerald-400 font-medium uppercase tracking-wide">Always Active</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingBanner({ ...b });
                                    setDesktopPreview(b.background_image || '');
                                    setMobilePreview(b.mobile_background_image || '');
                                    setDesktopFile(null);
                                    setMobileFile(null);
                                  }}
                                  className="px-2 py-1 bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/20 text-blue-400 rounded-md text-[9px] font-semibold transition-all"
                                >
                                  Edit Settings
                                </button>
                                <button
                                  onClick={() => handleDeleteBanner(b.id)}
                                  className="px-2 py-1 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 text-red-400 rounded-md text-[9px] font-semibold transition-all"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </LayoutShell>
  );
}
