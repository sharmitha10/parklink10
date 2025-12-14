import { useState, useCallback } from 'react';
import { translationAPI } from '../utils/translationApi';

/**
 * Hook for translating text using Google Translate API
 * @returns {Object} Translation utilities and state
 */
export const useTranslate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const translate = useCallback(async (text, targetLanguage) => {
    if (!text || !targetLanguage) return text;
    
    setLoading(true);
    setError(null);
    try {
      const result = await translationAPI.translate(text, targetLanguage);
      setLoading(false);
      return result.data.translated;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return text;
    }
  }, []);

  const detectLanguage = useCallback(async (text) => {
    if (!text) return null;
    
    setLoading(true);
    setError(null);
    try {
      const result = await translationAPI.detectLanguage(text);
      setLoading(false);
      return result.data.detectedLanguage;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    translate,
    detectLanguage,
    loading,
    error,
  };
};

export default useTranslate;
