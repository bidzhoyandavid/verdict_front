import { useState } from 'react';
import { useStore } from '../storeContext';
import { ChartPanel } from './ChartPanel';
import { MONO } from '../theme';
import { useDict } from '../lib/lang';
import { interruptDict } from './InterruptCard.dict';
import type { InterruptDict } from './InterruptCard.dict';
import type {
  InterruptOption,
  MethodRobustness,
  MetricCandidate,
  NullStats,
  PolicyMetric,
  OutlierComparisonRow,
  OutlierDiagnostics,
  PendingInterrupt,
  SegmentCandidate,
  SrmAllocationRow,
  SrmSegmentResult,
  ExposureCandidate,
  UnitCandidate,
} from '../types';

const COMPARISON_STATS: { key: string; label?: string }[] = [
  { key: 'n', label: 'n' },
  { key: 'mean' },
  { key: 'median' },
  { key: 'std', label: 'std' },
  { key: 'p95', label: 'p95' },
  { key: 'p99', label: 'p99' },
  { key: 'max', label: 'max' },
];

/** Вопросы-решения: «затронутых строк» у их вариантов нет. */
const DECISION_KINDS = new Set([
  'srm_gate',
  'srm_design',
  'srm_exposure',
  'srm_unit',
  'srm_split',
  'group_comparisons',
  'group_column',
  'heterogeneity_gate',
  'heterogeneity_mode',
]);

function affected(option: InterruptOption, t: InterruptDict): string {
  if (option.share_affected !== undefined) {
    return t.rowsAffected((option.share_affected * 100).toFixed(1), option.n_affected);
  }
  return option.n_affected ? t.rowsCount(option.n_affected) : '—';
}

/** Пропуски по колонкам и по группам — на этих числах строится решение. */
function NullStatsTable({ stats }: { stats: NullStats }) {
  const t = useDict(interruptDict);
  const { c } = useStore();
  const rows = stats.per_column.filter((row) => row.n_null > 0);

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>{t.totalRows}: {stats.n_rows}</div>
      {rows.map((row) => (
        <div key={row.column}>
          <span style={{ fontFamily: MONO }}>{row.column}</span>
          {row.role === 'key' && t.keyColumn}: {t.nullsIn(row.n_null)} (
          {(row.share * 100).toFixed(2)}%)
        </div>
      ))}
      {stats.metric_by_group.length > 0 && (
        <div>
          {t.byGroup}{' '}
          {stats.metric_by_group
            .map((g) => t.groupNulls(g.group, g.n_null, g.n_rows, (g.share * 100).toFixed(2)))
            .join('; ')}
        </div>
      )}
    </div>
  );
}

/** Фактическое распределение по группам против ожидаемого — главный аргумент
 *  в разговоре про SRM: сначала числа, потом p-value. */
function SrmAllocationTable({ rows, unitCol }: { rows: SrmAllocationRow[]; unitCol?: string | null }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
        <thead>
          <tr style={{ color: c.textSecondary, textAlign: 'left' }}>
            <th style={{ padding: '4px 8px 4px 0' }}>{t.group}</th>
            <th style={{ padding: '4px 8px' }}>{unitCol ? t.uniqueOf(unitCol) : t.rows}</th>
            <th style={{ padding: '4px 8px' }}>{t.share}</th>
            <th style={{ padding: '4px 8px' }}>{t.expected}</th>
            <th style={{ padding: '4px 8px' }}>{t.deviation}</th>
          </tr>
        </thead>
        <tbody style={{ fontFamily: MONO }}>
          {rows.map((row) => (
            <tr key={row.group}>
              <td style={{ padding: '4px 8px 4px 0' }}>{row.group}</td>
              <td style={{ padding: '4px 8px' }}>{row.observed}</td>
              <td style={{ padding: '4px 8px' }}>{(row.observed_share * 100).toFixed(2)}%</td>
              <td style={{ padding: '4px 8px' }}>
                {row.expected} ({(row.expected_share * 100).toFixed(2)}%)
              </td>
              <td style={{ padding: '4px 8px', color: c.error }}>
                {row.diff > 0 ? '+' : ''}
                {row.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function num(value: number | null | undefined, digits = 4): string {
  return typeof value === 'number' ? Number(value.toPrecision(digits)).toString() : '—';
}

/** Что агент увидел в данных до выбора обработки: рекомендация без этих чисел —
 *  просто мнение. */
function OutlierDiagnosticsBlock({ diag }: { diag: OutlierDiagnostics }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: MONO }}>
        {t.profileHead(diag.n, num(diag.median), num(diag.mean), num(diag.max))}
      </div>
      <div style={{ fontFamily: MONO }}>
        {t.profileMoments(num(diag.skewness, 3), num(diag.kurtosis, 3))}{' '}
        {(diag.outlier_share * 100).toFixed(2)}% ({diag.n_outliers})
      </div>
      {diag.top1_share_of_sum !== null && (
        <div>{t.top1Share((diag.top1_share_of_sum * 100).toFixed(1))}</div>
      )}
      {diag.negative_share > 0 && (
        <div>
          {t.negativeShare((diag.negative_share * 100).toFixed(1))}
        </div>
      )}
      <div style={{ fontFamily: MONO }}>
        p1 {num(diag.quantiles['0.01'])} · p50 {num(diag.quantiles['0.5'])} · p99{' '}
        {num(diag.quantiles['0.99'])}
      </div>
    </div>
  );
}

/** Свои квантили: пресеты — удобство, а не ограничение, бэкенд принимает любую пару. */
function CustomWinsorize({ onApply, busy }: { onApply: (lower: number, upper: number) => void; busy: boolean }) {
  const t = useDict(interruptDict);
  const { c, s } = useStore();
  const [lower, setLower] = useState('1');
  const [upper, setUpper] = useState('99');

  const lowerNum = Number(lower);
  const upperNum = Number(upper);
  const valid =
    Number.isFinite(lowerNum) &&
    Number.isFinite(upperNum) &&
    lowerNum >= 0 &&
    upperNum <= 100 &&
    lowerNum < upperNum;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: c.textSecondary }}>
      <span>{t.ownQuantiles}</span>
      <input
        value={lower}
        onChange={(e) => setLower(e.target.value)}
        style={{ ...s.chatInput, width: 64, padding: '4px 8px', fontFamily: MONO }}
      />
      <span>–</span>
      <input
        value={upper}
        onChange={(e) => setUpper(e.target.value)}
        style={{ ...s.chatInput, width: 64, padding: '4px 8px', fontFamily: MONO }}
      />
      <button
        onClick={() => onApply(lowerNum / 100, upperNum / 100)}
        disabled={busy || !valid}
        style={{ ...s.secondaryButton, padding: '4px 12px', opacity: busy || !valid ? 0.5 : 1 }}
      >
        {t.apply}
      </button>
    </div>
  );
}

/** Что обработка сделала с метрикой: до, после и относительное изменение. */
function ComparisonTable({ rows }: { rows: OutlierComparisonRow[] }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
        <thead>
          <tr style={{ color: c.textSecondary, textAlign: 'left' }}>
            <th style={{ padding: '4px 8px 4px 0' }}>{t.group}</th>
            {COMPARISON_STATS.map((stat) => (
              <th key={stat.key} style={{ padding: '4px 8px' }}>
                {stat.label ?? t.aggregates[stat.key as 'mean' | 'median']}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ fontFamily: MONO }}>
          {rows.map((row) => (
            <tr key={row.group} style={{ borderTop: `1px solid ${c.border}` }}>
              <td style={{ padding: '4px 8px 4px 0' }}>{row.group}</td>
              {COMPARISON_STATS.map((stat) => {
                const delta = row.delta[stat.key];
                return (
                  <td key={stat.key} style={{ padding: '4px 8px' }}>
                    <div>
                      {num(row.before[stat.key])} → {num(row.after[stat.key])}
                    </div>
                    {typeof delta === 'number' && delta !== 0 && (
                      <div style={{ color: c.textSecondary }}>
                        {delta > 0 ? '+' : ''}
                        {(delta * 100).toFixed(1)}%
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Подтверждение обработки выбросов: сначала показываем разницу, потом
 *  спрашиваем согласие. Отказ возвращает к выбору варианта. */
function OutlierConfirmCard({ interrupt }: { interrupt: PendingInterrupt }) {
  const t = useDict(interruptDict);
  const { c, s, answerInterrupt } = useStore();
  const [busy, setBusy] = useState(false);

  const answer = async (agreed: boolean) => {
    setBusy(true);
    try {
      await answerInterrupt({ agreed });
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
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.confirmOutliers}</div>
        <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
          {interrupt.report?.interpretation ??
            t.appliedCompare(interrupt.decision?.method ?? '')}
        </div>
      </div>

      {interrupt.comparison && <ComparisonTable rows={interrupt.comparison} />}
      {interrupt.charts && interrupt.charts.length > 0 && <ChartPanel charts={interrupt.charts} />}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => void answer(true)}
          disabled={busy}
          style={{ ...s.primaryButton, opacity: busy ? 0.6 : 1 }}
        >
          {t.yesContinue}
        </button>
        <button
          onClick={() => void answer(false)}
          disabled={busy}
          style={{ ...s.secondaryButton, opacity: busy ? 0.6 : 1 }}
        >
          {t.noPickAnother}
        </button>
      </div>
    </div>
  );
}

/** Выбор срезов для проверки SRM. Кандидаты найдены агентом в самих данных,
 *  поэтому рядом с колонкой видно, на что она реально бьётся. */
function SegmentPicker({
  candidates,
  primaryLabel,
  fallbackLabel,
}: {
  candidates: SegmentCandidate[];
  primaryLabel?: string;
  fallbackLabel?: string;
}) {
  const t = useDict(interruptDict);
  const { c, s, answerInterrupt } = useStore();
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const toggle = (column: string) =>
    setChosen((prev) => (prev.includes(column) ? prev.filter((x) => x !== column) : [...prev, column]));

  const send = async (segments: string[]) => {
    setBusy(true);
    try {
      await answerInterrupt({ segments });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {candidates.map((candidate) => (
          <label
            key={candidate.column}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              border: `1px solid ${chosen.includes(candidate.column) ? c.accent : c.border}`,
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={chosen.includes(candidate.column)}
              onChange={() => toggle(candidate.column)}
              disabled={busy}
              style={{ marginTop: 3 }}
            />
            <span style={{ minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 13 }}>{candidate.column}</span>
              <span style={{ fontSize: 12, color: c.textSecondary }}>{t.nLevels(candidate.n_levels)}</span>
              <div style={{ fontSize: 12, color: c.textSecondary }}>
                {candidate.levels
                  .slice(0, 5)
                  .map((level) => `${level.level} — ${(level.share * 100).toFixed(0)}%`)
                  .join(', ')}
                {candidate.levels.length > 5 && ' …'}
              </div>
            </span>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => void send(chosen)}
          disabled={busy || chosen.length === 0}
          style={{ ...s.primaryButton, opacity: busy || chosen.length === 0 ? 0.5 : 1 }}
        >
          {primaryLabel ?? t.checkSelected}
        </button>
        <button
          onClick={() => void send([])}
          disabled={busy}
          style={{ ...s.secondaryButton, opacity: busy ? 0.6 : 1 }}
        >
          {fallbackLabel ?? t.overallSplitOnly}
        </button>
      </div>
    </>
  );
}

/** Результат калибровки — то единственное число, из-за которого предложенный
 * критерий именно такой. Показывается отдельно от прозы: спорить с выбором
 * имеет смысл, глядя на него.
 */
function CalibrationLine({ robustness }: { robustness: MethodRobustness }) {
  const t = useDict(interruptDict);
  const { c } = useStore();
  const off = !robustness.clt_ok;

  return (
    <div
      style={{
        fontSize: 12,
        color: off ? c.error : c.textSecondary,
        border: `1px solid ${off ? `${c.error}55` : c.border}`,
        borderRadius: 8,
        padding: '6px 10px',
      }}
    >
      {t.falsePositives((robustness.fpr * 100).toFixed(1), (robustness.alpha * 100).toFixed(0))}
      {' '}({t.interval}{' '}
      {(robustness.fpr_ci[0] * 100).toFixed(1)}–{(robustness.fpr_ci[1] * 100).toFixed(1)}%)
      {robustness.conservative && t.conservative}
    </div>
  );
}

/** Метрики, на которые распространится общий выбор обработки.
 *
 * Рядом с каждой — что агент предложил бы по ней одной: решение «одинаково или
 * по-разному» принимается по тому, насколько эти рекомендации и формы
 * расходятся, а не по числу строк в таблице.
 */
function PolicyMetricsTable({ metrics }: { metrics: PolicyMetric[] }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {metrics.map((metric) => (
        <div key={metric.id} style={{ fontSize: 12, color: c.textSecondary }}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: c.textPrimary }}>{metric.column}</span>
          {' · '}
          {t.skewOutliers(metric.diagnostics.skewness.toFixed(1), '')}{' '}
          {(metric.diagnostics.outlier_share * 100).toFixed(1)}%
          {metric.diagnostics.zero_share > 0.1 &&
            t.zeros((metric.diagnostics.zero_share * 100).toFixed(0))}
          {' → '}
          {t.methodLabels[metric.recommended] ?? metric.recommended}
        </div>
      ))}
    </div>
  );
}

/** Выбор главных метрик.
 *
 * Отдельный компонент, а не `SegmentPicker` с другими подписями: там выбирают
 * срезы и показывают их уровни, здесь — метрики и форму их распределения. Одна
 * галочка на строку в обоих случаях, но смотрит аналитик на разное.
 */
function MetricPicker({ metrics, recommended }: { metrics: MetricCandidate[]; recommended?: string }) {
  const t = useDict(interruptDict);
  const { c, s, answerInterrupt } = useStore();
  const [chosen, setChosen] = useState<string[]>(() =>
    metrics.filter((m) => m.is_primary_guess).map((m) => m.id),
  );
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setChosen((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const send = async (ids: string[]) => {
    setBusy(true);
    try {
      await answerInterrupt({ metrics: ids });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {metrics.map((metric) => (
          <label
            key={metric.id}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              border: `1px solid ${chosen.includes(metric.id) ? c.accent : c.border}`,
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={chosen.includes(metric.id)}
              onChange={() => toggle(metric.id)}
              disabled={busy}
              style={{ marginTop: 3 }}
            />
            <span style={{ minWidth: 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 13 }}>{metric.column}</span>
              {metric.column === recommended && (
                <span style={{ fontSize: 12, color: c.accent }}>{t.recommended}</span>
              )}
              {metric.summary && (
                <div style={{ fontSize: 12, color: c.textSecondary }}>{metric.summary}</div>
              )}
            </span>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => void send(chosen)}
          disabled={busy || chosen.length === 0}
          style={{ ...s.primaryButton, opacity: busy || chosen.length === 0 ? 0.5 : 1 }}
        >
          {t.reviewSelected}
        </button>
        <button
          onClick={() => void send(metrics.map((m) => m.id))}
          disabled={busy}
          style={{ ...s.secondaryButton, opacity: busy ? 0.6 : 1 }}
        >
          {t.allPrimary}
        </button>
      </div>
    </>
  );
}

/** Результат SRM внутри срезов: где перекос есть и на каких значениях. */
function SegmentResults({ segments }: { segments: SrmSegmentResult[] }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {segments.map((segment) => (
        <div key={segment.column}>
          <span style={{ fontFamily: MONO }}>{segment.column}</span> ({t.segmentTested(segment.n_levels_tested)}
          alpha {segment.alpha.toPrecision(2)}):{' '}
          {segment.failed_levels.length > 0 ? (
            <span style={{ color: c.error }}>{t.skewIn(segment.failed_levels.join(', '))}</span>
          ) : (
            t.noSkew
          )}
        </div>
      ))}
    </div>
  );
}

/** Колонки-кандидаты на единицу рандомизации: сколько уникальных значений и
 *  сколько строк на значение — по этим двум числам выбор и делается. */
function UnitCandidates({ candidates }: { candidates: UnitCandidate[] }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {candidates.map((candidate) => (
        <div key={candidate.column}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: c.textPrimary }}>{candidate.column}</span>
          {' — '}
          {t.uniqueValues(candidate.n_unique)}
          {candidate.one_row_per_value
            ? t.oneRowPerValue
            : t.rowsPerValue(String(candidate.rows_per_unit))}
          {candidate.null_share > 0 && t.nullShare((candidate.null_share * 100).toFixed(1))}
        </div>
      ))}
    </div>
  );
}

/** Кандидаты в экспозицию: суммы по веткам — то, что и будет сравниваться. */
function ExposureCandidates({ candidates }: { candidates: ExposureCandidate[] }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {candidates.map((candidate) => (
        <div key={candidate.column}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: c.textPrimary }}>{candidate.column}</span>
          {' — '}
          {Object.entries(candidate.totals_by_group)
            .map(([group, total]) => `${group}: ${total.toLocaleString('ru-RU')}`)
            .join(', ')}
          {candidate.null_share > 0 && t.nullShare((candidate.null_share * 100).toFixed(1))}
        </div>
      ))}
    </div>
  );
}

/** Своя колонка экспозиции: эвристика предлагает не всё, что годится. */
function CustomExposure({ columns, busy }: { columns: string[]; busy: boolean }) {
  const t = useDict(interruptDict);
  const { c, s, answerInterrupt } = useStore();
  const [column, setColumn] = useState(columns[0] ?? '');
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await answerInterrupt({ method: 'exposure', params: { column } });
    } finally {
      setSending(false);
    }
  };

  const disabled = busy || sending || !column;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, color: c.textSecondary }}>
        {t.columnNotListed}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Список колонок приходит не всегда (пауза могла быть создана раньше),
            поэтому без него — ввод имени руками. */}
        {columns.length > 0 ? (
          <select
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            disabled={disabled}
            style={{ ...s.input, width: 'auto', flex: 1, fontFamily: MONO, fontSize: 13 }}
          >
            {columns.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            placeholder={t.columnNamePlaceholder}
            disabled={busy || sending}
            style={{ ...s.input, flex: 1, fontFamily: MONO, fontSize: 13 }}
          />
        )}
        <button
          onClick={() => void send()}
          disabled={disabled}
          style={{ ...s.secondaryButtonSmall, opacity: disabled ? 0.6 : 1 }}
        >
          {t.countByIt}
        </button>
      </div>
    </div>
  );
}

/** Плановые доли вручную: поля на группу, сумма считается на лету. */
function ManualSplit({ groups, initial }: { groups: string[]; initial: Record<string, number> }) {
  const t = useDict(interruptDict);
  const { c, s, answerInterrupt } = useStore();
  const [shares, setShares] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.map((group) => [group, String(initial[group] ?? '')])),
  );
  const [busy, setBusy] = useState(false);

  const parsed = groups.map((group) => Number(shares[group]));
  const valid = parsed.every((value) => Number.isFinite(value) && value > 0);
  const total = parsed.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);

  const send = async () => {
    setBusy(true);
    try {
      await answerInterrupt({
        method: 'manual',
        params: { split: Object.fromEntries(groups.map((group, i) => [group, parsed[i]])) },
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {groups.map((group) => (
          <label key={group} style={{ fontSize: 12, color: c.textSecondary }}>
            <span style={{ fontFamily: MONO }}>{group}</span>
            <input
              type="number"
              min={0}
              value={shares[group]}
              onChange={(e) => setShares((prev) => ({ ...prev, [group]: e.target.value }))}
              disabled={busy}
              style={{
                width: 72,
                marginLeft: 6,
                padding: '4px 6px',
                borderRadius: 6,
                border: `1px solid ${c.border}`,
                background: c.bg,
                color: c.textPrimary,
              }}
            />
          </label>
        ))}
      </div>
      <div style={{ fontSize: 12, color: c.textSecondary }}>
        {t.splitSumHint(String(total || 0))}
      </div>
      <button
        onClick={() => void send()}
        disabled={busy || !valid}
        style={{ ...s.secondaryButton, opacity: busy || !valid ? 0.6 : 1 }}
      >
        {t.setPlannedSplit}
      </button>
    </div>
  );
}

/** Уровень значимости для SRM и для метрик — раздельно, потому что цена
 *  ложного срабатывания у них разная: SRM должен почти никогда не срабатывать
 *  на здоровом сплите, а значимость метрик — обычный компромисс аналитика. */
function AlphaSetup({ defaults }: { defaults: { srm_alpha: number; metric_alpha: number } }) {
  const t = useDict(interruptDict);
  const { c, s, answerInterrupt } = useStore();
  const [srmAlpha, setSrmAlpha] = useState(String(defaults.srm_alpha));
  const [metricAlpha, setMetricAlpha] = useState(String(defaults.metric_alpha));
  const [busy, setBusy] = useState(false);

  const srmNum = Number(srmAlpha);
  const metricNum = Number(metricAlpha);
  const valid =
    Number.isFinite(srmNum) && srmNum > 0 && srmNum < 1 && Number.isFinite(metricNum) && metricNum > 0 && metricNum < 1;

  const send = async (srm_alpha: number, metric_alpha: number) => {
    setBusy(true);
    try {
      await answerInterrupt({ method: 'custom', params: { srm_alpha, metric_alpha } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={() => void send(defaults.srm_alpha, defaults.metric_alpha)}
        disabled={busy}
        style={{ ...s.primaryButton, opacity: busy ? 0.6 : 1 }}
      >
        {t.alphaDefaults(String(defaults.srm_alpha), String(defaults.metric_alpha))}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: c.textSecondary }}>
        <span>{t.alphaSrm}</span>
        <input
          value={srmAlpha}
          onChange={(e) => setSrmAlpha(e.target.value)}
          disabled={busy}
          style={{ ...s.chatInput, width: 80, padding: '4px 8px', fontFamily: MONO }}
        />
        <span>{t.alphaMetrics}</span>
        <input
          value={metricAlpha}
          onChange={(e) => setMetricAlpha(e.target.value)}
          disabled={busy}
          style={{ ...s.chatInput, width: 80, padding: '4px 8px', fontFamily: MONO }}
        />
        <button
          onClick={() => void send(srmNum, metricNum)}
          disabled={busy || !valid}
          style={{ ...s.secondaryButton, padding: '4px 12px', opacity: busy || !valid ? 0.5 : 1 }}
        >
          {t.applyOwn}
        </button>
      </div>
    </div>
  );
}

/** Размеры веток перед выбором схемы сравнения. */
function GroupSizes({ sizes, suggested }: { sizes: Record<string, number>; suggested?: string | null }) {
  const t = useDict(interruptDict);
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {Object.entries(sizes).map(([group, n]) => (
        <span key={group}>
          <span style={{ fontFamily: MONO, color: c.textPrimary }}>{group}</span> — {n}
          {group === suggested && t.looksLikeControl}
        </span>
      ))}
    </div>
  );
}

/**
 * Вопрос агента, на котором граф встал (HITL). Пока карточка на экране,
 * анализ физически приостановлен — ответ возобновляет его с того же места.
 */

/**
 * Идентичность варианта.
 *
 * `method` — это семейство обработки, а не сам вариант: бэкенд шлёт несколько
 * винсоризаций с разными квантилями, а кандидатов в колонку групп — по одному
 * на колонку, и у всех `method: 'column'`. Ключом по `method` React склеивал
 * такие кнопки в одну.
 */
function optionId(option: InterruptOption): string {
  const params = option.params ?? {};
  // Ключи сортируем: порядок полей в JSON от бэкенда не гарантирован, а id
  // должен быть стабильным между рендерами.
  const shape = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify((params as Record<string, unknown>)[k])}`)
    .join(',');
  return shape ? `${option.method}|${shape}` : option.method;
}

/**
 * Какой именно вариант рекомендован.
 *
 * `recommendation` называет семейство, поэтому внутри него нужен второй
 * признак. Для выбора колонки и единицы его даёт `suggested_column`; там, где
 * бэкенд его не присылает (пресеты винсоризации), берём первый вариант
 * семейства — они упорядочены от мягкого к агрессивному.
 */
function recommendedOptionId(interrupt: PendingInterrupt): string | null {
  const family = interrupt.recommendation;
  if (!family) return null;

  const candidates = (interrupt.options ?? []).filter((o) => o.method === family);
  if (candidates.length === 0) return null;

  const suggested = interrupt.suggested_column;
  if (suggested) {
    const exact = candidates.find(
      (o) => (o.params as Record<string, unknown> | undefined)?.column === suggested,
    );
    if (exact) return optionId(exact);
  }
  return optionId(candidates[0]);
}
export function InterruptCard({ interrupt }: { interrupt: PendingInterrupt }) {
  const t = useDict(interruptDict);
  const { c, s, answerInterrupt } = useStore();
  const [busy, setBusy] = useState(false);

  if (interrupt.kind === 'outlier_confirm') return <OutlierConfirmCard interrupt={interrupt} />;

  const options = interrupt.options ?? [];
  const recommendedId = recommendedOptionId(interrupt);
  const isNullReview = interrupt.kind === 'null_review';
  const isSrmGate = interrupt.kind === 'srm_gate';
  const isSegmentPicker = interrupt.kind === 'srm_segments';
  const isOutlierReview = interrupt.kind === 'outlier_review';
  const isUnitPicker = interrupt.kind === 'srm_unit';
  const isDesignPicker = interrupt.kind === 'srm_design';
  const isExposurePicker = interrupt.kind === 'srm_exposure';
  const isSplitPicker = interrupt.kind === 'srm_split';
  const isComparisonPicker = interrupt.kind === 'group_comparisons';
  const isGroupColumnPicker = interrupt.kind === 'group_column';
  const isHeterogeneityGate = interrupt.kind === 'heterogeneity_gate';
  const isHeterogeneityFields = interrupt.kind === 'heterogeneity_fields';
  const isHeterogeneityMode = interrupt.kind === 'heterogeneity_mode';
  const isAlphaSetup = interrupt.kind === 'alpha_setup';
  const isMetricPicker = interrupt.kind === 'primary_metrics';
  const isOutlierPolicy = interrupt.kind === 'outlier_policy';
  const isMethodChoice = interrupt.kind === 'test_method';
  // У этих вопросов ответ — это решение аналитика, а не обработка строк, и
  // объяснение уже написано агентом в интерпретации шага.
  const usesReportText =
    isSegmentPicker ||
    isSrmGate ||
    isNullReview ||
    isUnitPicker ||
    isDesignPicker ||
    isExposurePicker ||
    isSplitPicker ||
    isComparisonPicker ||
    isGroupColumnPicker ||
    isHeterogeneityGate ||
    isHeterogeneityFields ||
    isHeterogeneityMode ||
    isAlphaSetup ||
    isMetricPicker ||
    isOutlierPolicy ||
    isMethodChoice;

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
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {t.titles[interrupt.kind] ?? t.titles.outlier_review}
        </div>
        <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
          {usesReportText ? (
            interrupt.report?.interpretation ??
            t.nullsIntro
          ) : (
            <>
              {t.outliersIntro(
                interrupt.metric_col ?? '',
                ((interrupt.outlier_share ?? 0) * 100).toFixed(1),
              )}
            </>
          )}
        </div>
      </div>

      {isNullReview && interrupt.stats && <NullStatsTable stats={interrupt.stats} />}

      {isOutlierReview && interrupt.diagnostics && (
        <OutlierDiagnosticsBlock diag={interrupt.diagnostics} />
      )}

      {isOutlierReview && interrupt.rejected && interrupt.rejected.length > 0 && (
        <div style={{ fontSize: 12, color: c.textSecondary }}>
          {t.alreadyRejected(
            interrupt.rejected.map((r) => t.methodLabels[r.method] ?? r.method).join(', '),
          )}
        </div>
      )}

      {isSegmentPicker && interrupt.candidates && <SegmentPicker candidates={interrupt.candidates} />}

      {isMethodChoice && interrupt.robustness && (
        <CalibrationLine robustness={interrupt.robustness} />
      )}

      {isOutlierPolicy && interrupt.policy_metrics && (
        <PolicyMetricsTable metrics={interrupt.policy_metrics} />
      )}

      {isMetricPicker && interrupt.metrics && (
        <MetricPicker
          metrics={interrupt.metrics}
          recommended={interrupt.recommendation ?? undefined}
        />
      )}

      {isHeterogeneityFields && interrupt.candidates && (
        <SegmentPicker
          candidates={interrupt.candidates}
          primaryLabel={t.countSelected}
          fallbackLabel={t.cancelOverallOnly}
        />
      )}

      {isUnitPicker && interrupt.unit_candidates && (
        <UnitCandidates candidates={interrupt.unit_candidates} />
      )}

      {isExposurePicker && interrupt.exposure_candidates && (
        <ExposureCandidates candidates={interrupt.exposure_candidates} />
      )}

      {isComparisonPicker && interrupt.group_sizes && (
        <GroupSizes sizes={interrupt.group_sizes} suggested={interrupt.suggested_control} />
      )}

      {isSrmGate && interrupt.segments && interrupt.segments.length > 0 && (
        <SegmentResults segments={interrupt.segments} />
      )}

      {isSrmGate && interrupt.allocation && (
        <SrmAllocationTable rows={interrupt.allocation} unitCol={interrupt.unit_col} />
      )}

      {isSrmGate && interrupt.causes && interrupt.causes.length > 0 && (
        <div style={{ fontSize: 12, color: c.textSecondary }}>
          {t.typicalCauses(interrupt.causes.join('; '))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* «Ввести вручную» — не кнопка, а форма ниже: пустой params бэкенд
            честно отвергнет и вернётся к равным долям. */}
        {(isSegmentPicker || isHeterogeneityFields || isAlphaSetup
          ? []
          : options.filter((o) => !(isSplitPicker && o.method === 'manual'))
        ).map((option) => {
          const isRecommended = optionId(option) === recommendedId;
          return (
            <button
              key={optionId(option)}
              onClick={() => void choose(option)}
              disabled={busy}
              style={{
                ...s.secondaryButton,
                width: '100%',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 4,
                borderColor: isRecommended ? c.accent : undefined,
                opacity: busy ? 0.6 : 1,
              }}
            >
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontWeight: isRecommended ? 600 : 400 }}>
                  {option.label ?? t.methodLabels[option.method] ?? option.method}
                  {isRecommended && (
                    <span style={{ color: c.accent, fontSize: 12, marginLeft: 8 }}>{t.recommendShort}</span>
                  )}
                </span>
                {/* У SRM-вариантов «затронутых строк» нет — это решение,
                    а не обработка данных. */}
                {!DECISION_KINDS.has(interrupt.kind) && (
                  <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: MONO }}>
                    {affected(option, t)}
                  </span>
                )}
              </span>
              {option.note && (
                <span style={{ fontSize: 12, color: c.textSecondary, textAlign: 'left' }}>
                  {option.note}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isSplitPicker && interrupt.groups && (
        <ManualSplit groups={interrupt.groups} initial={interrupt.observed_split ?? {}} />
      )}

      {isExposurePicker && <CustomExposure columns={interrupt.numeric_columns ?? []} busy={busy} />}

      {isAlphaSetup && interrupt.defaults && <AlphaSetup defaults={interrupt.defaults} />}

      {isOutlierReview && (
        <CustomWinsorize
          busy={busy}
          onApply={(lowerQ, upperQ) =>
            void choose({ method: 'winsorize', params: { lower_q: lowerQ, upper_q: upperQ }, n_affected: 0 })
          }
        />
      )}
    </div>
  );
}
