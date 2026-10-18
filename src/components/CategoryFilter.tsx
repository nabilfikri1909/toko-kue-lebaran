'use client';

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

const CATEGORIES = ['Semua', 'Kue Klasik', 'Kue Gurih', 'Kue Cokelat'];

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <nav aria-label="Filter kategori kue" className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 px-4 md:px-0 py-1">
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              aria-pressed={isActive}
              className={`
                shrink-0 px-5 h-11 rounded-button text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-honey text-cream'
                    : 'bg-cream text-cocoa/70 border border-cocoa/15 hover:border-cocoa/30'
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
