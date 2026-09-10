import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Язык интерфейса. Тот же контракт, что на сайте (`verdict_website`), и
 * намеренно тот же ключ хранения: сайт и приложение живут на разных origin,
 * поэтому значение не разделяется само собой, но человек, переключивший язык
 * в одном браузере, получает его же в обоих вкладках одного origin.
 *
 * Язык уезжает и на бэкенд — заголовком `X-Verdict-Lang` на каждом запросе и
 * ручкой `PATCH /auth/me/locale` при переключении. Первое нужно для текстов
 * прогона, второе — для писем: письмо уходит из фонового процесса, у которого
 * никакого браузера нет.
 */

export type Lang = 'ru' | 'en';

const STORAGE_KEY = 'verdict-lang';

type LangContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

function readStored(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ru';
  } catch {
    // приватный режим/заблокированные куки — язык просто не переживёт перезагрузку
    return 'ru';
  }
}

/** Язык для слоя API, которому React-контекст недоступен. */
export function currentLang(): Lang {
  return readStored();
}

export function storeLang(next: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* см. readStored */
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    storeLang(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang вне LangProvider');
  return ctx;
}

/** Достаёт нужную половину словаря экрана или компонента. */
export function useDict<T>(dict: Record<Lang, T>): T {
  return dict[useLang().lang];
}
