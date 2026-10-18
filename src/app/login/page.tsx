'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StoreInfo from '@/components/StoreInfo';
import { useAuthStore } from '@/lib/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // OTP Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const safeUser = isMounted ? user : null;

  // Google Login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    setNotice(null);

    try {
      if (!isSupabaseConfigured) {
        setError('Layanan Supabase belum dikonfigurasi di .env.local.');
        setIsGoogleLoading(false);
        return;
      }

      // Check if Google provider is enabled in Supabase
      const checkRes = await fetch('/api/auth/check-google');
      const checkData = await checkRes.json();

      if (!checkData.enabled) {
        setError(
          'Google OAuth belum diaktifkan di Supabase Dashboard (Authentication -> Providers -> Google).'
        );
        setIsGoogleLoading(false);
        return;
      }

      const { error: supaErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (supaErr) throw supaErr;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Gagal memulai login Google: ${msg}`);
      setIsGoogleLoading(false);
    }
  };

  // Sanitize Indonesian phone numbers
  const sanitizePhone = (raw: string) => {
    let cleaned = raw.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+62')) cleaned = '0' + cleaned.slice(3);
    else if (cleaned.startsWith('62')) cleaned = '0' + cleaned.slice(2);
    return cleaned;
  };

  // Send OTP
  const handleSendOtp = async () => {
    setError('');
    const cleanContact = contact.trim();

    if (activeTab === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanContact)) {
        setError('Alamat email tidak valid. Contoh: pelanggan@gmail.com');
        return;
      }
    } else {
      const cleaned = sanitizePhone(cleanContact);
      const phoneRegex = /^08[1-9][0-9]{6,10}$/;
      if (!phoneRegex.test(cleaned)) {
        setError('Nomor WhatsApp tidak valid. Contoh: 081234567890');
        return;
      }
      setContact(cleaned);
    }

    if (!isSupabaseConfigured) {
      setError('Konfigurasi Supabase belum aktif di file .env.local.');
      return;
    }

    setIsSendingOtp(true);

    try {
      if (activeTab === 'email') {
        const { error: supaErr } = await supabase.auth.signInWithOtp({
          email: cleanContact.toLowerCase(),
          options: {
            shouldCreateUser: true,
          },
        });

        if (supaErr) {
          setError(`Gagal mengirim kode ke email: ${supaErr.message}`);
          setIsSendingOtp(false);
          return;
        }

        setIsSendingOtp(false);
        setStep('otp');
        setCountdown(60);
      } else {
        // Phone / WhatsApp OTP
        const cleaned = sanitizePhone(cleanContact);
        const intlPhone = '+62' + cleaned.replace(/^0/, '');

        const { error: supaErr } = await supabase.auth.signInWithOtp({
          phone: intlPhone,
          options: {
            channel: 'whatsapp',
          },
        });

        if (supaErr) {
          setError(
            `Layanan WhatsApp OTP belum dikonfigurasi di Supabase (${supaErr.message}). Silakan gunakan opsi Alamat Email atau Akun Google.`
          );
          setIsSendingOtp(false);
          return;
        }

        setIsSendingOtp(false);
        setStep('otp');
        setCountdown(60);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Terjadi kendala saat mengirim kode: ${msg}`);
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setError('');
    if (otpCode.length < 6) {
      setError('Masukkan 6 digit kode OTP yang diterima.');
      return;
    }

    try {
      const cleanContact = contact.trim();

      if (activeTab === 'email') {
        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          email: cleanContact.toLowerCase(),
          token: otpCode.trim(),
          type: 'email',
        });

        if (verifyErr || !data.user) {
          setError(`Kode OTP tidak valid atau telah kadaluarsa: ${verifyErr?.message || ''}`);
          return;
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          contact: data.user.email || cleanContact,
          type: 'email',
          name: name.trim() || data.user.email?.split('@')[0] || 'Pelanggan Kue',
          created_at: new Date().toISOString(),
        };

        login(userProfile);
        router.push('/');
      } else {
        const cleaned = sanitizePhone(cleanContact);
        const intlPhone = '+62' + cleaned.replace(/^0/, '');

        const { data, error: verifyErr } = await supabase.auth.verifyOtp({
          phone: intlPhone,
          token: otpCode.trim(),
          type: 'sms',
        });

        if (verifyErr || !data.user) {
          setError(`Kode verifikasi WhatsApp tidak valid: ${verifyErr?.message || ''}`);
          return;
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          contact: cleaned,
          type: 'phone',
          name: name.trim() || `Pelanggan WA ${cleaned.slice(-4)}`,
          created_at: new Date().toISOString(),
        };

        login(userProfile);
        router.push('/');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Gagal memverifikasi OTP: ${msg}`);
    }
  };

  return (
    <>
      <Header
        searchQuery=""
        onSearchChange={() => {}}
        onCartToggle={() => router.push('/')}
      />
      <StoreInfo />

      <main className="max-w-xl mx-auto px-4 py-10">
        {safeUser ? (
          <div className="bg-white border border-cocoa/10 rounded-card p-8 space-y-4 shadow-sm text-center">
            {safeUser.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={safeUser.avatar_url}
                alt={safeUser.name}
                className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-honey"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-honey/15 mx-auto flex items-center justify-center text-2xl">
                🍪
              </div>
            )}
            <h1 className="font-playfair text-xl font-semibold text-cocoa">
              Selamat Datang, {safeUser.name}
            </h1>
            <p className="text-sm text-cocoa/70">
              Akun aktif: <span className="font-medium text-cocoa">{safeUser.contact}</span> ({safeUser.type.toUpperCase()})
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/')}
                className="h-11 px-6 bg-honey text-cream font-semibold rounded-button text-sm hover:bg-honey/90 transition-colors"
              >
                Mulai Belanja Kue
              </button>
              <button
                onClick={logout}
                className="h-11 px-6 border border-cocoa/20 text-cocoa/80 rounded-button text-sm hover:bg-cocoa/5 transition-colors"
              >
                Keluar (Logout)
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-cocoa/10 rounded-card p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="text-center space-y-2">
              <h1 className="font-playfair text-2xl font-semibold text-cocoa">
                Masuk Akun Pembeli
              </h1>
              <p className="text-xs sm:text-sm text-cocoa/70 max-w-sm mx-auto">
                Masuk dengan Akun Google, Email, atau WhatsApp Anda untuk memantau status pesanan kue Lebaran secara realtime.
              </p>
            </div>

            {notice && (
              <div className="bg-honey/15 border border-honey/30 rounded-button p-3.5 text-xs text-cocoa space-y-1">
                <div className="flex items-center gap-2 font-semibold text-cocoa">
                  <span>ℹ️</span>
                  <span>Informasi:</span>
                </div>
                <p className="text-cocoa/80 leading-relaxed">{notice}</p>
              </div>
            )}

            {/* Google One-Click Login */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full h-12 bg-white hover:bg-cream/40 border border-cocoa/20 rounded-button text-cocoa text-sm font-semibold flex items-center justify-center gap-3 shadow-sm hover:border-cocoa/30 transition-all disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <div className="w-5 h-5 border-2 border-honey border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Lanjutkan dengan Akun Google</span>
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-cocoa/15" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold tracking-wider text-cocoa/50 uppercase">
                  Atau Masuk dengan Email / WhatsApp
                </span>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-cream/60 rounded-button border border-cocoa/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('email');
                  setError('');
                  setStep('input');
                }}
                className={`h-10 text-xs font-semibold rounded-button transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'email'
                    ? 'bg-honey text-cream shadow-sm'
                    : 'text-cocoa/70 hover:text-cocoa'
                }`}
              >
                <span>✉️ Alamat Email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('phone');
                  setError('');
                  setStep('input');
                }}
                className={`h-10 text-xs font-semibold rounded-button transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'phone'
                    ? 'bg-honey text-cream shadow-sm'
                    : 'text-cocoa/70 hover:text-cocoa'
                }`}
              >
                <span>📱 Nomor WhatsApp</span>
              </button>
            </div>

            {/* Direct Form */}
            {step === 'input' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-cocoa mb-1">
                    Nama Lengkap (Opsional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Fatimah Azzahra"
                    className="w-full h-11 px-3.5 bg-cream/30 border border-cocoa/20 rounded-button text-sm text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cocoa mb-1">
                    {activeTab === 'email' ? 'Alamat Email Aktif' : 'Nomor WhatsApp Aktif'}
                  </label>
                  <input
                    type={activeTab === 'email' ? 'email' : 'tel'}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={
                      activeTab === 'email' ? 'nama@gmail.com' : '081234567890'
                    }
                    className="w-full h-11 px-3.5 bg-cream/30 border border-cocoa/20 rounded-button text-sm text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                  />
                </div>

                {error && <p className="text-red-600 text-xs leading-relaxed">{error}</p>}

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || !contact.trim()}
                    className="w-full h-12 bg-honey hover:bg-honey/90 text-cream font-semibold rounded-button text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSendingOtp ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin text-base">🍪</span>
                        <span>Mengirim Kode OTP...</span>
                      </span>
                    ) : (
                      <span>Kirim Kode Verifikasi OTP</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-cream/80 p-4 rounded-card border border-cocoa/10 text-xs text-cocoa space-y-1.5">
                  <p className="text-cocoa/70">
                    Kode verifikasi 6-digit telah dikirimkan ke:{' '}
                    <strong className="text-cocoa">{contact}</strong>
                  </p>
                  <p className="text-[11px] text-cocoa/60">
                    Silakan periksa kotak masuk atau spam email Anda.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cocoa mb-1.5">
                    Masukkan 6 Digit Kode OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    className="w-full h-12 text-center tracking-[0.4em] text-lg font-mono font-bold bg-cream/30 border border-cocoa/25 rounded-button text-cocoa focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                  />
                </div>

                {error && <p className="text-red-600 text-xs">{error}</p>}

                <div className="flex items-center justify-between text-xs text-cocoa/60">
                  {countdown > 0 ? (
                    <span>Kirim ulang dalam {countdown} detik</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-honey font-semibold hover:underline"
                    >
                      Kirim Ulang Kode OTP
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('input');
                      setError('');
                    }}
                    className="text-cocoa/70 hover:underline"
                  >
                    Ganti {activeTab === 'email' ? 'Email' : 'Nomor'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={otpCode.length < 6}
                  className="w-full h-12 bg-honey hover:bg-honey/90 text-cream font-semibold rounded-button text-sm transition-colors disabled:opacity-50 shadow-sm"
                >
                  Verifikasi & Masuk Akun
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
