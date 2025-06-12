import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';
import tk from './locales/tk.json';
import ru from './locales/ru.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      tr: { translation: tr },
      tk: { translation: tk },
      ru: { translation: ru },
    },
    lng: localStorage.getItem('i18nextLng') || navigator.language.split('-')[0] || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    supportedLngs: ['en', 'tr', 'tk', 'ru'],
  });

export default i18n; 