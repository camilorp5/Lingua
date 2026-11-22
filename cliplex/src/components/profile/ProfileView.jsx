import { LANGUAGES } from '../../config/languages.js';

export default function ProfileView({ settings, onUpdate }) {
  function toggleLearningLanguage(code) {
    const learningLanguages = settings.learningLanguages.includes(code)
      ? settings.learningLanguages.filter((language) => language !== code)
      : [...settings.learningLanguages, code];
    if (learningLanguages.length) onUpdate({ learningLanguages });
  }

  return (
    <div className="w-full h-full p-4 overflow-y-auto flex flex-col gap-5 bg-slate-950">
      <header className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <span className="text-2xl">👤</span>
        <h1 className="text-xl font-black text-white mt-2">Perfil y ajustes</h1>
        <p className="text-xs text-slate-400 mt-1">Elige qué idiomas quieres ver en el selector principal.</p>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Idiomas en aprendizaje</h2>
          <p className="text-xs text-slate-400 mt-1">El selector principal solo mostrará los idiomas marcados.</p>
        </div>
        <div className="flex flex-col gap-2">
          {LANGUAGES.map((language) => {
            const checked = settings.learningLanguages.includes(language.code);
            return (
              <label
                key={language.code}
                className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={checked && settings.learningLanguages.length === 1}
                  onChange={() => toggleLearningLanguage(language.code)}
                  className="accent-amber-400"
                />
                <span>{language.flag} {language.name}</span>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
