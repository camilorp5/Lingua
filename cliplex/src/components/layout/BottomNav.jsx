const TABS = [
  { id: 'immersion', icon: '📱', label: 'immersion' },
  { id: 'friction', icon: '⚡', label: 'friction' },
  { id: 'srs', icon: '🔄', label: 'srs' },
  { id: 'vault', icon: '📦', label: 'vault' },
  { id: 'import', icon: '🔗', label: 'import' },
  { id: 'profile', icon: '👤', label: 'profile' }
];

export default function BottomNav({ activeTab, onSelectTab, translations }) {
  return (
    <nav aria-label="Main navigation" className="px-1 py-2 bg-slate-950 border-t border-slate-900 grid grid-cols-6 items-center z-30 shrink-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelectTab(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          className={`flex flex-col items-center gap-0.5 text-[9px] sm:text-[10px] font-bold ${
            activeTab === tab.id ? 'text-amber-400' : 'text-slate-500'
          }`}
        >
          <span className="text-base">{tab.icon}</span>
          {translations[tab.label]}
        </button>
      ))}
    </nav>
  );
}
