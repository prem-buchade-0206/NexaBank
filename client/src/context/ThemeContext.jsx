import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { THEMES, THEME_STORAGE_KEY } from '../constants';
import { storage } from '../utils';

const ThemeContext = createContext(null);

const resolveActive = (preference) => {
  if (preference === THEMES.SYSTEM) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEMES.DARK
      : THEMES.LIGHT;
  }
  return preference;
};

/** Adds .theme-transitioning to <html> for `duration`ms then removes it. */
const withTransition = (fn, duration = 450) => {
  const html = document.documentElement;
  html.classList.add('theme-transitioning');
  fn();
  const timer = setTimeout(() => html.classList.remove('theme-transitioning'), duration);
  return () => clearTimeout(timer);
};

export const ThemeProvider = ({ children }) => {
  const [preference, setPreferenceRaw] = useState(() => {
    const saved = storage.get(THEME_STORAGE_KEY);
    return saved && Object.values(THEMES).includes(saved) ? saved : THEMES.SYSTEM;
  });

  const [activeTheme, setActiveTheme] = useState(() =>
    resolveActive(storage.get(THEME_STORAGE_KEY) || THEMES.SYSTEM)
  );

  // Keep a ref to avoid stale closures in the mq listener
  const preferenceRef = useRef(preference);
  preferenceRef.current = preference;

  // Apply theme to DOM with smooth transition
  const applyTheme = useCallback((pref) => {
    withTransition(() => {
      const resolved = resolveActive(pref);
      setActiveTheme(resolved);
      document.documentElement.setAttribute('data-theme', resolved);
    });
  }, []);

  // Whenever preference changes → persist + apply
  useEffect(() => {
    storage.set(THEME_STORAGE_KEY, preference);
    applyTheme(preference);

    // If system, listen for OS-level changes
    if (preference === THEMES.SYSTEM) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme(THEMES.SYSTEM);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [preference, applyTheme]);

  const setTheme = useCallback((pref) => {
    if (Object.values(THEMES).includes(pref)) setPreferenceRaw(pref);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceRaw(prev => {
      const current = resolveActive(prev);
      return current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{
      theme: activeTheme,
      preference,
      setTheme,
      toggleTheme,
      isDark: activeTheme === THEMES.DARK,
      isLight: activeTheme === THEMES.LIGHT,
      isSystem: preference === THEMES.SYSTEM,
      THEMES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeContext;