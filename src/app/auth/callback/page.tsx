'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/authStore';
import { UserProfile } from '@/lib/types';

export default function AuthCallbackPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [statusMessage, setStatusMessage] = useState('Memproses autentikasi Google...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const urlError = searchParams.get('error') || searchParams.get('error_description');

        const hashStr = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hashStr);
        const hashError = hashParams.get('error') || hashParams.get('error_description');

        if (urlError || hashError) {
          const rawErr = urlError || hashError || '';
          setError(`Autentikasi belum berhasil: ${rawErr}`);
          return;
        }

        const code = searchParams.get('code');
        let activeSession = null;

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError('Gagal menukarkan kode OAuth dari Google: ' + exchangeError.message);
            return;
          } else if (data?.session) {
            activeSession = data.session;
          }
        }

        if (!activeSession) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          activeSession = session;
        }

        if (activeSession && activeSession.user) {
          const user = activeSession.user;
          const userProfile: UserProfile = {
            id: user.id,
            contact: user.email || user.phone || 'google-user',
            type: 'google',
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pelanggan Kue',
            avatar_url: user.user_metadata?.avatar_url,
            created_at: new Date().toISOString(),
          };

          login(userProfile);
          setStatusMessage('Login berhasil! Mengalihkan ke toko kue...');
          setTimeout(() => {
            if (isMounted) router.push('/');
          }, 600);
        } else {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && session.user && isMounted) {
              const user = session.user;
              const userProfile: UserProfile = {
                id: user.id,
                contact: user.email || 'google-user',
                type: 'google',
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pelanggan Kue',
                avatar_url: user.user_metadata?.avatar_url,
                created_at: new Date().toISOString(),
              };
              login(userProfile);
              router.push('/');
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Terjadi kendala saat memproses login.';
        setError(errorMsg);
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [login, router]);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 text-cocoa">
      <div className="bg-white p-6 sm:p-8 rounded-modal shadow-lg max-w-md w-full text-center space-y-4 border border-cocoa/10">
        <div className="w-16 h-16 mx-auto rounded-full bg-honey/15 flex items-center justify-center text-3xl">
          {error ? '⚠️' : '🍪'}
        </div>

        <h2 className="font-playfair text-xl font-bold text-cocoa">
          {error ? 'Status Autentikasi Google' : 'Autentikasi Akun'}
        </h2>

        <p className="text-xs sm:text-sm text-cocoa/75 leading-relaxed text-left bg-cream/50 p-3.5 rounded-card border border-cocoa/10">
          {error || statusMessage}
        </p>

        {error ? (
          <div className="space-y-2 pt-2">
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 bg-honey text-cream font-semibold rounded-button text-xs hover:bg-honey/90 transition-colors shadow-sm"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-cocoa/50 pt-2">
            <div className="w-4 h-4 border-2 border-honey border-t-transparent rounded-full animate-spin" />
            <span>Sedang memverifikasi data akun...</span>
          </div>
        )}
      </div>
    </div>
  );
}
