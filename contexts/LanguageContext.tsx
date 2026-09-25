import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fa, TranslationKeys } from '../locales/fa';
import { en } from '../locales/en';

export type Language = 'fa' | 'en';
export type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, fallback?: string) => string;
  strings: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'cmc_app_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'fa') return saved;
    } catch (e) {
      // localStorage unavailable
    }
    return 'fa'; // Default to Persian
  });

  const direction: Direction = language === 'fa' ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) {}

    // Update document HTML direction and lang attribute
    document.documentElement.dir = direction;
    document.documentElement.lang = language;

    if (language === 'en') {
      document.documentElement.classList.add('font-sans-en');
      document.documentElement.classList.remove('font-sans-fa');
    } else {
      document.documentElement.classList.add('font-sans-fa');
      document.documentElement.classList.remove('font-sans-en');
    }
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'fa' ? 'en' : 'fa'));
  };

  const currentStrings = language === 'en' ? en : fa;

  /**
   * Helper function to get nested translation values
   * e.g. t('nav.overview') or t('common.save')
   */
  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let current: any = currentStrings;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback || path;
      }
    }

    return typeof current === 'string' ? current : (fallback || path);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        setLanguage,
        toggleLanguage,
        t,
        strings: currentStrings,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
