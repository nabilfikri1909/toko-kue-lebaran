'use client';

import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/lib/authStore';
import { UserProfile } from '@/lib/types';

export default function AuthSync() {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // 1. Initial check of Supabase Auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const supaUser = session.user;
        const currentContact = supaUser.email || supaUser.phone || '';
        
        // Sync if local store is empty or needs refresh
        if (!user || user.contact !== currentContact) {
          const profile: UserProfile = {
            id: supaUser.id,
            contact: currentContact,
            type: supaUser.app_metadata?.provider === 'google' ? 'google' : 'email',
            name:
              supaUser.user_metadata?.full_name ||
              supaUser.email?.split('@')[0] ||
              'Pelanggan Kue',
            avatar_url: supaUser.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
          };
          login(profile);
        }
      }
    });

    // 2. Realtime listener for Auth changes across tabs and OAuth redirects
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const supaUser = session.user;
        const profile: UserProfile = {
          id: supaUser.id,
          contact: supaUser.email || supaUser.phone || '',
          type: supaUser.app_metadata?.provider === 'google' ? 'google' : 'email',
          name:
            supaUser.user_metadata?.full_name ||
            supaUser.email?.split('@')[0] ||
            'Pelanggan Kue',
          avatar_url: supaUser.user_metadata?.avatar_url,
          created_at: new Date().toISOString(),
        };
        login(profile);
      } else if (event === 'SIGNED_OUT') {
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.type === 'google') {
          logout();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [login, logout, user]);

  return null;
}
