# Google Translate Integration Guide

## Setup Complete! 🎉

Your ParkLink app now has Google Translate API integration across all pages.

## How to Use in Your Pages

### Method 1: Simple Text Translation (Recommended)

In any page component, import and use the hook:

```javascript
import React, { useState, useEffect } from 'react';
import { useGoogleTranslate } from '../components/LanguageSwitcher';

const MyPage = () => {
  const { translateText, currentLanguage } = useGoogleTranslate();
  const [translatedTitle, setTranslatedTitle] = useState('Find Parking');

  useEffect(() => {
    const translate = async () => {
      const result = await translateText('Find Parking');
      setTranslatedTitle(result);
    };
    translate();
  }, [currentLanguage, translateText]);

  return <h1>{translatedTitle}</h1>;
};

export default MyPage;
```

### Method 2: Translate Multiple Content at Once

```javascript
import { useTranslateContent } from '../hooks/useTranslateContent';

const MyPage = () => {
  const { translateContent, currentLanguage } = useTranslateContent();
  const [translated, setTranslated] = useState({});

  useEffect(() => {
    const translate = async () => {
      const result = await translateContent({
        title: 'Find Parking',
        description: 'Search for available slots',
        button: 'Book Now',
      });
      setTranslated(result);
    };
    translate();
  }, [currentLanguage]);

  return (
    <div>
      <h1>{translated.title}</h1>
      <p>{translated.description}</p>
      <button>{translated.button}</button>
    </div>
  );
};

export default MyPage;
```

### Method 3: Simple Hook Usage

```javascript
import { useTranslate } from '../hooks/useTranslate';

const MyPage = () => {
  const { translate, loading } = useTranslate();

  const handleTranslate = async () => {
    const result = await translate('Hello World', 'hi');
    console.log(result); // Output in Hindi
  };

  return (
    <button onClick={handleTranslate} disabled={loading}>
      {loading ? 'Translating...' : 'Translate to Hindi'}
    </button>
  );
};

export default MyPage;
```

## Supported Languages

- `en` - English
- `hi` - Hindi
- `te` - Telugu
- `es` - Spanish
- `fr` - French

## Files Modified/Created

### Backend
- `backend/.env` - Added Google Translate API credentials
- `backend/routes/translation.js` - Translation API endpoints
- `backend/utils/googleTranslate.js` - Translation utility

### Frontend
- `frontend/src/App.js` - Added TranslationProvider
- `frontend/src/components/LanguageSwitcher.js` - Enhanced with Google Translate
- `frontend/src/hooks/useTranslate.js` - Translation hook
- `frontend/src/hooks/useTranslateContent.js` - Batch translation hook
- `frontend/src/utils/translationApi.js` - API client
- `frontend/src/components/TranslateExample.js` - Example usage

## API Endpoints

### Translate Text
```
POST /api/translation/translate
Body: {
  "text": "Hello",
  "targetLanguage": "hi"
}
Response: {
  "original": "Hello",
  "translated": "नमस्ते",
  "targetLanguage": "hi"
}
```

### Detect Language
```
POST /api/translation/detect
Body: {
  "text": "Bonjour"
}
Response: {
  "text": "Bonjour",
  "detectedLanguage": "fr"
}
```

## Quick Integration Checklist

- [ ] Backend server running with `npm run dev`
- [ ] Frontend server running with `npm start`
- [ ] Google Translate API key in `backend/.env`
- [ ] LanguageSwitcher component available in navbar
- [ ] Import translation hooks in your page components
- [ ] Use `translateText()` to translate content
- [ ] Test with different languages in the language switcher

## Testing

1. Start both servers
2. Open http://localhost:3000
3. Click language switcher (Globe icon in navbar)
4. Select a language (Hindi, Spanish, etc.)
5. Page content should translate automatically

## Troubleshooting

**Translation not working?**
- Check API key in `backend/.env`
- Ensure backend is running and listening on port 5000
- Check browser console for errors
- Verify TranslationProvider wraps your app in App.js

**Language switcher not showing?**
- Ensure LanguageSwitcher is imported in Navbar
- Check that TranslationProvider is in App.js

**Slow translations?**
- Translations are cached after first request
- First translation for each string takes 1-2 seconds
- Consider pre-translating common strings on app load
