import { useEffect, useRef, useState } from 'react';
import * as api from './client';
import type { ChatMessage, RunProgress } from '../types';

interface Handlers {
  /** Новое сообщение агента прилетело по стриму. */
  onMessage: (message: ChatMessage) => void;
  /** Состояние теста поменялось — перечитать его с бэкенда. */
  onTestChanged: () => void;
}

const EMPTY: RunProgress = { steps: [], done: [], reports: [], mode: 'analysis' };

/**
 * Подписка на SSE-поток одного теста.
 *
 * EventSource сам переподключается при обрыве, поэтому ретраи тут не нужны —
 * достаточно перечитать тест после реконнекта (первым кадром идёт `state`).
 */
export function useTestStream(testId: string | null, handlers: Handlers): RunProgress {
  const [progress, setProgress] = useState<RunProgress>(EMPTY);

  // Хендлеры меняются каждый рендер; держим их в ref, иначе подписка будет
  // пересоздаваться и терять события.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!testId) {
      setProgress(EMPTY);
      return;
    }

    setProgress(EMPTY);
    const source = new EventSource(api.streamUrl(testId));

    const on = (event: string, handler: (data: any) => void) => {
      source.addEventListener(event, (e) => handler(JSON.parse((e as MessageEvent).data)));
    };

    // Первый кадр после (пере)подключения — синхронизируемся с бэкендом.
    on('state', () => {
      setProgress(EMPTY);
      handlersRef.current.onTestChanged();
    });

    on('run.started', (data) => {
      setProgress({ steps: data.steps ?? [], done: [], reports: [], mode: data.mode ?? 'analysis' });
      handlersRef.current.onTestChanged();
    });

    // Реплика оказалась правкой, а не вопросом: начинается настоящий пересчёт.
    on('run.mode', (data) => {
      setProgress((prev) => ({ ...prev, steps: data.steps ?? prev.steps, mode: data.mode }));
    });

    // Развёртка по метрикам: шагов стало больше, чем было в скелете. Без этого
    // список замирает на исходном и не показывает то, что реально считается.
    on('plan.extended', (data) => {
      setProgress((prev) => ({ ...prev, steps: data.steps ?? prev.steps }));
    });

    on('step.done', (data) => {
      setProgress((prev) => ({
        ...prev,
        steps: prev.steps,
        done: prev.done.includes(data.step) ? prev.done : [...prev.done, data.step],
        // Перезапуск шага (revise, ответ на HITL) заменяет свою запись,
        // а не добавляет вторую — иначе лента растёт дублями.
        reports: data.report
          ? [...prev.reports.filter((r) => r.node !== data.report.node), data.report]
          : prev.reports,
      }));
    });

    on('message', (data) => {
      handlersRef.current.onMessage({
        id: data.id,
        role: data.role,
        author: data.author,
        text: data.text,
      });
    });

    on('interrupt', () => handlersRef.current.onTestChanged());

    on('run.finished', () => {
      setProgress(EMPTY);
      handlersRef.current.onTestChanged();
    });

    return () => source.close();
  }, [testId]);

  return progress;
}
