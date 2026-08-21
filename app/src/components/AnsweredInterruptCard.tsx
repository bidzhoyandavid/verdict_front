import { useState } from 'react';
import { useStore } from '../storeContext';
import { INTERRUPT_TITLES, METHOD_LABELS } from './InterruptCard';
import { MONO } from '../theme';
import type { AnsweredInterrupt } from '../types';

/** Человекочитаемый ответ из того, что ушло в `/resume`. */
function decisionText(decision: Record<string, unknown>): string {
  // Единственный вопрос, на который отвечают «да/нет», — подтверждение
  // обработки выбросов. Прежний текст был про SRM-гейт и в истории читался
  // как решение остановить весь прогон.
  if (typeof decision.agreed === 'boolean') {
    return decision.agreed ? 'Да, применяем' : 'Нет, выбрать другой вариант';
  }
  if (Array.isArray(decision.segments)) {
    return decision.segments.length
      ? `Сегменты: ${decision.segments.join(', ')}`
      : 'Без разбивки по сегментам';
  }

  const method = typeof decision.method === 'string' ? decision.method : null;
  if (!method) return JSON.stringify(decision);

  const label = METHOD_LABELS[method] ?? method;
  const params = (decision.params ?? {}) as Record<string, unknown>;
  const details = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`);

  return details.length ? `${label} (${details.join(', ')})` : label;
}

/**
 * Уже отвеченный вопрос агента в ленте чата. Живая карточка исчезает вместе с
 * паузой, а решения по данным нужно видеть и потом — на них держится трактовка
 * результатов.
 */
export function AnsweredInterruptCard({ entry }: { entry: AnsweredInterrupt }) {
  const { c } = useStore();
  const [open, setOpen] = useState(false);

  const title = INTERRUPT_TITLES[entry.payload.kind] ?? 'Как обработать выбросы?';
  const interpretation = entry.payload.report?.interpretation;

  return (
    <div
      style={{
        border: `1px solid ${c.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{title}</div>
      <div style={{ fontSize: 13, color: c.textSecondary }}>
        Ответ: <span style={{ color: c.textPrimary }}>{decisionText(entry.decision)}</span>
      </div>
      {interpretation && (
        <div style={{ fontSize: 12, color: c.textSecondary }}>
          <span onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer', color: c.accent }}>
            {open ? 'Скрыть контекст' : 'Показать контекст вопроса'}
          </span>
          {open && (
            <div style={{ marginTop: 6, fontFamily: MONO, whiteSpace: 'pre-wrap' }}>{interpretation}</div>
          )}
        </div>
      )}
    </div>
  );
}
