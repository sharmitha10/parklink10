import React, { useState, useEffect } from 'react';
import { useGoogleTranslate } from '../components/LanguageSwitcher';

/**
 * Example: How to use Google Translate in your pages
 * 
 * In any page component, add these lines:
 * 
 * const { translateText, currentLanguage } = useGoogleTranslate();
 * const [translated, setTranslated] = useState('Original Text');
 * 
 * useEffect(() => {
 *   const doTranslate = async () => {
 *     const result = await translateText('Original Text');
 *     setTranslated(result);
 *   };
 *   doTranslate();
 * }, [currentLanguage]);
 */

export const TranslateExample = () => {
  const { translateText, currentLanguage } = useGoogleTranslate();
  const [translatedTitle, setTranslatedTitle] = useState('Find Parking');
  const [translatedDesc, setTranslatedDesc] = useState('Search for available parking slots');

  useEffect(() => {
    const translatePage = async () => {
      const title = await translateText('Find Parking');
      const desc = await translateText('Search for available parking slots');
      setTranslatedTitle(title);
      setTranslatedDesc(desc);
    };
    translatePage();
  }, [currentLanguage, translateText]);

  return (
    <div>
      <h1>{translatedTitle}</h1>
      <p>{translatedDesc}</p>
    </div>
  );
};

export default TranslateExample;
