import { LANGUAGES } from '../../config/languages.js';

const VIDEO_DURATIONS = [
  { value: 'any', label: 'Cualquier duración' },
  { value: 'short', label: 'Corto (menos de 4 min)' },
  { value: 'medium', label: 'Mediano (4–20 min)' },
  { value: 'long', label: 'Largo (más de 20 min)' }
];

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
        <p className="text-xs text-slate-400 mt-1">Personaliza los videos y los idiomas que aparecen en tu feed.</p>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Duración del video</h2>
          <p className="text-xs text-slate-400 mt-1">Filtro aplicado en las búsquedas de YouTube.</p>
        </div>
        <select
          aria-label="Duración de los videos"
          value={settings.videoDuration}
          onChange={(event) => onUpdate({ videoDuration: event.target.value })}
          className="w-full bg-slate-950 text-sm text-slate-100 px-3 py-2 rounded-xl border border-slate-700"
        >
          {VIDEO_DURATIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Idioma de relevancia</h2>
          <p className="text-xs text-slate-400 mt-1">Prioriza resultados de YouTube asociados a este idioma.</p>
        </div>
        <select
          aria-label="Idioma de relevancia"
          value={settings.relevanceLanguage}
          onChange={(event) => onUpdate({ relevanceLanguage: event.target.value })}
          className="w-full bg-slate-950 text-sm text-slate-100 px-3 py-2 rounded-xl border border-slate-700"
        >
          {LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>{language.flag} {language.name}</option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500">El filtro de subtítulos disponibles de YouTube siempre permanece activado.</p>
      </section>

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
