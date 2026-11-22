import { useEffect, useMemo, useState } from 'react';
import Header from './components/layout/Header.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import FrictionView from './components/friction/FrictionView.jsx';
import ImportView from './components/import/ImportView.jsx';
import WordModal from './components/modals/WordModal.jsx';
import ProfileView from './components/profile/ProfileView.jsx';
import ReelsFeed from './components/reels/ReelsFeed.jsx';
import SrsView from './components/srs/SrsView.jsx';
import VaultView from './components/vault/VaultView.jsx';
import { UI_TRANSLATIONS } from './config/translations.js';
import { LANGUAGES } from './config/languages.js';
import useVault from './hooks/useVault.js';
import useProfileSettings from './hooks/useProfileSettings.js';
import useWordClips from './hooks/useWordClips.js';
import { evaluateSentence, fetchWordClips, importVideo } from './services/apiClient.js';

const EMPTY_VAULT = [];

export default function App() {
  const [uiLang, setUiLang] = useState('es');
  const [targetLang, setTargetLang] = useState('en');
  const [vaultLanguage, setVaultLanguage] = useState('en');
  const [mixedClips, setMixedClips] = useState([]);
  const [isSearchingVault, setIsSearchingVault] = useState(false);
  const [vaultSearchError, setVaultSearchError] = useState('');
  const [activeTab, setActiveTab] = useState('immersion');
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);
  const [selectedWordModal, setSelectedWordModal] = useState(null);
  const [clozeInput, setClozeInput] = useState('');
  const [clozeFeedback, setClozeFeedback] = useState(null);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [frictionError, setFrictionError] = useState('');
  const [userSentence, setUserSentence] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState(null);
  const [evaluationError, setEvaluationError] = useState('');
  const [isEvaluatingSentence, setIsEvaluatingSentence] = useState(false);
  const [srsRevealed, setSrsRevealed] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importedLesson, setImportedLesson] = useState(null);
  const [importError, setImportError] = useState('');
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const {
    profiles,
    activeProfileId,
    settings: profileSettings,
    watchedVideoCount,
    storageError: profileStorageError,
    updateSettings: updateProfileSettings,
    createProfile,
    selectProfile,
    registerVideos,
    markVideoWatched,
    isVideoWatched
  } = useProfileSettings();
  const availableLanguages = LANGUAGES.filter(
    (language) => profileSettings.learningLanguages.includes(language.code)
  );
  const { wordList, isLoading, error: clipsError, loadWordClips } = useWordClips(
    targetLang,
    uiLang
  );
  const { vaults, toggleVault, addWord, removeWord, isWordInVault, rateRecall, storageError } = useVault();
  const vaultWords = vaults[vaultLanguage] || EMPTY_VAULT;
  const translations = UI_TRANSLATIONS[uiLang] || UI_TRANSLATIONS.es;

  const resetDeck = () => {
    setActiveWordIndex(0);
    setActiveClipIndex(0);
    setClozeInput('');
    setClozeFeedback(null);
    setUserSentence('');
    setAiEvaluation(null);
  };

  const currentWord = wordList[activeWordIndex];
  const currentWordClips = useMemo(
    () => currentWord?.clips || [],
    [currentWord?.clips]
  );
  const currentClip = currentWordClips[activeClipIndex] || currentWordClips[0];

  useEffect(() => {
    if (!currentWord?.word) return undefined;
    const controller = new AbortController();
    loadWordClips(currentWord.word, controller.signal);
    return () => controller.abort();
  }, [currentWord?.word, loadWordClips]);

  useEffect(() => {
    registerVideos(targetLang, wordList.flatMap((item) => item.clips || []));
  }, [activeProfileId, registerVideos, targetLang, wordList]);

  useEffect(() => {
    registerVideos(vaultLanguage, mixedClips);
  }, [activeProfileId, registerVideos, vaultLanguage, mixedClips]);

  function playClipAudio(textToSpeak, langCode = targetLang, speed = playbackSpeed, muteWord = false) {
    if (!('speechSynthesis' in window)) {
      setFrictionError('Speech playback is not supported by this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const text = textToSpeak || '';
    const cleanText = muteWord && currentWord
      ? text.replace(new RegExp(currentWord.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '… ')
      : text;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = LANGUAGES.find((language) => language.code === langCode)?.speechLang || 'en-US';
    utterance.rate = speed;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      setFrictionError('The browser could not play this speech.');
    };
    window.speechSynthesis.speak(utterance);
  }

  function checkClozeAnswer(input = clozeInput) {
    if (!currentWord) return;
    setClozeFeedback(input.toLocaleLowerCase().trim() === currentWord.word.toLocaleLowerCase().trim()
      ? 'correct'
      : 'incorrect');
  }

  function handleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFrictionError('Voice recognition is not supported by this browser. Type the word instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES.find((language) => language.code === targetLang)?.speechLang || 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => {
      setFrictionError('');
      setIsListeningSpeech(true);
    };
    recognition.onend = () => setIsListeningSpeech(false);
    recognition.onerror = (event) => {
      setIsListeningSpeech(false);
      setFrictionError(`Voice recognition failed: ${event.error}`);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLocaleLowerCase().trim();
      setClozeInput(transcript);
      checkClozeAnswer(transcript);
    };
    recognition.start();
  }

  async function evaluateSentenceWithAI() {
    if (!userSentence.trim() || !currentWord) return;
    setIsEvaluatingSentence(true);
    setAiEvaluation(null);
    setEvaluationError('');
    try {
      const result = await evaluateSentence({
        sentence: userSentence,
        word: currentWord.word,
        targetLang,
        uiLang
      });
      setAiEvaluation(result);
    } catch (error) {
      setEvaluationError(error.message);
    } finally {
      setIsEvaluatingSentence(false);
    }
  }

  async function searchAndMixVaultClips(language, selectedWords) {
    if (!selectedWords.length) return;
    setIsSearchingVault(true);
    setVaultSearchError('');
    setMixedClips([]);
    try {
      const vocabulary = vaults[language] || [];
      const results = await Promise.allSettled(selectedWords.map(async (word) => {
        const clips = await fetchWordClips({ word, targetLang: language, uiLang });
        const wordEntry = vocabulary.find((item) => item.word.toLowerCase() === word.toLowerCase());
        return clips.map((clip) => ({ ...clip, keyword: word, vocabularyWord: wordEntry }));
      }));
      const failedSearches = results.filter((result) => result.status === 'rejected');
      const uniqueClips = new Map();
      results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
        .forEach((clip) => {
          const key = `${clip.videoId}:${clip.startSec || 0}`;
          if (!uniqueClips.has(key)) uniqueClips.set(key, clip);
        });
      const availableClips = [...uniqueClips.values()];
      if (!availableClips.length) {
        const details = failedSearches.map((result) => result.reason?.message).filter(Boolean);
        throw new Error(details.join(' ') || 'No se encontraron clips para las palabras seleccionadas.');
      }

      const unseenClips = [];
      const seenClips = [];
      availableClips.forEach((clip) => (
        (isVideoWatched(language, clip.videoId) ? seenClips : unseenClips).push(clip)
      ));
      for (const clips of [unseenClips, seenClips]) {
        for (let index = clips.length - 1; index > 0; index -= 1) {
          const randomIndex = Math.floor(Math.random() * (index + 1));
          [clips[index], clips[randomIndex]] = [clips[randomIndex], clips[index]];
        }
      }
      setMixedClips([...unseenClips, ...seenClips].slice(0, 10));
      if (failedSearches.length) {
        const failedWords = selectedWords.filter((_, index) => results[index].status === 'rejected');
        setVaultSearchError(`Sin resultados para: ${failedWords.join(', ')}. Se mezclaron los clips disponibles.`);
      }
      setVaultLanguage(language);
      setTargetLang(language);
      setActiveTab('immersion');
    } catch (error) {
      console.error('Could not search vault vocabulary clips:', error);
      setVaultSearchError(error.message || 'No se pudieron buscar clips.');
    } finally {
      setIsSearchingVault(false);
    }
  }

  async function processImportedLink() {
    if (!importUrl.trim()) return;
    setIsProcessingImport(true);
    setImportError('');
    setImportedLesson(null);
    try {
      setImportedLesson(await importVideo({ url: importUrl, targetLang, uiLang }));
    } catch (error) {
      setImportError(error.message);
    } finally {
      setIsProcessingImport(false);
    }
  }

  function advanceWord() {
    if (!wordList.length) return;
    setActiveWordIndex((index) => (index + 1) % wordList.length);
    setActiveClipIndex(0);
    setClozeInput('');
    setClozeFeedback(null);
    setAiEvaluation(null);
  }

  function goToNextClip() {
    if (!currentWord?.clips?.length) return;
    if (activeClipIndex < currentWord.clips.length - 1) {
      setActiveClipIndex((index) => index + 1);
    } else {
      advanceWord();
    }
  }

  function rateCurrentRecall(rating) {
    if (currentWord && isWordInVault(currentWord.word, targetLang)) {
      rateRecall(currentWord.word, rating, targetLang);
    }
    setSrsRevealed(false);
    advanceWord();
  }

  function handleProfileSettingsUpdate(patch) {
    updateProfileSettings(patch);
    if (patch.learningLanguages && !patch.learningLanguages.includes(targetLang)) {
      resetDeck();
      setMixedClips([]);
      setTargetLang(patch.learningLanguages[0]);
      setVaultLanguage(patch.learningLanguages[0]);
    }
  }

  function handleProfileSelect(profileId) {
    const nextProfile = profiles.find((profile) => profile.id === profileId);
    if (!nextProfile) return;
    selectProfile(profileId);
    const nextLanguage = nextProfile.settings.learningLanguages.includes(targetLang)
      ? targetLang
      : nextProfile.settings.learningLanguages[0];
    resetDeck();
    setMixedClips([]);
    setTargetLang(nextLanguage);
    setVaultLanguage(nextLanguage);
  }

  const fallbackMeaning = selectedWordModal
    ? currentWord?.dictionaryMeaning?.[uiLang] || currentWord?.dictionaryMeaning?.es || ''
    : '';

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center antialiased">
      <div className="w-full h-screen sm:h-[880px] sm:max-w-[420px] sm:rounded-[3rem] sm:border-[8px] sm:border-slate-800 sm:shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black flex flex-col overflow-hidden relative">
        <Header
          title={translations.appTitle}
          targetLang={targetLang}
          uiLang={uiLang}
          availableLanguages={availableLanguages}
          onTargetLanguageChange={(language) => {
            resetDeck();
            setMixedClips([]);
            setTargetLang(language);
            setVaultLanguage(language);
          }}
          onUiLanguageChange={setUiLang}
        />
        <main className="flex-1 relative overflow-hidden flex flex-col bg-slate-950">
          {(clipsError || storageError || profileStorageError || vaultSearchError) && (
            <p role="alert" className="absolute top-2 left-2 right-2 z-40 rounded-xl bg-rose-950/90 p-2 text-[10px] text-rose-200">
              {vaultSearchError || clipsError || storageError || profileStorageError}
            </p>
          )}
          {activeTab === 'immersion' && (
            <ReelsFeed
              word={currentWord ? { ...currentWord, clips: currentWordClips } : currentWord}
              clip={currentClip}
              feedClips={mixedClips.length ? mixedClips : undefined}
              activeProfileId={activeProfileId}
              targetLang={mixedClips.length ? vaultLanguage : targetLang}
              isVideoWatched={isVideoWatched}
              isLoading={isLoading && mixedClips.length === 0}
              clipIndex={activeClipIndex}
              playbackSpeed={playbackSpeed}
              isPlaying={isPlaying}
              isSaved={currentWord ? isWordInVault(currentWord.word, targetLang) : false}
              hideTranslation={hideTranslation}
              uiLang={uiLang}
              translations={translations}
              onSetPlaybackSpeed={setPlaybackSpeed}
              onPlaySentence={(sentence) => playClipAudio(sentence)}
              onPlayWord={() => playClipAudio(currentWord?.word, targetLang, 0.9)}
              onToggleVault={() => currentWord && toggleVault(currentWord, targetLang)}
              onToggleTranslation={() => setHideTranslation((hidden) => !hidden)}
              onSelectWord={(selection) => setSelectedWordModal({ ...selection, targetLang })}
              onVideoWatched={(clip) => markVideoWatched(targetLang, clip.videoId)}
              onNextClip={goToNextClip}
            />
          )}
          {activeTab === 'friction' && (
            <FrictionView
              word={currentWord}
              clip={currentClip}
              translations={translations}
              clozeInput={clozeInput}
              onClozeInput={setClozeInput}
              onCheckAnswer={() => checkClozeAnswer()}
              clozeFeedback={clozeFeedback}
              onVoiceInput={handleVoiceInput}
              isListeningSpeech={isListeningSpeech}
              userSentence={userSentence}
              onUserSentence={setUserSentence}
              onEvaluate={evaluateSentenceWithAI}
              isEvaluating={isEvaluatingSentence}
              evaluation={aiEvaluation}
              onPlayMuted={() => playClipAudio(currentClip?.targetSentence, targetLang, playbackSpeed, true)}
              error={frictionError || evaluationError}
            />
          )}
          {activeTab === 'srs' && (
            <SrsView
              word={currentWord}
              clip={currentClip}
              translations={translations}
              uiLang={uiLang}
              revealed={srsRevealed}
              onReveal={() => setSrsRevealed(true)}
              onRate={rateCurrentRecall}
              onPlay={() => playClipAudio(currentClip?.targetSentence)}
            />
          )}
          {activeTab === 'vault' && (
            <VaultView
              words={vaultWords}
              languages={LANGUAGES}
              targetLang={vaultLanguage}
              uiLang={uiLang}
              translations={translations}
              onAdd={addWord}
              onLanguageChange={setVaultLanguage}
              onSearchAndMix={searchAndMixVaultClips}
              isSearching={isSearchingVault}
              onRemove={(word) => removeWord(word.word, vaultLanguage)}
            />
          )}
          {activeTab === 'import' && (
            <ImportView
              translations={translations}
              importUrl={importUrl}
              onUrlChange={setImportUrl}
              onImport={processImportedLink}
              isLoading={isProcessingImport}
              lesson={importedLesson}
              error={importError}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileView
              profiles={profiles}
              activeProfileId={activeProfileId}
              settings={profileSettings}
              watchedVideoCount={watchedVideoCount}
              onSelectProfile={handleProfileSelect}
              onCreateProfile={(name) => {
                createProfile(name);
                resetDeck();
                setMixedClips([]);
              }}
              onUpdate={handleProfileSettingsUpdate}
            />
          )}
        </main>
        <WordModal
          selection={selectedWordModal}
          uiLang={uiLang}
          translations={translations}
          fallbackMeaning={fallbackMeaning}
          onClose={() => setSelectedWordModal(null)}
          onPlay={() => playClipAudio(selectedWordModal?.word)}
          onSave={() => {
            toggleVault({
              word: selectedWordModal?.word,
              phonetic: '/native/',
              dictionaryMeaning: fallbackMeaning ? { [uiLang]: fallbackMeaning } : {}
            }, selectedWordModal?.targetLang || targetLang);
            setSelectedWordModal(null);
          }}
        />
        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} translations={translations} />
      </div>
    </div>
  );
}
