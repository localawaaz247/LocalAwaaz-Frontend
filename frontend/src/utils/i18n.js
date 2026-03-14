import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your translation files
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import awaTranslations from '../locales/awa.json';
import bhoTranslations from '../locales/bho.json';
import mrTranslations from '../locales/mr.json';
import rajTranslations from '../locales/raj.json';
import harTranslations from '../locales/har.json';
import guTranslations from '../locales/gu.json';
import teTranslations from '../locales/te.json';
import taTranslations from '../locales/ta.json';
import knTranslations from '../locales/kn.json';
import bnTranslations from '../locales/bn.json';

const resources = {
    en: { translation: enTranslations },
    hi: { translation: hiTranslations },
    awa: { translation: awaTranslations },
    bho: { translation: bhoTranslations },
    mr: { translation: mrTranslations },
    raj: { translation: rajTranslations },
    har: { translation: harTranslations },
    gu: { translation: guTranslations },
    te: { translation: teTranslations },
    ta: { translation: taTranslations },
    kn: { translation: knTranslations },
    bn: { translation: bnTranslations }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en", // Default language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: false
        }
    });

export default i18n;