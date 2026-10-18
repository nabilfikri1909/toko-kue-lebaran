import CookieLoading from '@/components/CookieLoading';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-cream">
      <CookieLoading message="Menyiapkan toples kue Lebaran..." size="lg" />
    </div>
  );
}
