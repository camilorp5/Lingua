import { useState } from 'react';
import { LANGUAGES } from '../../config/languages.js';

export default function ProfileView({
  profiles,
  activeProfileId,
  settings,
  watchedVideoCount,
  onSelectProfile,
  onCreateProfile,
  onUpdate
}) {
  const [newProfileName, setNewProfileName] = useState('');

  function toggleLearningLanguage(code) {
    const learningLanguages = settings.learningLanguages.includes(code)
      ? settings.learningLanguages.filter((language) => language !== code)
      : [...settings.learningLanguages, code];
    if (learningLanguages.length) onUpdate({ learningLanguages });
  }

  function handleCreateProfile(event) {
    event.preventDefault();
    const name = newProfileName.trim();
    if (!name) return;
    onCreateProfile(name);
    setNewProfileName('');
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
          <h2 className="text-sm font-bold text-white">Perfiles</h2>
          <p className="text-xs text-slate-400 mt-1">
            El historial de videos vistos se guarda por perfil en este navegador.
          </p>
        </div>
        <label className="text-xs text-slate-300 flex flex-col gap-1">
          Perfil activo
          <select
            value={activeProfileId}
            onChange={(event) => onSelectProfile(event.target.value)}
            className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.name}</option>
            ))}
          </select>
        </label>
        <form onSubmit={handleCreateProfile} className="flex gap-2">
          <input
            value={newProfileName}
            onChange={(event) => setNewProfileName(event.target.value)}
            maxLength={40}
            aria-label="Nombre del nuevo perfil"
            placeholder="Nombre del perfil"
            className="min-w-0 flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            disabled={!newProfileName.trim()}
            className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-bold text-black disabled:opacity-50"
          >
            Crear
          </button>
        </form>
        <p className="text-xs text-slate-400">Videos vistos: {watchedVideoCount}</p>
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
