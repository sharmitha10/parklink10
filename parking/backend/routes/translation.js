const express = require('express');
const router = express.Router();

// Mock translation data
const translations = {
  en: require('../locales/en.json'),
  // Add more languages as needed
};

// @route   GET /api/translation/:lang
// @desc    Get translations for a specific language
// @access  Public
router.get('/:lang', (req, res) => {
  try {
    const { lang } = req.params;
    
    if (!translations[lang]) {
      return res.status(404).json({ 
        success: false, 
        message: 'Language not supported' 
      });
    }
    
    res.json({
      success: true,
      data: translations[lang]
    });
    
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error loading translations',
      error: error.message 
    });
  }
});

module.exports = router;
