import { CATEGORIES } from '../../config/languages.js';

export default function CategoryBar({ selectedCategory, uiLang, onSelectCategory }) {
  return (
    <nav aria-label="Categories" className="bg-slate-950/90 border-b border-slate-900 px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none z-20 shrink-0">
      {CATEGORIES.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelectCategory(category.id)}
          aria-pressed={selectedCategory === category.id}
          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === category.id
              ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-105'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
          }`}
        >
          {category.label[uiLang] || category.label.es}
        </button>
      ))}
    </nav>
  );
}
