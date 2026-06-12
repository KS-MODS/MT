'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { App, Profile } from '@/types';
import { useApp } from '@/context/AppContext';
import LayoutShell from '@/components/LayoutShell';
import {
  FolderCode,
  Upload,
  LineChart as ChartIcon,
  TrendingUp,
  FileCode,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  DollarSign,
  Layers,
  ArrowUpRight,
  Heart,
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

export default function DeveloperPortal() {
  const { user, profile, loading: authLoading } = useApp();
  const router = useRouter();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my_apps' | 'upload'>('my_apps');

  // Stats
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);

  // Form State
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [category, setCategory] = useState('Games');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [changelog, setChangelog] = useState('');
  
  // File upload states
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    async function loadDeveloperApps() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('apps')
          .select('*')
          .eq('developer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const appsList = (data as App[]) || [];
        setApps(appsList);

        // Sum downloads and likes
        const dlSum = appsList.reduce((acc, a) => acc + a.download_count, 0);
        const lkSum = appsList.reduce((acc, a) => acc + a.likes_count, 0);
        setTotalDownloads(dlSum);
        setTotalLikes(lkSum);

      } catch (err) {
        console.error('Error fetching apps:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDeveloperApps();
  }, [user]);

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    if (!user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.error(`Error uploading file to ${bucket}:`, error);
      return null;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleAppUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (profile.role !== 'developer' && profile.role !== 'admin') {
      alert('Only registered developers can upload applications.');
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);

    try {
      let iconUrl = '';
      let bannerUrl = '';
      let apkUrl = '';

      // Upload icon
      if (iconFile) {
        setUploadProgress(30);
        const url = await uploadFile(iconFile, 'app-images');
        if (url) iconUrl = url;
      }

      // Upload banner
      if (bannerFile) {
        setUploadProgress(60);
        const url = await uploadFile(bannerFile, 'app-images');
        if (url) bannerUrl = url;
      }

      // Upload APK
      if (apkFile) {
        setUploadProgress(85);
        const url = await uploadFile(apkFile, 'apks');
        if (url) apkUrl = url;
      }

      setUploadProgress(95);

      // Create slug from name
      const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Insert app record
      const { data, error } = await supabase
        .from('apps')
        .insert({
          developer_id: user.id,
          name: appName,
          slug: slug,
          description: description,
          version: version,
          category: category,
          website_url: websiteUrl || null,
          changelog: changelog || null,
          icon_url: iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=100&auto=format&fit=crop',
          banner_url: bannerUrl || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
          apk_url: apkUrl || null,
          status: 'pending' // Admin must approve
        })
        .select()
        .single();

      if (error) throw error;

      // Add to screenshot gallery if banner uploaded
      if (bannerUrl && data) {
        await supabase.from('screenshots').insert({
          app_id: data.id,
          image_url: bannerUrl
        });
      }

      alert('App uploaded successfully! It is now pending administrator review.');
      
      // Reset form
      setAppName('');
      setDescription('');
      setVersion('1.0.0');
      setWebsiteUrl('');
      setChangelog('');
      setIconFile(null);
      setBannerFile(null);
      setApkFile(null);
      setActiveTab('my_apps');
      
      // Reload apps list
      const updatedApps = [data as App, ...apps];
      setApps(updatedApps);

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Application submission failed.');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Simulated Analytics Chart Data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Downloads Trend',
        data: [1200, 1900, 3200, 5000, 7100, totalDownloads || 9400],
        fill: true,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Likes Growth',
        data: [400, 600, 850, 1100, 1500, totalLikes || 1800],
        fill: true,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#9ca3af' }
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
      y: { ticks: { color: '#9ca3af' } }
    }
  };

  if (!user || (profile?.role !== 'developer' && profile?.role !== 'admin')) {
    return (
      <LayoutShell>
        <div className="text-center py-20 glass-card">
          <FolderCode className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold">Developer Access Only</h2>
          <p className="text-gray-400 mt-2 text-sm max-w-sm mx-auto">
            You must upgrade your account status to a Developer to upload packages. Go to your Profile page to register.
          </p>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8 text-left max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <FolderCode className="w-6 h-6 text-blue-500" />
              Developer Management Hub
            </h1>
            <p className="text-sm text-gray-400">Manage packages, submissions, and view download metrics</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('my_apps')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === 'my_apps'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === 'upload'
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                  : 'bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              Submit New App
            </button>
          </div>
        </div>

        {/* Analytics Summary Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white font-outfit">{totalDownloads.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Downloads</p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Heart className="w-6 h-6 fill-rose-500/25" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white font-outfit">{totalLikes.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total App Likes</p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white font-outfit">{apps.length}</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Apps Uploaded</p>
            </div>
          </div>

          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white font-outfit">$0.00</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Ad Revenue</p>
            </div>
          </div>
        </div>

        {activeTab === 'my_apps' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Column */}
            <div className="lg:col-span-2 glass-card p-6 space-y-4">
              <h3 className="text-md font-bold font-outfit tracking-tight flex items-center gap-1.5">
                <ChartIcon className="w-5 h-5 text-blue-500" />
                Performance Analytics
              </h3>
              <div className="h-72 flex items-center justify-center">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Application List Sidebar */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-md font-bold font-outfit tracking-tight">App Status Logs</h3>
              <div className="divide-y divide-gray-100 dark:divide-white/5 pr-1 max-h-[300px] overflow-y-auto">
                {apps.length === 0 ? (
                  <p className="text-xs text-gray-500 py-8 text-center">No apps created yet.</p>
                ) : (
                  apps.map((app) => (
                    <div key={app.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded bg-slate-800 border border-white/5 overflow-hidden flex-shrink-0">
                          <img src={app.icon_url || ''} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate text-gray-900 dark:text-white">{app.name}</h4>
                          <span className="block text-[9px] text-gray-500">v{app.version} • {app.category}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {app.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        )}
                        {app.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {app.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3 h-3" /> Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Table layout of app data */}
            <div className="lg:col-span-3 glass-card p-6 overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-400 border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 pb-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    <th className="py-2.5">App Detail</th>
                    <th>Category</th>
                    <th>Version</th>
                    <th>Downloads</th>
                    <th>Likes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {apps.map((app) => (
                    <tr key={app.id} className="hover:bg-white/5">
                      <td className="py-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden border border-white/5">
                          <img src={app.icon_url || ''} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{app.name}</p>
                          <span className="text-[10px] text-gray-500">Slug: {app.slug}</span>
                        </div>
                      </td>
                      <td>{app.category}</td>
                      <td>v{app.version}</td>
                      <td className="font-semibold text-gray-900 dark:text-white">{app.download_count}</td>
                      <td className="font-semibold text-gray-900 dark:text-white">{app.likes_count}</td>
                      <td>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          app.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                          app.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' :
                          'bg-red-500/15 text-red-400 border border-red-500/25'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Upload new APK Form */
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-lg font-bold font-outfit mb-6 flex items-center gap-1.5">
              <Upload className="w-5 h-5 text-blue-500" />
              Upload Package & Graphics
            </h3>

            <form onSubmit={handleAppUpload} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Application Name</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="FitPulse Tracker"
                    className="w-full px-3 py-2 text-xs glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Version code</label>
                    <input
                      type="text"
                      required
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      placeholder="1.0.0"
                      className="w-full px-3 py-2 text-xs glass-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs glass-input select-arrow"
                    >
                      <option value="Games">Games</option>
                      <option value="Tools">Tools</option>
                      <option value="Health">Health</option>
                      <option value="Music">Music</option>
                      <option value="Productivity">Productivity</option>
                      <option value="News">News</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline app features, hardware permissions, and capabilities..."
                  className="w-full p-3 text-xs glass-input h-32"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Website URL (Optional)</label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://fitpulse.net"
                    className="w-full px-3 py-2 text-xs glass-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Changelog Notes (Optional)</label>
                  <input
                    type="text"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="Initial release details..."
                    className="w-full px-3 py-2 text-xs glass-input"
                  />
                </div>
              </div>

              {/* File Upload Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-white/5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">App Icon File (.png/.jpg)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setIconFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">App Banner Image (.png/.jpg)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">APK File Upload (.apk)</label>
                  <input
                    type="file"
                    accept=".apk"
                    onChange={(e) => setApkFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20"
                  />
                </div>
              </div>

              {/* Progress bar */}
              {submitting && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                    <span>Uploading APK and Graphics...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded bg-white/5 overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('my_apps')}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-6 text-xs font-bold"
                >
                  {submitting ? 'Submitting App...' : 'Submit to Admin Review'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </LayoutShell>
  );
}
