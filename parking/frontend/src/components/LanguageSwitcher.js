import React, { useState, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Globe } from 'lucide-react';
import { translationAPI } from '../utils/translationApi';
import './LanguageSwitcher.css';

// Create Translation Context
const TranslationContext = createContext();

export const useGoogleTranslate = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useGoogleTranslate must be used within TranslationProvider');
  }
  return context;
};

export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Prefer explicit googleLanguage, fall back to legacy 'language' key, default to English
    return localStorage.getItem('googleLanguage') || localStorage.getItem('language') || 'en';
  });
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false);

  const translateText = async (text, targetLang = currentLanguage) => {
    if (targetLang === 'en' || !text) return text;

    const cacheKey = `${text}-${targetLang}`;
    if (translations[cacheKey]) return translations[cacheKey];

    try {
      const result = await translationAPI.translate(text, targetLang);
      const translated = result.data.translated;
      setTranslations(prev => ({ ...prev, [cacheKey]: translated }));
      return translated;
    } catch (err) {
      console.error('Translation error:', err);
      return text;
    }
  };

  const value = {
    currentLanguage,
    setCurrentLanguage,
    translateText,
    loading,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook to expose auto-translate helpers
export const useAutoTranslate = () => {
  const { currentLanguage, translateText } = useContext(TranslationContext);

  // synchronous fallback: if there is an i18n key, use it, otherwise return original
  const tSync = (keyOrText) => {
    if (!keyOrText) return keyOrText;
    if (i18n.exists(keyOrText)) return i18n.t(keyOrText);
    return keyOrText;
  };

  // asynchronous auto-translate: uses i18n key if present, otherwise calls translation API
  const tAsync = async (keyOrText) => {
    if (!keyOrText) return keyOrText;
    if (i18n.exists(keyOrText)) return i18n.t(keyOrText);
    if (currentLanguage === 'en') return keyOrText;
    try {
      const res = await translationAPI.translate(keyOrText, currentLanguage);
      return res.data.translated || keyOrText;
    } catch (err) {
      console.error('Auto-translate failed', err);
      return keyOrText;
    }
  };

  return { tSync, tAsync, currentLanguage };
};

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { currentLanguage, setCurrentLanguage } = useGoogleTranslate();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', googleCode: 'en' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳', googleCode: 'hi' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳', googleCode: 'te' },
    { code: 'es', name: 'Español', flag: '🇪🇸', googleCode: 'es' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', googleCode: 'fr' },
  ];

  const changeLanguage = (langCode, googleCode) => {
    i18n.changeLanguage(langCode);
    setCurrentLanguage(googleCode);
    localStorage.setItem('language', langCode);
    localStorage.setItem('googleLanguage', googleCode);
  };

  return (
    <div className="language-switcher">
      <button className="language-btn">
        <Globe size={20} />
        <span className="current-lang">
          {languages.find(lang => lang.googleCode === currentLanguage)?.flag || '🇬🇧'}
        </span>
      </button>
      <div className="language-dropdown">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code, lang.googleCode)}
            className={`language-option ${currentLanguage === lang.googleCode ? 'active' : ''}`}
          >
            <span className="flag">{lang.flag}</span>
            <span className="lang-name">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;

