import api from './api';

// Translation API
export const translationAPI = {
  translate: (text, targetLanguage) =>
    api.post('/translation/translate', {
      text,
      targetLanguage,
    }),

  detectLanguage: (text) =>
    api.post('/translation/detect', {
      text,
    }),
};

export default translationAPI;
