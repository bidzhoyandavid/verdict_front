import { useStore } from '../storeContext';
import { MONO } from '../theme';
import type { ResultRow, TestResults } from '../types';

/** Числовые колонки фиксированной ширины — иначе значения «пляшут» между строк. */
const COLUMNS = 'minmax(180px, 1.6fr) 96px 96px 96px 76px 88px 148px 72px';

function significantDigits(value: number): string {
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs < 0.001 || abs >= 1_000_000) return value.toExponential(1);
  if (abs < 1) return value.toFixed(3);
  if (abs < 100) return value.toFixed(2);
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function formatValue(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : significantDigits(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(2)}%`;
}

function formatP(row: ResultRow): string {
  const value = row.adjustedPValue ?? row.pValue;
  if (value === null || value === undefined) return '—';
  if (value < 0.0001) return '<0.0001';
  return value < 0.01 ? value.toExponential(1) : value.toFixed(3);
}

function formatCI(row: ResultRow): string {
  if (row.ciLow === null || row.ciHigh === null) return '—';
  return `${significantDigits(row.ciLow)} … ${significantDigits(row.ciHigh)}`;
}

/**
 * Итоговая таблица анализа: строка на метрику. Числа приходят с бэкенда уже
 * посчитанными — здесь только форматирование и выравнивание.
 */
export function ResultsTable({ results }: { results: TestResults }) {
  const { c } = useStore();
  if (results.rows.length === 0) return null;

  const first = results.rows[0];
  const controlLabel = first.controlGroup ?? 'control';
  const treatmentLabel = first.treatmentGroup ?? 'treatment';

  const head: React.CSSProperties = {
    padding: '9px 10px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.02em',
    color: c.textSecondary,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
  const cell: React.CSSProperties = {
    padding: '9px 10px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  const numeric: React.CSSProperties = {
    ...cell,
    textAlign: 'right',
    fontFamily: MONO,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          overflowX: 'auto',
          background: c.bg,
        }}
      >
        <div style={{ minWidth: 900 }}>
          <div style={{ display: 'grid', gridTemplateColumns: COLUMNS, background: c.surface }}>
            <div style={head}>Метрика</div>
            <div style={{ ...head, textAlign: 'right' }}>{controlLabel}</div>
            <div style={{ ...head, textAlign: 'right' }}>{treatmentLabel}</div>
            <div style={{ ...head, textAlign: 'right' }}>Δ абс.</div>
            <div style={{ ...head, textAlign: 'right' }}>Δ %</div>
            <div style={{ ...head, textAlign: 'right' }}>p-value</div>
            <div style={{ ...head, textAlign: 'right' }}>95% CI</div>
            <div style={{ ...head, textAlign: 'center' }}>Значимо</div>
          </div>

          {results.rows.map((row, index) => (
            <div
              key={row.metric}
              title={row.warnings.join('\n')}
              style={{
                display: 'grid',
                gridTemplateColumns: COLUMNS,
                borderTop: `1px solid ${c.border}`,
                background: index % 2 ? c.surface : 'transparent',
                fontSize: 13,
                alignItems: 'center',
              }}
            >
              <div style={{ ...cell, fontWeight: row.isPrimary ? 600 : 400 }} title={row.metric}>
                {row.metric}
                {row.isPrimary && (
                  <span style={{ color: c.accent, fontSize: 10, marginLeft: 6, fontWeight: 600 }}>
                    ГЛАВНАЯ
                  </span>
                )}
              </div>
              <div style={numeric}>{formatValue(row.controlValue)}</div>
              <div style={numeric}>{formatValue(row.treatmentValue)}</div>
              <div style={numeric}>{formatValue(row.absoluteDiff)}</div>
              <div
                style={{
                  ...numeric,
                  color:
                    row.significant && row.relativeDiff !== null
                      ? row.relativeDiff > 0
                        ? c.success
                        : c.error
                      : c.textPrimary,
                }}
              >
                {formatPercent(row.relativeDiff)}
              </div>
              <div style={numeric}>{formatP(row)}</div>
              <div style={{ ...numeric, fontSize: 12, color: c.textSecondary }}>{formatCI(row)}</div>
              <div style={{ ...cell, textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: row.significant ? `${c.success}22` : `${c.textSecondary}18`,
                    color: row.significant ? c.success : c.textSecondary,
                  }}
                >
                  {row.significant === null ? '—' : row.significant ? 'да' : 'нет'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footnotes results={results} />
    </div>
  );
}

function Footnotes({ results }: { results: TestResults }) {
  const { c } = useStore();
  const notes: string[] = [];

  if (results.correctionApplied) {
    notes.push(
      `p-value скорректированы поправкой ${results.correctionApplied} на ${results.rows.length} метрик`,
    );
  }
  const rowWarnings = results.rows.flatMap((row) =>
    row.warnings.map((warning) => `${row.metric}: ${warning}`),
  );
  notes.push(...rowWarnings);

  if (notes.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {notes.map((note) => (
        <div key={note} style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.4 }}>
          {note}
        </div>
      ))}
    </div>
  );
}
