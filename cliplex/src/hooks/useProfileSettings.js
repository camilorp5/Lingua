import { useCallback, useEffect, useState } from 'react';
import { LANGUAGES } from '../config/languages.js';

const STORAGE_KEY = 'clipLex_profiles';
const LEGACY_STORAGE_KEY = 'clipLex_profile_settings';
const LANGUAGE_CODES = LANGUAGES.map(({ code }) => code);
const DEFAULT_SETTINGS = { learningLanguages: LANGUAGE_CODES };

function normalizeSettings(settings) {
  const learningLanguages = Array.isArray(settings?.learningLanguages)
    ? settings.learningLanguages.filter((code) => LANGUAGE_CODES.includes(code))
    : DEFAULT_SETTINGS.learningLanguages;

  return {
    learningLanguages: learningLanguages.length ? learningLanguages : DEFAULT_SETTINGS.learningLanguages
  };
}

function createDefaultProfile(settings = DEFAULT_SETTINGS) {
  return {
    id: 'default',
    name: 'Perfil 1',
    settings: normalizeSettings(settings),
    videoHistory: {}
  };
}

function readProfileState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved?.profiles) && saved.profiles.length) {
      const profiles = saved.profiles
        .filter((profile) => typeof profile?.id === 'string' && typeof profile.name === 'string')
        .map((profile) => ({
          id: profile.id,
          name: profile.name,
          settings: normalizeSettings(profile.settings),
          videoHistory: profile.videoHistory
            && typeof profile.videoHistory === 'object'
            && !Array.isArray(profile.videoHistory)
            ? profile.videoHistory
            : {}
        }));
      if (profiles.length) {
        return {
          profiles,
          activeProfileId: profiles.some((profile) => profile.id === saved.activeProfileId)
            ? saved.activeProfileId
            : profiles[0].id,
          storageError: ''
        };
      }
    }

    const legacySettings = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || 'null');
    return {
      profiles: [createDefaultProfile(legacySettings)],
      activeProfileId: 'default',
      storageError: ''
    };
  } catch (error) {
    console.error('Could not read profile data:', error);
    return {
      profiles: [createDefaultProfile()],
      activeProfileId: 'default',
      storageError: 'Could not load profiles from this browser.'
    };
  }
}

function createProfileId() {
  return globalThis.crypto?.randomUUID?.()
    || `profile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function useProfileSettings() {
  const [profileState, setProfileState] = useState(readProfileState);
  const [storageError, setStorageError] = useState(profileState.storageError);
  const activeProfile = profileState.profiles.find(
    (profile) => profile.id === profileState.activeProfileId
  ) || profileState.profiles[0];

  useEffect(() => {
    let active = true;
    const persistProfile = async () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          profiles: profileState.profiles,
          activeProfileId: profileState.activeProfileId
        }));
        if (active) setStorageError('');
      } catch (error) {
        console.error('Could not save profile data:', error);
        if (active) setStorageError('Could not save profile changes in this browser.');
      }
    };
    persistProfile();
    return () => {
      active = false;
    };
  }, [profileState.profiles, profileState.activeProfileId]);

  const updateSettings = useCallback((patch) => {
    setProfileState((current) => ({
      ...current,
      profiles: current.profiles.map((profile) => (
        profile.id === current.activeProfileId
          ? { ...profile, settings: { ...profile.settings, ...patch } }
          : profile
      ))
    }));
  }, []);

  const createProfile = useCallback((name) => {
    const profile = {
      id: createProfileId(),
      name: name.trim(),
      settings: normalizeSettings(),
      videoHistory: {}
    };
    setProfileState((current) => ({
      ...current,
      profiles: [...current.profiles, profile],
      activeProfileId: profile.id
    }));
  }, []);

  const selectProfile = useCallback((profileId) => {
    setProfileState((current) => (
      current.profiles.some((profile) => profile.id === profileId)
        ? { ...current, activeProfileId: profileId }
        : current
    ));
  }, []);

  const registerVideos = useCallback((language, clips) => {
    const firstSeenAt = new Date().toISOString();
    setProfileState((current) => ({
      ...current,
      profiles: current.profiles.map((profile) => {
        if (profile.id !== current.activeProfileId) return profile;
        let changed = false;
        const videoHistory = { ...profile.videoHistory };
        clips.forEach((clip) => {
          if (!clip?.videoId) return;
          const key = `${language}:${clip.videoId}`;
          if (!videoHistory[key]) {
            videoHistory[key] = { status: 'unwatched', firstSeenAt };
            changed = true;
          }
        });
        return changed ? { ...profile, videoHistory } : profile;
      })
    }));
  }, []);

  const markVideoWatched = useCallback((language, videoId) => {
    if (!videoId) return;
    const watchedAt = new Date().toISOString();
    setProfileState((current) => ({
      ...current,
      profiles: current.profiles.map((profile) => {
        if (profile.id !== current.activeProfileId) return profile;
        const key = `${language}:${videoId}`;
        const previous = profile.videoHistory[key];
        if (previous?.status === 'watched') return profile;
        return {
          ...profile,
          videoHistory: {
            ...profile.videoHistory,
            [key]: {
              status: 'watched',
              firstSeenAt: previous?.firstSeenAt || watchedAt,
              watchedAt
            }
          }
        };
      })
    }));
  }, []);

  const isVideoWatched = useCallback((language, videoId) => (
    activeProfile?.videoHistory[`${language}:${videoId}`]?.status === 'watched'
  ), [activeProfile]);

  return {
    profiles: profileState.profiles,
    activeProfileId: activeProfile?.id,
    settings: activeProfile?.settings || DEFAULT_SETTINGS,
    watchedVideoCount: Object.values(activeProfile?.videoHistory || {})
      .filter((record) => record.status === 'watched').length,
    storageError,
    updateSettings,
    createProfile,
    selectProfile,
    registerVideos,
    markVideoWatched,
    isVideoWatched
  };
}
