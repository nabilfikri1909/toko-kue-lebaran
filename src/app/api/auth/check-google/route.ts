import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ffkseimyzwulvtrdxdkr.supabase.co';
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({
      enabled: false,
      reason: 'Supabase URL belum dikonfigurasi.',
    });
  }

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google`, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
    });

    // When Google OAuth is enabled in Supabase, it returns HTTP 302/303 redirecting to accounts.google.com
    // When disabled, it returns HTTP 400 with "Unsupported provider"
    const enabled = res.status === 302 || res.status === 303;

    return NextResponse.json({
      enabled,
      status: res.status,
      message: enabled
        ? 'Google OAuth provider aktif di Supabase.'
        : 'Google OAuth provider belum diaktifkan di Supabase Dashboard (Authentication -> Providers -> Google).',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      enabled: false,
      error: message,
    });
  }
}
