import type { SupportedLanguagesType } from '@vben-core/typings';

export type Locale = SupportedLanguagesType;

export const messages: Partial<Record<Locale, Record<string, string>>> = {
  'en-US': {
    cancel: 'Cancel',
    collapse: 'Collapse',
    confirm: 'Confirm',
    expand: 'Expand',
    prompt: 'Prompt',
    reset: 'Reset',
    submit: 'Submit',
    toggleSidebar: 'Toggle sidebar',
    confirmTitle: 'Please Confirm',
  },
  'zh-CN': { // fallback
    cancel: 'Cancel',
    collapse: 'Collapse',
    confirm: 'Confirm',
    expand: 'Expand',
    prompt: 'Prompt',
    reset: 'Reset',
    submit: 'Submit',
    toggleSidebar: 'Toggle sidebar',
    confirmTitle: 'Please Confirm',
  },
};

export const getMessages = (locale: Locale) =>
  messages[locale] ?? messages['en-US'] ?? {};
