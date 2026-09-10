import type { Lang } from '../lib/lang';

/** Подписи уже отвеченного вопроса в ленте чата. */

export type AnsweredDict = {
  yesApply: string;
  noPickAnother: string;
  segments: (names: string) => string;
  noSegments: string;
  answer: string;
  hideContext: string;
  showContext: string;
};

export const answeredDict: Record<Lang, AnsweredDict> = {
  ru: {
    yesApply: 'Да, применяем',
    noPickAnother: 'Нет, выбрать другой вариант',
    segments: (names) => `Сегменты: ${names}`,
    noSegments: 'Без разбивки по сегментам',
    answer: 'Ответ',
    hideContext: 'Скрыть контекст',
    showContext: 'Показать контекст вопроса',
  },
  en: {
    yesApply: 'Yes, apply it',
    noPickAnother: 'No, pick another option',
    segments: (names) => `Segments: ${names}`,
    noSegments: 'No segment breakdown',
    answer: 'Answer',
    hideContext: 'Hide the context',
    showContext: 'Show the context of the question',
  },
};
