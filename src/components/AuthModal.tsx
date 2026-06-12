'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { X, Mail, Lock, User, Shield, Terminal, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { refreshProfile } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'user' | 'developer'>('user');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
              full_name: fullName || email.split('@')[0],
              role: role,
            },
          },
        });

        if (error) throw error;
        
        alert('Registration successful! If required, please verify your email or log in directly with seeded accounts.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        await refreshProfile();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleType: 'admin' | 'developer' | 'user') => {
    setLoading(true);
    setErrorMsg('');
    const credentials = {
      admin: { email: 'admin@kstore.com', password: 'password123' },
      developer: { email: 'dev1@kstore.com', password: 'password123' },
      user: { email: 'user1@kstore.com', password: 'password123' },
    };

    try {
      const target = credentials[roleType];
      const { error } = await supabase.auth.signInWithPassword(target);
      if (error) throw error;
      await refreshProfile();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden glass-card p-6 md:p-8 animate-scale-up bg-white border border-gray-100 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Heading */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold font-outfit tracking-tight text-slate-800">
            {isSignUp ? 'Create your Account' : 'Welcome to Modded Team'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp ? 'Sign up to upload and review apps' : 'Sign in to access your apps & settings'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-500 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="johndoe"
                    className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`py-2 px-3 text-xs rounded-xl border font-bold transition-all ${
                      role === 'user'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    User / Reviewer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('developer')}
                    className={`py-2 px-3 text-xs rounded-xl border font-bold transition-all ${
                      role === 'developer'
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    App Developer
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 btn-primary justify-center font-bold text-xs py-2.5 min-h-[44px] shadow-md shadow-blue-500/10"
          >
            {loading ? 'Authenticating...' : isSignUp ? 'Create Account' : 'Sign In'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-blue-500 hover:underline font-bold transition-all min-h-[44px] px-4"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Quick Seeder/Evaluator Access */}
        {!isSignUp && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Developer/Evaluator Quick Login
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => quickLogin('admin')}
                className="flex flex-col items-center justify-center p-2 min-h-[60px] rounded-xl bg-red-50 border border-red-100 hover:bg-red-100/60 text-red-600 text-[10px] font-bold transition-all"
              >
                <Shield className="w-4 h-4 mb-1" />
                Admin
              </button>
              <button
                onClick={() => quickLogin('developer')}
                className="flex flex-col items-center justify-center p-2 min-h-[60px] rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100/60 text-blue-600 text-[10px] font-bold transition-all"
              >
                <Terminal className="w-4 h-4 mb-1" />
                Developer
              </button>
              <button
                onClick={() => quickLogin('user')}
                className="flex flex-col items-center justify-center p-2 min-h-[60px] rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/60 text-emerald-600 text-[10px] font-bold transition-all"
              >
                <User className="w-4 h-4 mb-1" />
                User
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-3">
              * Seeded Password is: <strong className="text-slate-500">password123</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
