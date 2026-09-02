import { create } from 'zustand';
import { en } from './en';
import { fr } from './fr';

export type Language = 'en' | 'fr';

interface TranslationState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof en;
}

export const useTranslation = create<TranslationState>((set, get) => ({
  language: 'en',
  t: en,
  setLanguage: (language: Language) => {
    set({
      language,
      t: language === 'fr' ? fr : en,
    });
  },
}));

export { en, fr };
