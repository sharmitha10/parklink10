import { useGoogleTranslate } from '../components/LanguageSwitcher';

/**
 * Hook to translate multiple text items at once
 * Usage: const translatedContent = await translateContent({
 *   title: "Find Parking",
 *   description: "Search for available parking"
 * })
 */
export const useTranslateContent = () => {
  const { translateText, currentLanguage } = useGoogleTranslate();

  const translateContent = async (contentObject) => {
    if (currentLanguage === 'en') {
      return contentObject;
    }

    const translated = {};
    for (const [key, value] of Object.entries(contentObject)) {
      if (typeof value === 'string') {
        translated[key] = await translateText(value);
      } else if (Array.isArray(value)) {
        translated[key] = await Promise.all(
          value.map(item =>
            typeof item === 'string' ? translateText(item) : item
          )
        );
      } else {
        translated[key] = value;
      }
    }
    return translated;
  };

  return {
    translateText,
    translateContent,
    currentLanguage,
  };
};

export default useTranslateContent;
