import { useState } from 'react';
import { useStore } from '../storeContext';
import { MONO } from '../theme';
import type { InterruptOption, PendingInterrupt } from '../types';

const METHOD_LABELS: Record<string, string> = {
  winsorize: 'Винсоризация',
  trim: 'Отбросить выбросы',
  cap: 'Обрезать по границам',
  log_transform: 'Логарифмировать',
  none: 'Ничего не делать',
};

function share(option: InterruptOption): string {
  return `${(option.share_affected * 100).toFixed(1)}% строк (${option.n_affected})`;
}

/**
 * Вопрос агента, на котором граф встал (HITL). Пока карточка на экране,
 * анализ физически приостановлен — ответ возобновляет его с того же места.
 */
export function InterruptCard({ interrupt }: { interrupt: PendingInterrupt }) {
  const { c, s, answerInterrupt } = useStore();
  const [busy, setBusy] = useState(false);

  const options = interrupt.options ?? [];
  const recommended = interrupt.recommendation;

  const choose = async (option: InterruptOption) => {
    setBusy(true);
    try {
      await answerInterrupt({ method: option.method, params: option.params ?? {} });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${c.accent}55`,
        background: c.accentSoft,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Как обработать выбросы?</div>
        <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
          В колонке <span style={{ fontFamily: MONO }}>{interrupt.metric_col}</span> выбросов{' '}
          {((interrupt.outlier_share ?? 0) * 100).toFixed(1)}%. Выбор влияет на результат теста,
          поэтому решение за вами.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((option) => {
          const isRecommended = option.method === recommended;
          return (
            <button
              key={option.method}
              onClick={() => void choose(option)}
              disabled={busy}
              style={{
                ...s.secondaryButton,
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                borderColor: isRecommended ? c.accent : undefined,
                opacity: busy ? 0.6 : 1,
              }}
            >
              <span style={{ fontWeight: isRecommended ? 600 : 400 }}>
                {METHOD_LABELS[option.method] ?? option.method}
                {isRecommended && (
                  <span style={{ color: c.accent, fontSize: 12, marginLeft: 8 }}>рекомендуем</span>
                )}
              </span>
              <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: MONO }}>
                {share(option)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
