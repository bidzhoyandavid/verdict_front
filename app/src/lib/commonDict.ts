import type { Lang } from './lang';

/**
 * Тексты, которые встречаются в нескольких местах приложения: статусы прогона,
 * подписи кнопок, короткие служебные фразы. Отдельный словарь, а не копия в
 * каждом компоненте: статус «Нужен ответ» обязан читаться одинаково и в списке
 * тестов, и в шапке чата.
 */

export type CommonDict = {
  status: Record<string, string>;
  cancel: string;
  apply: string;
  save: string;
  close: string;
  loading: string;
};

export const commonDict: Record<Lang, CommonDict> = {
  ru: {
    status: {
      done: 'Готово',
      analyzing: 'Анализирует',
      awaiting_input: 'Нужен ответ',
      clarifying: 'Вопрос агента',
      failed: 'Ошибка',
      queued: 'В очереди',
    },
    cancel: 'Отмена',
    apply: 'Применить',
    save: 'Сохранить',
    close: 'Закрыть',
    loading: 'Подождите...',
  },
  en: {
    status: {
      done: 'Done',
      analyzing: 'Analysing',
      awaiting_input: 'Needs an answer',
      clarifying: 'Agent asked',
      failed: 'Failed',
      queued: 'Queued',
    },
    cancel: 'Cancel',
    apply: 'Apply',
    save: 'Save',
    close: 'Close',
    loading: 'One moment…',
  },
};
