/**
 * QUICK START: Add Google Translate to Your Existing Pages
 * 
 * Copy-paste this template and replace the text strings with your own content
 */

import React, { useState, useEffect } from 'react';
import { useGoogleTranslate } from '../components/LanguageSwitcher';

const MyPageTemplate = () => {
  const { translateText, currentLanguage } = useGoogleTranslate();
  
  // State for translated content
  const [content, setContent] = useState({
    pageTitle: 'Page Title',
    pageDescription: 'Page description text',
    buttonText: 'Click Me',
    // Add more content here
  });

  // Auto-translate when language changes
  useEffect(() => {
    const translatePage = async () => {
      const baseContent = {
        pageTitle: 'Page Title',
        pageDescription: 'Page description text',
        buttonText: 'Click Me',
      };
      
      const translated = {};
      
      for (const [key, value] of Object.entries(baseContent)) {
        if (currentLanguage === 'en') {
          // Keep English as is
          translated[key] = value;
        } else {
          // Translate to selected language
          translated[key] = await translateText(value);
        }
      }
      
      setContent(translated);
    };

    translatePage();
  }, [currentLanguage, translateText]);

  return (
    <div>
      <h1>{content.pageTitle}</h1>
      <p>{content.pageDescription}</p>
      <button>{content.buttonText}</button>
    </div>
  );
};

export default MyPageTemplate;

/**
 * INTEGRATION STEPS:
 * 
 * 1. Open any page you want to add translation to (e.g., FindParking.js, MyBookings.js)
 * 
 * 2. Add these imports at the top:
 *    import { useGoogleTranslate } from '../components/LanguageSwitcher';
 * 
 * 3. Inside your component, add after other hooks:
 *    const { translateText, currentLanguage } = useGoogleTranslate();
 *    const [translatedContent, setTranslatedContent] = useState({
 *      key1: 'Original Text 1',
 *      key2: 'Original Text 2',
 *      key3: 'Original Text 3',
 *    });
 * 
 * 4. Add this useEffect:
 *    useEffect(() => {
 *      const translate = async () => {
 *        const trans = {};
 *        for (const [key, value] of Object.entries(translatedContent)) {
 *          if (currentLanguage === 'en') {
 *            trans[key] = value;
 *          } else {
 *            trans[key] = await translateText(value);
 *          }
 *        }
 *        setTranslatedContent(trans);
 *      };
 *      translate();
 *    }, [currentLanguage]);
 * 
 * 5. Replace text in JSX with:
 *    {translatedContent.key1}  instead of  'Original Text 1'
 * 
 * 6. Test! Open the page and click the language switcher
 */
