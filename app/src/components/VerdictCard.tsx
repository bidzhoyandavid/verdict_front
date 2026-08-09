import { useStore } from '../storeContext';
import type { Verdict } from '../types';

const TONE: Record<string, 'good' | 'bad' | 'neutral'> = {
  winner: 'good',
  loser: 'bad',
  invalid: 'bad',
  no_effect: 'neutral',
  need_more_data: 'neutral',
  inconclusive: 'neutral',
};

/**
 * Итог анализа: вердикт и что с ним делать. Оба поля считаются на бэкенде
 * детерминированно — карточка ничего не выводит сама, чтобы формулировка
 * не расходилась с таблицей.
 */
export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const { c } = useStore();
  const tone = TONE[verdict.code] ?? 'neutral';
  const accent = tone === 'good' ? c.success : tone === 'bad' ? c.error : c.accent;

  return (
    <div
      style={{
        border: `1px solid ${accent}55`,
        background: `${accent}0f`,
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: c.textSecondary }}>
          ВЫВОД
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: accent }}>{verdict.label}</span>
        {verdict.metric && (
          <span style={{ fontSize: 12, color: c.textSecondary }}>
            по метрике {verdict.metric}
            {verdict.relativeDiff !== null &&
              `: ${verdict.relativeDiff >= 0 ? '+' : ''}${(verdict.relativeDiff * 100).toFixed(2)}%`}
          </span>
        )}
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600 }}>Рекомендация: </span>
        {verdict.action}
      </div>

      {verdict.blockingChecks.length > 0 && (
        <div style={{ fontSize: 13, color: c.error }}>
          Не пройдены обязательные проверки: {verdict.blockingChecks.join(', ')}
        </div>
      )}

      {verdict.caveats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>Что ослабляет вывод:</div>
          {verdict.caveats.map((caveat) => (
            <div key={caveat} style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.45 }}>
              • {caveat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
