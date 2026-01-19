// Simple i18n replacement for tap:i18n
const translations = {
  en: {},
  es: {},
  fr: {},
  de: {},
  it: {},
  he: {}
};

let currentLanguage = 'en';
let translationsLoaded = false;

// Import translations (these will be loaded in client context)
if (Meteor.isClient) {
  // Load translation JSON files - use async immediately-invoked function
  (async () => {
    try {
      const langs = ['en', 'es', 'fr', 'de', 'it', 'he'];
      const promises = langs.map(lang =>
        fetch(`/translations/${lang}.json`)
          .then(r => r.json())
          .then(data => {
            translations[lang] = data;
          })
          .catch(err => console.error(`Failed to load ${lang} translations:`, err))
      );
      await Promise.all(promises);
      translationsLoaded = true;
    } catch (err) {
      console.error('Error loading translations:', err);
    }
  })();
}

const i18n = {
  /**
   * Get translated string
   * @param {string} key - dot-notation key (e.g., "ui.welcome")
   * @returns {string} - translated string or key if not found
   */
  __(key) {
    const keys = key.split('.');
    let value = translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }

    return value !== undefined && value !== null ? value : key;
  },

  /**
   * Get all available languages
   * @returns {object} - languages object with names
   */
  getLanguages() {
    return {
      en: { name: 'English' },
      es: { name: 'Español' },
      fr: { name: 'Français' },
      de: { name: 'Deutsch' },
      it: { name: 'Italiano' },
      he: { name: 'עברית' }
    };
  },

  /**
   * Set current language
   * @param {string} lang - language code
   * @returns {Promise}
   */
  setLanguage(lang) {
    currentLanguage = lang;
    // Trigger reactivity in Blaze if Session is available
    if (typeof Session !== 'undefined') {
      Session.set('language', lang);
    }
    // Wait for translations to load before resolving
    return new Promise((resolve) => {
      const checkTranslations = () => {
        if (translationsLoaded || (translations[lang] && Object.keys(translations[lang]).length > 0)) {
          resolve();
        } else {
          setTimeout(checkTranslations, 50);
        }
      };
      checkTranslations();
    });
  },

  /**
   * Get current language
   * @returns {string} - current language code
   */
  getLanguage() {
    return currentLanguage;
  },

  /**
   * Check if translations are loaded
   * @returns {boolean}
   */
  isReady() {
    return translationsLoaded || (translations['en'] && Object.keys(translations['en']).length > 0);
  }
};

// Make globally available
if (Meteor.isClient) {
  window.TAPi18n = i18n;
}
