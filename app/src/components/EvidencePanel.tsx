import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { resultsDict } from './results.dict';
import { MONO } from '../theme';
import type { Evidence } from '../types';

function count(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('ru-RU');
}

function percent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
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
  const t = useDict(resultsDict);
  const { confidence, power, guardrails } = evidence;

  const line: React.CSSProperties = { fontSize: 12, color: c.textSecondary, lineHeight: 1.5 };
  const facts: React.ReactNode[] = [];

  const sample = confidence.sample;
  if (sample && sample.nControl !== null) {
    facts.push(
      <div key="sample" style={line}>
        {t.sample}{' '}
        <span style={{ fontFamily: MONO }}>
          {count(sample.nControl)} / {count(sample.nTreatment)}
        </span>{' '}
        {t.versus(sample.controlGroup ?? '', sample.treatmentGroup ?? '')}
      </div>,
    );
  }

  const effect = evidence.effect;
  if (effect?.estimandLabel && effect.method) {
    facts.push(
      <div key="method" style={line}>
        {t.compared(effect.estimandLabel, effect.method)}
      </div>,
    );
  }

  const checks = confidence.checks;
  if (checks.total > 0) {
    const tail = [
      checks.warning > 0 ? t.checksWithWarning(checks.warning) : '',
      checks.failed > 0 ? t.checksFailed(checks.failed) : '',
      checks.skipped > 0 ? t.checksSkipped(checks.skipped) : '',
    ].filter(Boolean);
    facts.push(
      <div key="checks" style={line}>
        {t.checksPassed}{' '}
        <span style={{ fontFamily: MONO }}>{t.outOf(checks.ok, checks.total)}</span>
        {tail.length > 0 && ` (${tail.join(', ')})`}
        {checks.failedNames.length > 0 && (
          <span style={{ color: c.error }}>{t.failedNames(checks.failedNames.join(', '))}</span>
        )}
      </div>,
    );
  }

  const correction = confidence.correction;
  if (correction) {
    facts.push(
      <div key="correction" style={line}>
        {t.correction(correction.method, correction.tests)}{' '}
        {t.significantBeforeAfter(correction.significantBefore, correction.significantAfter)}
        {correction.lost.length > 0 && (
          <>
            {t.lostSignificance(correction.lost.join(', '))}
            {correction.lostTotal > correction.lost.length &&
              t.andMore(correction.lostTotal - correction.lost.length)}
          </>
        )}
      </div>,
    );
  }

  if (confidence.srm.override) {
    facts.push(
      <div key="srm" style={{ ...line, color: c.error }}>
        {t.srmOverride}
      </div>,
    );
  } else if (!confidence.srm.detected) {
    facts.push(
      <div key="srm" style={line}>
        {t.srmClean}
      </div>,
    );
  }

  if (power && power.conclusion === 'hold') {
    facts.push(
      <div key="power" style={line}>
        {t.needMorePower}{' '}
        <span style={{ fontFamily: MONO }}>{count(power.extraObservations)}</span>{' '}
        {t.observations}
        {power.daysLeft !== null && t.daysLeft(Math.ceil(power.daysLeft))}
      </div>,
    );
  } else if (power && power.conclusion === 'no_effect') {
    facts.push(
      <div key="power" style={line}>
        {t.powerEnough}
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
            {t.whyTrust}
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
            {t.guardrailsDown}
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
          {t.guardrailsOk(guardrails.watched.length)}
        </div>
      )}
    </div>
  );
}
