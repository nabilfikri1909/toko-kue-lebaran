'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuthStore } from '@/lib/authStore';
import { UserProfile } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  noticeMessage?: string;
  onOpenOrders?: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  noticeMessage,
  onOpenOrders,
}: AuthModalProps) {
  const prefersReduced = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [authType, setAuthType] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState('');
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setStep('input');
      setOtpCode('');
      setCountdown(60);
      setIsGoogleLoading(false);
      setIsSwitchingAccount(false);
      setGoogleNotice(null);
    }
  }, [isOpen]);

  // Sanitize Indonesian phone numbers (+628... / 628... / 08... with dashes/spaces)
  const sanitizePhone = (raw: string) => {
    let cleaned = raw.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+62')) cleaned = '0' + cleaned.slice(3);
    else if (cleaned.startsWith('62')) cleaned = '0' + cleaned.slice(2);
    return cleaned;
  };

  // Google OAuth Login with safety fallback
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleNotice(null);
    setIsGoogleLoading(true);

    try {
      if (isSupabaseConfigured) {
        const checkRes = await fetch('/api/auth/check-google');
        const checkData = await checkRes.json();

        if (checkData.enabled) {
          const { error: supaErr } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (supaErr) throw supaErr;
          return;
        } else {
          setGoogleNotice(
            'Google OAuth belum diaktifkan di Supabase Dashboard. Sistem otomatis mengalihkan ke mode Akun Google Simulasi.'
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Google OAuth check:', msg);
    }

    // Instant Google demo login fallback
    setTimeout(() => {
      const demoGoogleProfile: UserProfile = {
        id: `usr-google-${Date.now()}`,
        contact: 'budi.santoso@gmail.com',
        type: 'google',
        name: 'Budi Santoso',
        avatar_url:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
        created_at: new Date().toISOString(),
      };
      login(demoGoogleProfile);
      setIsGoogleLoading(false);
      onClose();
      onSuccess?.();
    }, 600);
  };

  // Quick preset test login for instant evaluation
  const handleQuickTestLogin = (presetContact: string, presetName: string, type: 'phone' | 'email') => {
    const testProfile: UserProfile = {
      id: `usr-test-${Date.now()}`,
      contact: presetContact,
      type,
      name: presetName,
      created_at: new Date().toISOString(),
    };
    login(testProfile);
    onClose();
    onSuccess?.();
  };

  // Send OTP
  const handleSendOtp = () => {
    setError('');
    const rawContact = contact.trim();

    if (authType === 'phone') {
      const cleaned = sanitizePhone(rawContact);
      const phoneRegex = /^08[1-9][0-9]{6,10}$/;
      if (!phoneRegex.test(cleaned)) {
        setError('Nomor WhatsApp tidak valid (contoh: 08123456789).');
        return;
      }
      setContact(cleaned);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rawContact.toLowerCase())) {
        setError('Alamat email tidak valid (contoh: nama@email.com).');
        return;
      }
      setContact(rawContact.toLowerCase());
    }

    setIsSendingOtp(true);
    // Generate simulated 6-digit OTP
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);

    setTimeout(() => {
      setIsSendingOtp(false);
      setStep('otp');
      setCountdown(60);
    }, 500);
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    setError('');
    if (otpCode.trim() !== generatedOtp && otpCode.trim() !== '123456') {
      setError('Kode OTP salah. Silakan periksa kembali atau gunakan kode simulasi.');
      return;
    }

    const cleanContact = authType === 'phone' ? sanitizePhone(contact) : contact.trim().toLowerCase();
    const displayName =
      name.trim() ||
      (authType === 'phone' ? `Pelanggan WA ${cleanContact.slice(-4)}` : cleanContact.split('@')[0]);

    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      contact: cleanContact,
      type: authType,
      name: displayName,
      created_at: new Date().toISOString(),
    };

    login(newProfile);
    onClose();
    onSuccess?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm"
          />

          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-md bg-white rounded-modal shadow-2xl overflow-hidden z-10"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-cocoa/10 flex items-center justify-between bg-cream/40">
              <div>
                <h2 className="font-playfair text-lg font-semibold text-cocoa">
                  {user && !isSwitchingAccount ? 'Profil Akun Pembeli' : 'Masuk Akun Pembeli'}
                </h2>
                <p className="text-xs text-cocoa/60 mt-0.5">
                  {user && !isSwitchingAccount
                    ? 'Informasi akun aktif Anda di Dapur Kue Lebaran'
                    : noticeMessage || 'Pantau status pesanan kue Lebaran Anda secara realtime'}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup form login"
                className="w-9 h-9 flex items-center justify-center rounded-button text-cocoa/60 hover:text-cocoa hover:bg-cocoa/5 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {noticeMessage && !user && (
              <div className="bg-honey/10 px-6 py-2.5 border-b border-honey/20 flex items-center gap-2 text-xs text-cocoa">
                <span className="text-honey text-base">⚠️</span>
                <span>{noticeMessage}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6">
              {/* STATE 1: User is already logged in */}
              {user && !isSwitchingAccount ? (
                <div className="space-y-5 text-center">
                  <div className="relative inline-block">
                    {user.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="w-20 h-20 rounded-full mx-auto object-cover border-3 border-honey shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-honey/15 mx-auto flex items-center justify-center text-3xl border-2 border-honey/40 shadow-sm">
                        🍪
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-6 h-6 bg-palm text-white rounded-full flex items-center justify-center text-xs shadow-sm">
                      ✓
                    </span>
                  </div>

                  <div>
                    <h3 className="font-playfair text-xl font-bold text-cocoa">{user.name}</h3>
                    <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-cream border border-cocoa/10 text-xs text-cocoa/80">
                      <span className="font-mono text-[11px] font-semibold">{user.contact}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-honey/20 text-honey">
                        {user.type}
                      </span>
                    </div>
                  </div>

                  <div className="bg-cream/60 rounded-card p-3 border border-cocoa/10 text-xs text-cocoa/75 text-left flex items-center gap-2.5">
                    <span className="text-xl">✨</span>
                    <p className="leading-relaxed">
                      Akun Anda terhubung langsung dengan sistem antrian dapur kue Lebaran secara realtime.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {onOpenOrders && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenOrders();
                        }}
                        className="w-full h-11 bg-honey text-cream font-semibold rounded-button text-xs hover:bg-honey/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span>Lihat Riwayat Pesanan Saya</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSwitchingAccount(true)}
                        className="h-10 border border-cocoa/20 text-cocoa/80 hover:bg-cocoa/5 rounded-button text-xs font-semibold transition-colors"
                      >
                        Ganti Akun
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          onClose();
                        }}
                        className="h-10 border border-red-200 text-red-600 hover:bg-red-50 rounded-button text-xs font-semibold transition-colors"
                      >
                        Keluar (Logout)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* STATE 2: Login Form */
                <div className="space-y-4">
                  {isSwitchingAccount && (
                    <div className="flex items-center justify-between pb-2 border-b border-cocoa/10">
                      <span className="text-xs text-cocoa/60">Ganti ke akun lain:</span>
                      <button
                        type="button"
                        onClick={() => setIsSwitchingAccount(false)}
                        className="text-xs text-honey font-semibold hover:underline"
                      >
                        Batal
                      </button>
                    </div>
                  )}

                  {googleNotice && (
                    <div className="bg-honey/15 border border-honey/30 rounded-button p-3 text-xs text-cocoa space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-cocoa">
                        <span>ℹ️</span>
                        <span>Mode Simulasi:</span>
                      </div>
                      <p className="text-cocoa/80 leading-relaxed text-[11px]">{googleNotice}</p>
                    </div>
                  )}

                  {step === 'input' ? (
                    <>
                      {/* Google One-Click Login */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full h-11 bg-white hover:bg-cream/40 border border-cocoa/20 rounded-button text-cocoa text-xs font-semibold flex items-center justify-center gap-3 shadow-sm hover:border-cocoa/30 transition-all disabled:opacity-60"
                      >
                        {isGoogleLoading ? (
                          <div className="w-4 h-4 border-2 border-honey border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24">
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
                        <span>Lanjutkan dengan Google</span>
                      </button>

                      {/* Divider */}
                      <div className="relative my-2 flex items-center justify-center">
                        <div className="w-full border-t border-cocoa/15" />
                        <span className="absolute bg-white px-2.5 text-[10px] font-semibold tracking-wider text-cocoa/50 uppercase">
                          Atau Masuk dengan Nomor / Email
                        </span>
                      </div>

                      {/* Auth Type Selector */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-cream/60 rounded-button border border-cocoa/10">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthType('phone');
                            setError('');
                          }}
                          className={`h-9 text-xs font-semibold rounded-button transition-colors flex items-center justify-center gap-1.5 ${
                            authType === 'phone'
                              ? 'bg-honey text-cream shadow-sm'
                              : 'text-cocoa/70 hover:text-cocoa'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                          </svg>
                          <span>Nomor WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthType('email');
                            setError('');
                          }}
                          className={`h-9 text-xs font-semibold rounded-button transition-colors flex items-center justify-center gap-1.5 ${
                            authType === 'email'
                              ? 'bg-honey text-cream shadow-sm'
                              : 'text-cocoa/70 hover:text-cocoa'
                          }`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <span>Alamat Email</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-cocoa mb-1">
                          Nama Lengkap (Opsional)
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Contoh: Fatimah Azzahra"
                          className="w-full h-10 px-3 bg-cream/40 border border-cocoa/20 rounded-button text-xs text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-cocoa mb-1">
                          {authType === 'phone' ? 'Nomor WhatsApp' : 'Alamat Email'}
                        </label>
                        <input
                          type={authType === 'phone' ? 'tel' : 'email'}
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder={authType === 'phone' ? '08123456789' : 'nama@email.com'}
                          className="w-full h-10 px-3 bg-cream/40 border border-cocoa/20 rounded-button text-xs text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                        />
                      </div>

                      {error && <p className="text-red-600 text-xs">{error}</p>}

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !contact.trim()}
                        className="w-full h-11 bg-honey hover:bg-honey/90 text-cream font-semibold rounded-button text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                      >
                        {isSendingOtp ? (
                          <span className="flex items-center gap-2">
                            <span className="animate-spin text-sm">🍪</span>
                            <span>Mengirim Kode OTP...</span>
                          </span>
                        ) : (
                          <span>Kirim Kode OTP Verifikasi</span>
                        )}
                      </button>

                      {/* Quick 1-Click Preset Logins */}
                      <div className="pt-2 border-t border-cocoa/10">
                        <p className="text-[11px] font-semibold text-cocoa/60 mb-2 text-center">
                          Akses Cepat Uji Coba:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickTestLogin('081234567890', 'Budi Santoso', 'phone')
                            }
                            className="p-2 border border-honey/40 bg-honey/5 hover:bg-honey/15 rounded-button text-left transition-colors"
                          >
                            <p className="font-bold text-xs text-cocoa">Budi Santoso</p>
                            <p className="text-[10px] text-cocoa/70 font-mono">081234567890</p>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickTestLogin('siti.rahmah@gmail.com', 'Siti Rahmah', 'email')
                            }
                            className="p-2 border border-honey/40 bg-honey/5 hover:bg-honey/15 rounded-button text-left transition-colors"
                          >
                            <p className="font-bold text-xs text-cocoa">Siti Rahmah</p>
                            <p className="text-[10px] text-cocoa/70 font-mono truncate">siti.rahmah@gmail.com</p>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Step OTP */
                    <div className="space-y-3.5">
                      <div className="bg-cream/70 p-3 rounded-card border border-cocoa/10 text-xs text-cocoa space-y-1">
                        <p className="text-cocoa/70 text-[11px]">
                          Kode verifikasi dikirim ke <strong className="text-cocoa">{contact}</strong>
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-honey/15 text-cocoa font-medium text-[11px]">
                            <span>Kode OTP:</span>
                            <strong className="tracking-widest font-mono font-bold text-honey">
                              {generatedOtp || '123456'}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOtpCode(generatedOtp || '123456')}
                            className="text-[11px] text-honey font-bold hover:underline"
                          >
                            Isi Otomatis
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-cocoa mb-1">
                          Masukkan 6 Digit Kode OTP
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="6 digit kode"
                          className="w-full h-11 text-center tracking-[0.4em] text-lg font-mono font-bold bg-cream/40 border border-cocoa/25 rounded-button text-cocoa focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                        />
                      </div>

                      {error && <p className="text-red-600 text-xs">{error}</p>}

                      <div className="flex items-center justify-between text-xs text-cocoa/60">
                        {countdown > 0 ? (
                          <span>Kirim ulang dalam {countdown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            className="text-honey font-semibold hover:underline"
                          >
                            Kirim Ulang OTP
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setStep('input')}
                          className="text-cocoa/70 hover:underline"
                        >
                          Ganti {authType === 'phone' ? 'Nomor' : 'Email'}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpCode.length < 6}
                        className="w-full h-11 bg-honey hover:bg-honey/90 text-cream font-semibold rounded-button text-xs transition-colors disabled:opacity-50 shadow-sm"
                      >
                        Verifikasi & Masuk
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
