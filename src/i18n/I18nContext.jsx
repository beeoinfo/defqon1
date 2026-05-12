import { createContext, useMemo } from 'react';
import { activeSite } from '@/sites/siteDefinitions';
import { getTranslation, normalizeLanguage } from './translations';

export const I18nContext = createContext({
  language: 'en',
  defaultLanguage: 'en',
  t: (value) => value,
});

const I18nProvider = ({
  language = activeSite.defaultLanguage,
  defaultLanguage = activeSite.defaultLanguage,
  children,
}) => {
  const resolvedLanguage = normalizeLanguage(language, defaultLanguage);
  const value = useMemo(() => ({
    language: resolvedLanguage,
    defaultLanguage: normalizeLanguage(defaultLanguage),
    t: (message, replacements = {}) => getTranslation(resolvedLanguage, message, replacements),
  }), [defaultLanguage, resolvedLanguage]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export default I18nProvider;
