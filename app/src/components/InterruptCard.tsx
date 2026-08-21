import { useState } from 'react';
import { useStore } from '../storeContext';
import { ChartPanel } from './ChartPanel';
import { MONO } from '../theme';
import type {
  InterruptOption,
  NullStats,
  OutlierComparisonRow,
  OutlierDiagnostics,
  PendingInterrupt,
  SegmentCandidate,
  SrmAllocationRow,
  SrmSegmentResult,
  ExposureCandidate,
  UnitCandidate,
} from '../types';

const COMPARISON_STATS: { key: string; label: string }[] = [
  { key: 'n', label: 'n' },
  { key: 'mean', label: 'среднее' },
  { key: 'median', label: 'медиана' },
  { key: 'std', label: 'std' },
  { key: 'p95', label: 'p95' },
  { key: 'p99', label: 'p99' },
  { key: 'max', label: 'max' },
];

export const METHOD_LABELS: Record<string, string> = {
  winsorize: 'Винсоризация',
  trim: 'Отбросить выбросы',
  cap: 'Обрезать по границам',
  log_transform: 'Логарифмировать',
  log_winsorize: 'Лог + винсоризация',
  none: 'Ничего не делать',
  drop: 'Удалить строки с пропусками',
  stop: 'Остановить расчёты',
  continue: 'Продолжить, понимая риск',
  keep: 'Оставить как есть',
  fill_zero: 'Заполнить нулём',
  impute_median: 'Импутировать медианой',
  impute_mean: 'Импутировать средним',
  // SRM-решения: подписи нужны истории чата, у живых кнопок свой label.
  exposure: 'Считать экспозицию',
  rows: 'Считать строки',
  unit: 'Обычный A/B',
  switchback: 'Свитчбэк',
  equal: 'Равные доли',
  manual: 'Свои доли',
  declared: 'Как в данных',
  config: 'Как задано в брифе',
  column: 'Выбрана колонка',
  defaults: 'Значения по умолчанию',
  custom: 'Свои значения',
  vs_control: 'Каждая против контроля',
  all_pairs: 'Каждая с каждой',
  omnibus: 'Один тест по всем веткам',
  yes: 'Да, посчитать по сегментам',
  no: 'Нет, только в целом',
  separate: 'По отдельности',
  cross: 'По пересечению',
};

/** Заголовок карточки по типу вопроса. */
export const INTERRUPT_TITLES: Record<string, string> = {
  group_column: 'Какая колонка делит на ветки эксперимента?',
  srm_design: 'Какой это тип эксперимента?',
  srm_exposure: 'Чем измеряется экспозиция?',
  srm_unit: 'Что здесь единица рандомизации?',
  srm_split: 'Каким должно было быть распределение по группам?',
  srm_segments: 'По каким сегментам проверить SRM?',
  srm_gate: 'Обнаружен SRM — продолжать расчёты?',
  group_comparisons: 'Что с чем сравниваем?',
  null_review: 'Что делать с пропусками?',
  heterogeneity_gate: 'Считать эффект отдельно по сегментам?',
  heterogeneity_fields: 'По каким полям?',
  heterogeneity_mode: 'Пересечение сегментов или по отдельности?',
  alpha_setup: 'Какой уровень значимости использовать?',
  outlier_review: 'Как обработать выбросы?',
  outlier_confirm: 'Согласны с обработкой выбросов?',
};

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

function affected(option: InterruptOption): string {
  if (option.share_affected !== undefined) {
    return `${(option.share_affected * 100).toFixed(1)}% строк (${option.n_affected})`;
  }
  return option.n_affected ? `${option.n_affected} строк` : '—';
}

/** Пропуски по колонкам и по группам — на этих числах строится решение. */
function NullStatsTable({ stats }: { stats: NullStats }) {
  const { c } = useStore();
  const rows = stats.per_column.filter((row) => row.n_null > 0);

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div>Всего строк: {stats.n_rows}</div>
      {rows.map((row) => (
        <div key={row.column}>
          <span style={{ fontFamily: MONO }}>{row.column}</span>
          {row.role === 'key' && ' (ключевая колонка)'}: {row.n_null} пропусков (
          {(row.share * 100).toFixed(2)}%)
        </div>
      ))}
      {stats.metric_by_group.length > 0 && (
        <div>
          По группам:{' '}
          {stats.metric_by_group
            .map((g) => `${g.group} — ${g.n_null} из ${g.n_rows} (${(g.share * 100).toFixed(2)}%)`)
            .join('; ')}
        </div>
      )}
    </div>
  );
}

/** Фактическое распределение по группам против ожидаемого — главный аргумент
 *  в разговоре про SRM: сначала числа, потом p-value. */
function SrmAllocationTable({ rows, unitCol }: { rows: SrmAllocationRow[]; unitCol?: string | null }) {
  const { c } = useStore();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
        <thead>
          <tr style={{ color: c.textSecondary, textAlign: 'left' }}>
            <th style={{ padding: '4px 8px 4px 0' }}>Группа</th>
            <th style={{ padding: '4px 8px' }}>{unitCol ? `Уникальных ${unitCol}` : 'Строк'}</th>
            <th style={{ padding: '4px 8px' }}>Доля</th>
            <th style={{ padding: '4px 8px' }}>Ожидалось</th>
            <th style={{ padding: '4px 8px' }}>Отклонение</th>
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
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: MONO }}>
        n={diag.n} · медиана {num(diag.median)} · среднее {num(diag.mean)} · max {num(diag.max)}
      </div>
      <div style={{ fontFamily: MONO }}>
        асимметрия {num(diag.skewness, 3)} · эксцесс {num(diag.kurtosis, 3)} · выбросов{' '}
        {(diag.outlier_share * 100).toFixed(2)}% ({diag.n_outliers})
      </div>
      {diag.top1_share_of_sum !== null && (
        <div>На верхний 1% приходится {(diag.top1_share_of_sum * 100).toFixed(1)}% суммы метрики.</div>
      )}
      {diag.negative_share > 0 && (
        <div>
          Отрицательных значений {(diag.negative_share * 100).toFixed(1)}% — логарифмирование неприменимо.
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
      <span>Свои квантили, %:</span>
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
        Применить
      </button>
    </div>
  );
}

/** Что обработка сделала с метрикой: до, после и относительное изменение. */
function ComparisonTable({ rows }: { rows: OutlierComparisonRow[] }) {
  const { c } = useStore();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
        <thead>
          <tr style={{ color: c.textSecondary, textAlign: 'left' }}>
            <th style={{ padding: '4px 8px 4px 0' }}>Группа</th>
            {COMPARISON_STATS.map((stat) => (
              <th key={stat.key} style={{ padding: '4px 8px' }}>
                {stat.label}
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
        <div style={{ fontSize: 14, fontWeight: 600 }}>Согласны с обработкой выбросов?</div>
        <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
          {interrupt.report?.interpretation ??
            `Применён вариант ${interrupt.decision?.method ?? ''}. Сравните метрику до и после.`}
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
          Да, продолжаем
        </button>
        <button
          onClick={() => void answer(false)}
          disabled={busy}
          style={{ ...s.secondaryButton, opacity: busy ? 0.6 : 1 }}
        >
          Нет, выбрать другой вариант
        </button>
      </div>
    </div>
  );
}

/** Выбор срезов для проверки SRM. Кандидаты найдены агентом в самих данных,
 *  поэтому рядом с колонкой видно, на что она реально бьётся. */
function SegmentPicker({
  candidates,
  primaryLabel = 'Проверить по выбранным',
  fallbackLabel = 'Только общий сплит',
}: {
  candidates: SegmentCandidate[];
  primaryLabel?: string;
  fallbackLabel?: string;
}) {
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
              <span style={{ fontSize: 12, color: c.textSecondary }}> · {candidate.n_levels} значений</span>
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
          {primaryLabel}
        </button>
        <button
          onClick={() => void send([])}
          disabled={busy}
          style={{ ...s.secondaryButton, opacity: busy ? 0.6 : 1 }}
        >
          {fallbackLabel}
        </button>
      </div>
    </>
  );
}

/** Результат SRM внутри срезов: где перекос есть и на каких значениях. */
function SegmentResults({ segments }: { segments: SrmSegmentResult[] }) {
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {segments.map((segment) => (
        <div key={segment.column}>
          <span style={{ fontFamily: MONO }}>{segment.column}</span> ({segment.n_levels_tested} значений,
          alpha {segment.alpha.toPrecision(2)}):{' '}
          {segment.failed_levels.length > 0 ? (
            <span style={{ color: c.error }}>перекос в {segment.failed_levels.join(', ')}</span>
          ) : (
            'перекоса нет'
          )}
        </div>
      ))}
    </div>
  );
}

/** Колонки-кандидаты на единицу рандомизации: сколько уникальных значений и
 *  сколько строк на значение — по этим двум числам выбор и делается. */
function UnitCandidates({ candidates }: { candidates: UnitCandidate[] }) {
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {candidates.map((candidate) => (
        <div key={candidate.column}>
          <span style={{ fontFamily: MONO, fontSize: 13, color: c.textPrimary }}>{candidate.column}</span>
          {' — '}
          {candidate.n_unique} уникальных
          {candidate.one_row_per_value
            ? ', по одной строке на значение'
            : `, ≈${candidate.rows_per_unit} строк на значение`}
          {candidate.null_share > 0 && `, пропусков ${(candidate.null_share * 100).toFixed(1)}%`}
        </div>
      ))}
    </div>
  );
}

/** Кандидаты в экспозицию: суммы по веткам — то, что и будет сравниваться. */
function ExposureCandidates({ candidates }: { candidates: ExposureCandidate[] }) {
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
          {candidate.null_share > 0 && `, пропусков ${(candidate.null_share * 100).toFixed(1)}%`}
        </div>
      ))}
    </div>
  );
}

/** Своя колонка экспозиции: эвристика предлагает не всё, что годится. */
function CustomExposure({ columns, busy }: { columns: string[]; busy: boolean }) {
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
        Нужной колонки нет в списке — выберите любую числовую:
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
            placeholder="имя колонки"
            disabled={busy || sending}
            style={{ ...s.input, flex: 1, fontFamily: MONO, fontSize: 13 }}
          />
        )}
        <button
          onClick={() => void send()}
          disabled={disabled}
          style={{ ...s.secondaryButtonSmall, opacity: disabled ? 0.6 : 1 }}
        >
          Считать по ней
        </button>
      </div>
    </div>
  );
}

/** Плановые доли вручную: поля на группу, сумма считается на лету. */
function ManualSplit({ groups, initial }: { groups: string[]; initial: Record<string, number> }) {
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
        Сумма — {total || 0}. Доли нормируются, поэтому можно вводить и проценты, и «1/1/2».
      </div>
      <button
        onClick={() => void send()}
        disabled={busy || !valid}
        style={{ ...s.secondaryButton, opacity: busy || !valid ? 0.6 : 1 }}
      >
        Задать плановый сплит
      </button>
    </div>
  );
}

/** Уровень значимости для SRM и для метрик — раздельно, потому что цена
 *  ложного срабатывания у них разная: SRM должен почти никогда не срабатывать
 *  на здоровом сплите, а значимость метрик — обычный компромисс аналитика. */
function AlphaSetup({ defaults }: { defaults: { srm_alpha: number; metric_alpha: number } }) {
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
        Значения по умолчанию (SRM {defaults.srm_alpha}, метрики {defaults.metric_alpha})
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: c.textSecondary }}>
        <span>alpha для SRM:</span>
        <input
          value={srmAlpha}
          onChange={(e) => setSrmAlpha(e.target.value)}
          disabled={busy}
          style={{ ...s.chatInput, width: 80, padding: '4px 8px', fontFamily: MONO }}
        />
        <span>alpha для метрик:</span>
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
          Применить свои
        </button>
      </div>
    </div>
  );
}

/** Размеры веток перед выбором схемы сравнения. */
function GroupSizes({ sizes, suggested }: { sizes: Record<string, number>; suggested?: string | null }) {
  const { c } = useStore();

  return (
    <div style={{ fontSize: 12, color: c.textSecondary, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {Object.entries(sizes).map(([group, n]) => (
        <span key={group}>
          <span style={{ fontFamily: MONO, color: c.textPrimary }}>{group}</span> — {n}
          {group === suggested && ' (похоже на контроль)'}
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
    isAlphaSetup;

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
          {INTERRUPT_TITLES[interrupt.kind] ?? 'Как обработать выбросы?'}
        </div>
        <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
          {usesReportText ? (
            interrupt.report?.interpretation ??
            'В данных есть пропуски. Выбор влияет на состав выборки, поэтому решение за вами.'
          ) : (
            <>
              В колонке <span style={{ fontFamily: MONO }}>{interrupt.metric_col}</span> выбросов{' '}
              {((interrupt.outlier_share ?? 0) * 100).toFixed(1)}%. Выбор влияет на результат теста,
              поэтому решение за вами.
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
          Уже отклонено: {interrupt.rejected.map((r) => METHOD_LABELS[r.method] ?? r.method).join(', ')}.
        </div>
      )}

      {isSegmentPicker && interrupt.candidates && <SegmentPicker candidates={interrupt.candidates} />}

      {isHeterogeneityFields && interrupt.candidates && (
        <SegmentPicker
          candidates={interrupt.candidates}
          primaryLabel="Считать по выбранным"
          fallbackLabel="Отменить — только общий эффект"
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
          Типовые причины: {interrupt.causes.join('; ')}.
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
                  {option.label ?? METHOD_LABELS[option.method] ?? option.method}
                  {isRecommended && (
                    <span style={{ color: c.accent, fontSize: 12, marginLeft: 8 }}>рекомендуем</span>
                  )}
                </span>
                {/* У SRM-вариантов «затронутых строк» нет — это решение,
                    а не обработка данных. */}
                {!DECISION_KINDS.has(interrupt.kind) && (
                  <span style={{ fontSize: 12, color: c.textSecondary, fontFamily: MONO }}>
                    {affected(option)}
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
