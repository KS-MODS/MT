'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, Notification } from '@/types';
import { useRouter } from 'next/navigation';

interface AppContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light'>('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  // Force light mode
  useEffect(() => {
    setTheme('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  const toggleTheme = () => {
    // Force light theme, do nothing
  };

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        const prof = data as Profile;
        setProfile(prof);

        // Security check: if banned and login ban is enabled, log them out
        if (prof.is_banned) {
          const { data: settingsData } = await supabase
            .from('store_settings')
            .select('login_ban_enabled')
            .single();

          if (settingsData?.login_ban_enabled) {
            if (typeof window !== 'undefined') {
              alert('Your account has been banned by store administrators. Access denied.');
            }
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setNotifications([]);
            router.push('/');
          }
        }
      }
    } catch (err) {
      console.error('Failed to get profile:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Monitor auth state changes
  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        if (mounted) setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      }
      if (mounted) setLoading(false);
    };

    setupAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (mounted) setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUser(null);
            setProfile(null);
            setNotifications([]);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to real-time notifications
      const channel = supabase
        .channel(`public:notifications:user_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setNotifications([]);
    router.push('/');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        theme,
        toggleTheme,
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
