'use client';

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { App, Review, Comment, Screenshot } from '@/types';
import { useApp } from '@/context/AppContext';
import LayoutShell from '@/components/LayoutShell';
import AppCard from '@/components/AppCard';
import {
  Download,
  Heart,
  Share2,
  Star,
  ShieldCheck,
  Globe,
  MessageSquare,
  Reply,
  Send,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function AppDetailsPage({ params }: PageProps) {
  const { slug } = use(params);
  const { user, profile } = useApp();

  const [app, setApp] = useState<App | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedApps, setRelatedApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);

  // User Action States
  const [isLiked, setIsLiked] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadAppDetails() {
      try {
        setLoading(true);
        // Fetch app details
        const { data: appData, error: appError } = await supabase
          .from('apps')
          .select('*, developer:profiles(*)')
          .eq('slug', slug)
          .single();

        if (appError) throw appError;
        const currentApp = appData as App;
        setApp(currentApp);

        // Fetch screenshots
        const { data: screenData } = await supabase
          .from('screenshots')
          .select('*')
          .eq('app_id', currentApp.id);
        setScreenshots(screenData || []);

        // Fetch reviews
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*, user:profiles(*)')
          .eq('app_id', currentApp.id)
          .order('created_at', { ascending: false });
        setReviews((reviewData as Review[]) || []);

        // Check if current user has reviewed
        if (user && reviewData) {
          const userRev = reviewData.find((r: any) => r.user_id === user.id);
          if (userRev) {
            setHasReviewed(true);
          }
        }

        // Fetch comments
        const { data: commentData } = await supabase
          .from('comments')
          .select('*, user:profiles(*)')
          .eq('app_id', currentApp.id)
          .order('created_at', { ascending: true });

        // Build comment tree (nesting replies)
        if (commentData) {
          const rawComments = commentData as Comment[];
          const roots = rawComments.filter(c => !c.parent_id);
          const replies = rawComments.filter(c => c.parent_id);
          
          roots.forEach(root => {
            root.replies = replies.filter(r => r.parent_id === root.id);
          });
          setComments(roots);
        }

        // Fetch check if user liked
        if (user) {
          const { data: likeData } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', user.id)
            .eq('app_id', currentApp.id);
          setIsLiked(!!(likeData && likeData.length > 0));
        }

        // Fetch related apps
        const { data: relatedData } = await supabase
          .from('apps')
          .select('*, developer:profiles(*)')
          .eq('category', currentApp.category)
          .eq('status', 'approved')
          .neq('id', currentApp.id)
          .limit(4);
        setRelatedApps((relatedData as App[]) || []);

      } catch (err) {
        console.error('Error loading app details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAppDetails();
  }, [slug, user]);

  const handleLike = async () => {
    if (!user) {
      alert('Please sign in to like applications.');
      return;
    }
    if (!app) return;

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('app_id', app.id);
        setIsLiked(false);
        setApp(prev => prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : null);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, app_id: app.id });
        setIsLiked(true);
        setApp(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);

        // Notify developer
        if (app.developer_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: app.developer_id,
            type: 'like',
            title: 'New Like!',
            message: `${profile?.full_name || 'A user'} liked your app ${app.name}`,
            data: { app_id: app.id, sender_id: user.id }
          });
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleDownload = async () => {
    if (!app) return;
    setDownloading(true);

    try {
      // Record in downloads table (which will trigger increment download_count)
      await supabase.from('downloads').insert({
        user_id: user ? user.id : null,
        app_id: app.id
      });

      // Increment local count
      setApp(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null);

      // Trigger file download
      if (app.apk_url) {
        window.open(app.apk_url, '_blank');
      } else {
        // Fallback simulate download
        const link = document.createElement('a');
        link.href = '#';
        link.setAttribute('download', `${app.slug}-v${app.version}.apk`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Downloading APK file...');
      }
    } catch (err) {
      console.error('Download registration failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !app) return;

    try {
      const { error } = await supabase.from('reviews').insert({
        app_id: app.id,
        user_id: user.id,
        rating: userRating,
        comment: reviewComment
      });

      if (error) throw error;

      // Add to local review state
      const newRev: Review = {
        id: Math.random().toString(),
        app_id: app.id,
        user_id: user.id,
        rating: userRating,
        comment: reviewComment,
        created_at: new Date().toISOString(),
        user: profile as any
      };

      setReviews([newRev, ...reviews]);
      setHasReviewed(true);
      setReviewComment('');
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !app || !newComment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          app_id: app.id,
          user_id: user.id,
          content: newComment
        })
        .select('*, user:profiles(*)')
        .single();

      if (error) throw error;

      setComments([...comments, data as Comment]);
      setNewComment('');

      // Notify developer
      if (app.developer_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: app.developer_id,
          type: 'comment',
          title: 'New Comment!',
          message: `${profile?.full_name || 'A user'} commented on ${app.name}`,
          data: { app_id: app.id, sender_id: user.id }
        });
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const submitReply = async (commentId: string) => {
    const text = replyText[commentId];
    if (!user || !app || !text?.trim()) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          app_id: app.id,
          user_id: user.id,
          content: text,
          parent_id: commentId
        })
        .select('*, user:profiles(*)')
        .single();

      if (error) throw error;

      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [...(c.replies || []), data as Comment]
            };
          }
          return c;
        })
      );

      setReplyText(prev => ({ ...prev, [commentId]: '' }));
      setActiveReplyId(null);
    } catch (err) {
      console.error('Error submitting reply:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8'; // Default mock rating

  if (loading) {
    return (
      <LayoutShell>
        <div className="space-y-8 max-w-6xl mx-auto text-left animate-pulse">
          {/* Header Card Skeleton */}
          <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start bg-white border border-slate-100 skeleton">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-6 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-1/3" />
            </div>
          </div>
          {/* Gallery Loader */}
          <div className="h-40 bg-slate-100 rounded-2xl skeleton" />
        </div>
      </LayoutShell>
    );
  }

  if (!app) {
    return (
      <LayoutShell>
        <div className="text-center py-20 glass-card bg-white border border-gray-100 max-w-md mx-auto shadow-sm">
          <h2 className="text-lg font-bold text-slate-700">App not found</h2>
          <p className="text-slate-400 mt-2 text-sm">The application you are looking for does not exist or has been removed.</p>
          <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-xs text-blue-500 font-semibold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8 text-left max-w-6xl mx-auto">
        
        {/* Back navigation */}
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition-colors font-semibold min-h-[44px]">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        {/* Top Header Card */}
        <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start bg-white border border-slate-100 shadow-sm">
          {/* Icon */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden shadow-md flex-shrink-0">
            <img src={app.icon_url || ''} alt={app.name} className="w-full h-full object-cover" loading="lazy" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100">
                {app.category}
              </span>
              <span className="text-xs text-slate-400 font-semibold">v{app.version}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold font-outfit text-slate-800 tracking-tight">
              {app.name}
            </h1>

            {/* Developer link */}
            <div className="flex items-center gap-1.5 text-sm">
              <Link href={`/developer/${app.developer?.username}`} className="text-blue-500 font-semibold hover:underline flex items-center gap-1">
                {app.developer?.full_name}
                {app.developer?.is_verified && <ShieldCheck className="w-4 h-4 text-blue-500" />}
              </Link>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn-primary py-2.5 px-6 font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-700 border-none shadow-md shadow-blue-500/10 min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'Processing...' : 'Download APK'}
              </button>

              <button
                onClick={handleLike}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all min-h-[44px] min-w-[44px] ${
                  isLiked
                    ? 'bg-rose-50 border-rose-100 text-rose-500 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                <span>{app.likes_count} Likes</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-all min-h-[44px] min-w-[44px]"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Side bar */}
          <div className="w-full md:w-auto flex md:flex-col justify-around md:justify-center gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8 text-center md:text-right flex-shrink-0">
            <div>
              <p className="text-2xl font-extrabold text-slate-800 font-outfit">{app.download_count.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Downloads</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-yellow-500 font-outfit flex items-center justify-center md:justify-end gap-1">
                {averageRating} <Star className="w-5 h-5 fill-yellow-500" />
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{reviews.length} Ratings</p>
            </div>
          </div>
        </div>

        {/* Gallery / Screenshots */}
        {screenshots.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold font-outfit uppercase tracking-wider text-slate-400">App Gallery</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-0 md:px-0">
              {screenshots.map((s, idx) => (
                <div key={s.id} className="relative w-72 h-40 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 shadow-sm">
                  <img
                    src={s.image_url}
                    alt={`${app.name} screenshot ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Grid: Details vs. Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Details & changelogs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="glass-card p-6 md:p-8 space-y-4 bg-white border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold font-outfit text-slate-800">Description</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {app.description || 'No description provided.'}
              </p>
            </div>

            {/* Changelog */}
            {app.changelog && (
              <div className="glass-card p-6 md:p-8 space-y-4 bg-white border border-gray-100 shadow-sm">
                <h3 className="text-base font-bold font-outfit text-slate-800">What's New in v{app.version}</h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {app.changelog}
                </p>
              </div>
            )}

            {/* Comment threads */}
            <div className="glass-card p-6 md:p-8 space-y-6 bg-white border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold font-outfit text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                Community Chat & Discussion ({comments.length})
              </h3>

              {/* Write comment */}
              {user ? (
                <form onSubmit={submitComment} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs uppercase border border-blue-100">
                    {profile?.username?.[0] || 'U'}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Ask a question or comment on this app..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="w-full pl-4 pr-12 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs text-slate-800 bg-white"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1.5 text-blue-500 hover:text-blue-600 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate-500 text-center py-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  Please sign in to write comments or replies.
                </p>
              )}

              {/* Comments list */}
              <div className="space-y-4 pt-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No comments yet. Start the conversation!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="space-y-3">
                      <div className="flex gap-3 text-left">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs uppercase">
                          {c.user?.avatar_url ? (
                            <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            c.user?.username?.[0] || 'U'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-700">{c.user?.full_name}</span>
                            <span className="text-[9px] text-slate-400">@{c.user?.username}</span>
                            <span className="text-[8px] text-slate-400 ml-auto">{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{c.content}</p>
                          
                          {user && (
                            <button
                              onClick={() => {
                                setActiveReplyId(activeReplyId === c.id ? null : c.id);
                                setReplyText(prev => ({ ...prev, [c.id]: '' }));
                              }}
                              className="inline-flex items-center gap-1 text-[9px] text-blue-500 font-bold mt-1.5 hover:underline p-2 -ml-2 min-h-[44px]"
                            >
                              <Reply className="w-3 h-3" />
                              Reply
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Reply Input */}
                      {activeReplyId === c.id && (
                        <div className="flex gap-2 pl-11">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={replyText[c.id] || ''}
                            onChange={e => setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="flex-1 py-1.5 px-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-[11px] text-slate-800"
                          />
                          <button
                            onClick={() => submitReply(c.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 flex items-center justify-center text-[10px] font-bold transition-colors min-h-[44px]"
                          >
                            Send
                          </button>
                        </div>
                      )}

                      {/* Replies List */}
                      {c.replies && c.replies.map(reply => (
                        <div key={reply.id} className="flex gap-3 pl-11 text-left">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-[10px] uppercase">
                            {reply.user?.avatar_url ? (
                              <img src={reply.user.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              reply.user?.username?.[0] || 'U'
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-700">{reply.user?.full_name}</span>
                              <span className="text-[8px] text-slate-400 font-medium">@{reply.user?.username}</span>
                              <span className="text-[8px] text-slate-400 ml-auto">{new Date(reply.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar details, review list */}
          <div className="space-y-8">
            {/* Quick Details */}
            <div className="glass-card p-6 bg-white border border-gray-100 shadow-sm space-y-4 text-left">
              <h3 className="text-sm font-bold font-outfit uppercase tracking-wider text-slate-400">App Information</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Category</span>
                  <span className="font-semibold text-slate-700">{app.category}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Version</span>
                  <span className="font-semibold text-slate-700">{app.version}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Downloads</span>
                  <span className="font-semibold text-slate-700">{app.download_count}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Likes</span>
                  <span className="font-semibold text-slate-700">{app.likes_count}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">Published</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(app.updated_at).toLocaleDateString()}
                  </span>
                </div>

                {app.website_url && (
                  <a
                    href={app.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-center py-2 bg-slate-50 hover:bg-slate-100 font-bold rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5 text-[11px] text-slate-600 min-h-[44px]"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>

            {/* Reviews list & ratings submission */}
            <div className="glass-card p-6 bg-white border border-gray-100 shadow-sm space-y-6 text-left">
              <h3 className="text-sm font-bold font-outfit uppercase tracking-wider text-slate-400">Reviews & Ratings</h3>

              {user && !hasReviewed ? (
                <form onSubmit={submitReview} className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Write your Review</p>
                  
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setUserRating(star)}
                        className="p-0.5 text-yellow-500 focus:outline-none"
                      >
                        <Star className={`w-5 h-5 ${userRating >= star ? 'fill-yellow-500' : ''}`} />
                      </button>
                    ))}
                  </div>

                  <textarea
                    placeholder="Describe your experience with this app..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    required
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs text-slate-800 bg-white h-20"
                  />
                  <button type="submit" className="w-full btn-primary py-2 text-xs font-semibold min-h-[44px]">
                    Submit Review
                  </button>
                </form>
              ) : user && hasReviewed ? (
                <div className="p-3 text-center text-xs rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-semibold">
                  You have reviewed this application!
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  Please sign in to write a review.
                </p>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No reviews yet.</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.id} className="p-3.5 rounded-xl border border-slate-100 space-y-2 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-[10px] uppercase text-slate-500 flex-shrink-0">
                            {r.user?.avatar_url ? (
                              <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              r.user?.username?.[0] || 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                              {r.user?.full_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-0.5 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3 h-3 text-yellow-500 ${
                                r.rating >= star ? 'fill-yellow-500' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {r.comment && (
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {r.comment}
                        </p>
                      )}
                      <span className="block text-[8px] text-slate-400 text-right">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Apps */}
        {relatedApps.length > 0 && (
          <div className="space-y-4 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-bold font-outfit tracking-tight flex items-center gap-1.5 text-slate-800">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Related Applications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedApps.map(app => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
