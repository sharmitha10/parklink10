// Using REST API directly via axios for simplicity
const axios = require('axios');

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Translate text to target language
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code (e.g., 'hi', 'es', 'fr')
 * @returns {Promise<string>} Translated text
 */
const translateText = async (text, targetLanguage) => {
  try {
    const response = await axios.post(`${TRANSLATE_URL}?key=${API_KEY}`, {
      q: text,
      target: targetLanguage,
    });

    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Google Translate error:', error.message);
    throw new Error('Translation failed: ' + error.message);
  }
};

/**
 * Detect language of given text
 * @param {string} text - Text to detect language for
 * @returns {Promise<string>} Language code
 */
const detectLanguage = async (text) => {
  try {
    const response = await axios.post(`${TRANSLATE_URL}?key=${API_KEY}`, {
      q: text,
    });

    return response.data.data.detections[0][0].language;
  } catch (error) {
    console.error('Language detection error:', error.message);
    throw new Error('Language detection failed: ' + error.message);
  }
};

module.exports = {
  translateText,
  detectLanguage,
};
