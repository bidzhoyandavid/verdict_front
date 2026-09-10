import React, { useState } from 'react';
import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { resultsDict } from './results.dict';
import { MONO } from '../theme';
import type { ResultRow, TestResults } from '../types';

/** Числовые колонки фиксированной ширины — иначе значения «пляшут» между строк. */
const COLUMNS = 'minmax(180px, 1.6fr) 96px 96px 96px 76px 88px 148px 72px';

/** Ключ строки: метрика в таблице одна, но таблиц столько же, сколько пар. */
function rowKey(row: ResultRow): string {
  return `${row.metric}|${row.comparison}`;
}

function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('ru-RU');
}

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
  // `== null` on purpose: it catches undefined too. A row that predates a
  // field arrives without it, and "not computed" must render as a dash rather
  // than take down the table.
  if (row.ciLow == null || row.ciHigh == null) return '—';
  return `${significantDigits(row.ciLow)} … ${significantDigits(row.ciHigh)}`;
}

/**
 * Итоговая таблица анализа. Каждое сравнение — своя таблица.
 *
 * Одна общая таблица со столбцом «Сравнение» смешивала строки двух разных
 * сравнений: `label_price vs control` и `label_route vs control` читались
 * подряд, и глазу приходилось самому разбирать, какая строка к какой ветке.
 * Разделение по парам — то, как этот анализ и задумывался: каждая ветка
 * сравнивается с контролем отдельно.
 */
export function ResultsTable({ results }: { results: TestResults }) {
  const [openHow, setOpenHow] = useState<string | null>(null);
  if (results.rows.length === 0) return null;

  // Группы в порядке первого появления, а не по алфавиту: строки приходят с
  // бэкенда в порядке спеки, и подписи должны идти так же от прогона к прогону.
  const groups: { comparison: string; rows: ResultRow[] }[] = [];
  for (const row of results.rows) {
    const hit = groups.find((group) => group.comparison === row.comparison);
    if (hit) hit.rows.push(row);
    else groups.push({ comparison: row.comparison, rows: [row] });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {groups.map((group, index) => (
        <ComparisonTable
          key={group.comparison}
          comparison={group.comparison}
          rows={group.rows}
          // Первая группа уже отделена от предыдущего блока, остальным нужна черта.
          separated={groups.length > 1 && index > 0}
          // Одна пара — подпись не нужна: группы уже названы в шапке колонок.
          captioned={groups.length > 1}
          openHow={openHow}
          setOpenHow={setOpenHow}
        />
      ))}
      <Footnotes results={results} />
    </div>
  );
}

/** Заголовок сравнения. Контроль во всех парах один и тот же — различает их
 *  только имя варианта, поэтому оно и несёт вес, а «vs control» уходит в фон. */
function ComparisonCaption({ comparison }: { comparison: string }) {
  const { c } = useStore();
  const match = /^(.*?)\s+vs\s+(.*)$/.exec(comparison);
  const treatment = match ? match[1] : comparison;
  const control = match ? match[2] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{treatment}</span>
      {control && (
        <span style={{ fontSize: 12, color: c.textSecondary }}>vs {control}</span>
      )}
    </div>
  );
}

interface TableProps {
  comparison: string;
  rows: ResultRow[];
  captioned: boolean;
  separated: boolean;
  openHow: string | null;
  setOpenHow: (key: string | null) => void;
}

function ComparisonTable({ comparison, rows, captioned, separated, openHow, setOpenHow }: TableProps) {
  const { c } = useStore();
  const t = useDict(resultsDict);

  // Колонка «Δ абс.» — не всегда разница средних: на ранговом estimand это
  // сдвиг распределения, и подписать её средним значило бы соврать в заголовке.
  const estimands = new Set(
    rows.map((row) => row.estimandLabel).filter((label): label is string => !!label),
  );
  const single = estimands.size === 1 ? [...estimands][0] : null;
  const effectLabel = single && single !== t.meanDiffLabel ? t.effect : t.absoluteDelta;
  const effectHint = single ?? t.effectHint;

  const first = rows[0];
  const omnibus = first.comparisonMode === 'omnibus';
  const controlLabel = omnibus ? t.control : first.controlGroup ?? 'control';
  const treatmentLabel = omnibus ? t.variant : first.treatmentGroup ?? 'treatment';

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        borderTop: separated ? `1px solid ${c.border}` : undefined,
        paddingTop: separated ? 24 : undefined,
      }}
    >
      {captioned && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <ComparisonCaption comparison={comparison} />
          {!omnibus && (
            <div style={{ fontSize: 12, color: c.textSecondary, fontFamily: MONO }}>
              n: {formatCount(first.nControl)} / {formatCount(first.nTreatment)}
            </div>
          )}
        </div>
      )}

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
            <div style={head}>{t.metric}</div>
            <div style={{ ...head, textAlign: 'right' }}>{controlLabel}</div>
            <div style={{ ...head, textAlign: 'right' }}>{treatmentLabel}</div>
            <div style={{ ...head, textAlign: 'right' }} title={effectHint}>
              {effectLabel}
            </div>
            <div style={{ ...head, textAlign: 'right' }}>Δ %</div>
            <div style={{ ...head, textAlign: 'right' }}>p-value</div>
            <div style={{ ...head, textAlign: 'right' }}>95% CI</div>
            <div style={{ ...head, textAlign: 'center' }}>{t.significant}</div>
          </div>

          {rows.map((row, index) => (
            <React.Fragment key={rowKey(row)}>
              <div
                onClick={() => row.how && setOpenHow(openHow === rowKey(row) ? null : rowKey(row))}
                title={row.warnings.join('\n')}
                style={{
                  display: 'grid',
                  gridTemplateColumns: COLUMNS,
                  borderTop: `1px solid ${c.border}`,
                  background: index % 2 ? c.surface : 'transparent',
                  fontSize: 13,
                  alignItems: 'center',
                  cursor: row.how ? 'pointer' : 'default',
                }}
              >
                <div style={{ ...cell, fontWeight: row.isPrimary ? 600 : 400 }} title={row.metric}>
                  {row.metric}
                  {row.how && (
                    <span style={{ color: c.accent, fontSize: 10, marginLeft: 6 }}>
                      {openHow === rowKey(row) ? '▾' : '▸'}
                    </span>
                  )}
                  {row.isPrimary && (
                    <span style={{ color: c.accent, fontSize: 10, marginLeft: 6, fontWeight: 600 }}>
                      {t.primary}
                    </span>
                  )}
                </div>
                <div style={numeric}>{formatValue(row.controlValue)}</div>
                <div style={numeric}>{formatValue(row.treatmentValue)}</div>
                <div style={numeric} title={row.estimandLabel ?? undefined}>
                  {formatValue(row.absoluteDiff)}
                </div>
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
                <div style={{ ...numeric, fontSize: 12, color: c.textSecondary }}>
                  {formatCI(row)}
                </div>
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
                    {row.significant === null ? '—' : row.significant ? t.yes : t.no}
                  </span>
                </div>
              </div>
              {/* Обоснование рядом с числом, к которому относится: в карточке
                  вердикта оно сгруппировано и метрику приходится искать. */}
              {openHow === rowKey(row) && row.how && (
                <div
                  style={{
                    borderTop: `1px solid ${c.border}`,
                    background: c.surface,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: c.textSecondary,
                    lineHeight: 1.45,
                  }}
                >
                  {row.how}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}


function Footnotes({ results }: { results: TestResults }) {
  const { c } = useStore();
  const t = useDict(resultsDict);
  const notes: string[] = [];

  const comparisons = new Set(results.rows.map((row) => row.comparison));
  if (results.correctionApplied) {
    const scope =
      comparisons.size > 1
        ? t.scopeTests(
            results.rows.length,
            new Set(results.rows.map((r) => r.metric)).size,
            comparisons.size,
          )
        : t.scopeMetrics(results.rows.length);
    notes.push(t.correctionNote(results.correctionApplied, scope));
  }
  const estimands = [
    ...new Set(
      results.rows
        .filter((row) => row.estimand && row.estimand !== 'mean_diff')
        .map((row) => row.estimandLabel)
        .filter((label): label is string => !!label),
    ),
  ];
  if (estimands.length > 0) {
    notes.push(t.estimandNote(estimands.join(', ')));
  }

  const rowWarnings = results.rows.flatMap((row) =>
    row.warnings.map((warning) =>
      comparisons.size > 1 ? `${row.metric} (${row.comparison}): ${warning}` : `${row.metric}: ${warning}`,
    ),
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
