import { useState } from 'react';
import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { interruptDict } from './InterruptCard.dict';
import { answeredDict } from './AnsweredInterruptCard.dict';
import type { InterruptDict } from './InterruptCard.dict';
import type { AnsweredDict } from './AnsweredInterruptCard.dict';
import { MONO } from '../theme';
import type { AnsweredInterrupt } from '../types';

/** Человекочитаемый ответ из того, что ушло в `/resume`. */
function decisionText(
  decision: Record<string, unknown>,
  t: AnsweredDict,
  methods: InterruptDict['methodLabels'],
): string {
  // Единственный вопрос, на который отвечают «да/нет», — подтверждение
  // обработки выбросов. Прежний текст был про SRM-гейт и в истории читался
  // как решение остановить весь прогон.
  if (typeof decision.agreed === 'boolean') {
    return decision.agreed ? t.yesApply : t.noPickAnother;
  }
  if (Array.isArray(decision.segments)) {
    return decision.segments.length
      ? t.segments(decision.segments.join(', '))
      : t.noSegments;
  }

  const method = typeof decision.method === 'string' ? decision.method : null;
  if (!method) return JSON.stringify(decision);

  const label = methods[method] ?? method;
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
  const t = useDict(answeredDict);
  const interrupts = useDict(interruptDict);
  const [open, setOpen] = useState(false);

  const title = interrupts.titles[entry.payload.kind] ?? interrupts.titles.outlier_review;
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
        {t.answer}:{' '}
        <span style={{ color: c.textPrimary }}>
          {decisionText(entry.decision, t, interrupts.methodLabels)}
        </span>
      </div>
      {interpretation && (
        <div style={{ fontSize: 12, color: c.textSecondary }}>
          <span onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer', color: c.accent }}>
            {open ? t.hideContext : t.showContext}
          </span>
          {open && (
            <div style={{ marginTop: 6, fontFamily: MONO, whiteSpace: 'pre-wrap' }}>{interpretation}</div>
          )}
        </div>
      )}
    </div>
  );
}
