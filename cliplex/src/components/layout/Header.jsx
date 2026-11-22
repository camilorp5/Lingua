import { LANGUAGES } from '../../config/languages.js';

export default function Header({
  targetLang,
  uiLang,
  availableLanguages = LANGUAGES,
  onTargetLanguageChange,
  onUiLanguageChange,
  title
}) {
  return (
    <header className="px-4 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-30 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-xl font-black bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 bg-clip-text text-transparent">
          {title}
        </span>
        <span className="text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/20">
          Reels 9:16
        </span>
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Language to learn"
          value={targetLang}
          onChange={(event) => onTargetLanguageChange(event.target.value)}
          className="bg-slate-800 text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 text-amber-300 focus:outline-none cursor-pointer"
        >
          {availableLanguages.map((language) => (
            <option key={language.code} value={language.code}>{language.flag} {language.name}</option>
          ))}
        </select>
        <select
          aria-label="Interface language"
          value={uiLang}
          onChange={(event) => onUiLanguageChange(event.target.value)}
          className="bg-slate-800 text-[11px] font-medium px-1.5 py-1 rounded-lg border border-slate-700 text-slate-300 focus:outline-none cursor-pointer"
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>{language.flag}</option>
          ))}
        </select>
      </div>
    </header>
  );
}
