'use client';

export default function StoreInfo() {
  return (
    <div className="bg-white/60 border-b border-cocoa/5">
      <div className="max-w-6xl mx-auto px-4 py-2">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide md:justify-center">
          <InfoChip
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
            href="https://maps.app.goo.gl/bh5CTmGDvAKyjH3Y6"
            label="Depok (Buka Maps)"
          />
          <InfoChip
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            label="Buka 08.00 - 17.00 WIB"
          />
          <InfoChip
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            }
            href="https://wa.me/62811839280?text=Halo%2C%20saya%20butuh%20bantuan%20kue%20Lebaran"
            label="WhatsApp: 0811839280"
          />
        </div>
      </div>
    </div>
  );
}

function InfoChip({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
}) {
  const classes =
    "flex items-center gap-1.5 whitespace-nowrap text-xs text-cocoa/70 shrink-0 px-2.5 py-1.5 rounded-full bg-cream hover:bg-cocoa/5 transition-colors min-h-[32px]";

  const content = (
    <>
      <span className="text-palm">{icon}</span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }

  return <span className={classes}>{content}</span>;
}
