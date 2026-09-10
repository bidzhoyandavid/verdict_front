import { useState } from 'react';
import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { appDict } from '../lib/appDict';
import { ResultsTable } from './ResultsTable';
import type { SegmentResults, TestResults } from '../types';

/** Ключ сегмента и его значение — визуально разные вещи: имя колонки одинаково
 *  во всех карточках, различает их только значение, поэтому оно и крупнее. */
function SegmentLabel({ label }: { label: string }) {
  const { c } = useStore();
  const sep = label.indexOf('=');
  const key = sep >= 0 ? label.slice(0, sep).trim() : null;
  const value = sep >= 0 ? label.slice(sep + 1).trim() : label;

  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
      {key && (
        <span style={{ fontSize: 12, color: c.textSecondary, whiteSpace: 'nowrap' }}>{key}</span>
      )}
      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Тот же эффект, посчитанный отдельно внутри каждого сегмента — гетерогенность
 *  видна как расхождение со строкой в общей таблице выше. */
function SegmentSection({ segment }: { segment: SegmentResults }) {
  const { c } = useStore();
  const t = useDict(appDict);
  const [open, setOpen] = useState(false);

  const asResults: TestResults = {
    rows: segment.rows,
    checks: [],
    verdict: null,
    short: '',
    srmDetected: false,
    srmOverride: false,
    correctionApplied: null,
    powerVerdict: null,
    timelineWarnings: [],
    guardrailViolations: [],
    segments: [],
    raw: null,
  };

  return (
    <div style={{ border: `1px solid ${c.border}`, borderRadius: 10, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          cursor: 'pointer',
          background: c.surface,
        }}
      >
        <SegmentLabel label={segment.label} />
        <div style={{ fontSize: 12, color: c.textSecondary, flexShrink: 0, marginLeft: 12 }}>
          {t.segments.rows(segment.nRows)} {open ? '▲' : '▼'}
        </div>
      </div>
      {open && (
        <div style={{ padding: 12 }}>
          {segment.rows.length > 0 ? (
            <ResultsTable results={asResults} />
          ) : (
            <div style={{ fontSize: 12, color: c.textSecondary }}>{t.segments.cannotCompute}</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Разбивка результата по сегментам — запрашивается отдельным вопросом в
 * начале анализа (heterogeneity_review). Отсутствие расхождений со средним
 * эффектом — тоже полезный вывод, поэтому блок показывается всегда, когда
 * гетерогенность вообще считалась.
 */
export function SegmentBreakdown({ segments }: { segments: SegmentResults[] }) {
  const { c } = useStore();
  const t = useDict(appDict);
  if (segments.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.segments.title}</div>
      <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 2 }}>
        {t.segments.subtitle}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((segment) => (
          <SegmentSection key={segment.label} segment={segment} />
        ))}
      </div>
    </div>
  );
}
