import { useStore } from '../storeContext';
import { MONO } from '../theme';
import type { Evidence } from '../types';

function count(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('ru-RU');
}

function percent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const tail = n % 100 >= 11 && n % 100 <= 14 ? 5 : n % 10;
  if (tail === 1) return one;
  if (tail >= 2 && tail <= 4) return few;
  return many;
}

/**
 * «Почему этому можно верить» — блок, которого не было.
 *
 * Прогон делает под сотню проверок, считает интервал, применяет поправку и
 * оценивает достаточность выборки. До отчёта из этого доходили точечный эффект
 * и p-value, и вывод читался как утверждение без доказательств — не потому что
 * доказательств не было, а потому что их не показывали.
 */
export function EvidencePanel({ evidence }: { evidence: Evidence }) {
  const { c } = useStore();
  const { confidence, power, guardrails } = evidence;

  const line: React.CSSProperties = { fontSize: 12, color: c.textSecondary, lineHeight: 1.5 };
  const facts: React.ReactNode[] = [];

  const sample = confidence.sample;
  if (sample && sample.nControl !== null) {
    facts.push(
      <div key="sample" style={line}>
        Объём:{' '}
        <span style={{ fontFamily: MONO }}>
          {count(sample.nControl)} / {count(sample.nTreatment)}
        </span>{' '}
        — «{sample.controlGroup}» против «{sample.treatmentGroup}»
      </div>,
    );
  }

  const effect = evidence.effect;
  if (effect?.estimandLabel && effect.method) {
    facts.push(
      <div key="method" style={line}>
        Сравнивали {effect.estimandLabel}, критерий — {effect.method}
      </div>,
    );
  }

  const checks = confidence.checks;
  if (checks.total > 0) {
    const tail = [
      checks.warning > 0 ? `${checks.warning} с предупреждением` : '',
      checks.failed > 0 ? `${checks.failed} упало` : '',
      checks.skipped > 0 ? `${checks.skipped} неприменимо` : '',
    ].filter(Boolean);
    facts.push(
      <div key="checks" style={line}>
        Проверок пройдено{' '}
        <span style={{ fontFamily: MONO }}>
          {checks.ok} из {checks.total}
        </span>
        {tail.length > 0 && ` (${tail.join(', ')})`}
        {checks.failedNames.length > 0 && (
          <span style={{ color: c.error }}> — упало: {checks.failedNames.join(', ')}</span>
        )}
      </div>,
    );
  }

  const correction = confidence.correction;
  if (correction) {
    facts.push(
      <div key="correction" style={line}>
        Поправка {correction.method} на {correction.tests}{' '}
        {plural(correction.tests, 'тест', 'теста', 'тестов')}: значимых было{' '}
        {correction.significantBefore}, осталось {correction.significantAfter}
        {correction.lost.length > 0 && (
          <>
            {' '}
            — потеряли значимость {correction.lost.join(', ')}
            {correction.lostTotal > correction.lost.length &&
              ` и ещё ${correction.lostTotal - correction.lost.length}`}
          </>
        )}
      </div>,
    );
  }

  if (confidence.srm.override) {
    facts.push(
      <div key="srm" style={{ ...line, color: c.error }}>
        Перекос групп обнаружен — расчёты выполнены поверх него по решению аналитика
      </div>,
    );
  } else if (!confidence.srm.detected) {
    facts.push(
      <div key="srm" style={line}>
        Сплит сошёлся с заявленным — группы сравнимы
      </div>,
    );
  }

  if (power && power.conclusion === 'hold') {
    facts.push(
      <div key="power" style={line}>
        Мощности не хватает: нужно ещё{' '}
        <span style={{ fontFamily: MONO }}>{count(power.extraObservations)}</span> наблюдений
        {power.daysLeft !== null && ` — это ~${Math.ceil(power.daysLeft)} дн. при текущем темпе`}
      </div>,
    );
  } else if (power && power.conclusion === 'no_effect') {
    facts.push(
      <div key="power" style={line}>
        Мощности хватило: наблюдённая разница неотличима от нуля
      </div>,
    );
  }

  const violations = guardrails?.violations ?? [];

  if (facts.length === 0 && violations.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {facts.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>
            Почему этому можно верить:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>{facts}</div>
        </>
      )}

      {/* Просевшая второстепенная метрика — часть решения, а не примечание:
          «раскатывать» при ней означает раскатывать вместе с ней. */}
      {violations.length > 0 && (
        <div
          style={{
            border: `1px solid ${c.warning}66`,
            background: `${c.warning}14`,
            borderRadius: 8,
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: c.warning }}>
            Второстепенные метрики просели:
          </div>
          {violations.map((v) => (
            <div key={`${v.metric}|${v.comparison}`} style={{ ...line, color: c.warning }}>
              {v.label} — <span style={{ fontFamily: MONO }}>{percent(v.relativeDiff)}</span> (
              {v.comparison})
            </div>
          ))}
        </div>
      )}

      {guardrails && violations.length === 0 && guardrails.watched.length > 0 && (
        <div style={line}>
          Второстепенные метрики ({guardrails.watched.length}) значимо не просели
        </div>
      )}
    </div>
  );
}
