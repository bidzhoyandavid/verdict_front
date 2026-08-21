import { useState } from 'react';
import { useStore } from '../storeContext';
import { ResultsTable } from './ResultsTable';
import type { SegmentResults, TestResults } from '../types';

/** Тот же эффект, посчитанный отдельно внутри каждого сегмента — гетерогенность
 *  видна как расхождение со строкой в общей таблице выше. */
function SegmentSection({ segment }: { segment: SegmentResults }) {
  const { c } = useStore();
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
          padding: '10px 12px',
          cursor: 'pointer',
          background: c.surface,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>{segment.label}</div>
        <div style={{ fontSize: 12, color: c.textSecondary }}>{segment.nRows} строк {open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ padding: 12 }}>
          {segment.rows.length > 0 ? (
            <ResultsTable results={asResults} />
          ) : (
            <div style={{ fontSize: 12, color: c.textSecondary }}>Не удалось посчитать в этом сегменте.</div>
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
  if (segments.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>Гетерогенность эффекта по сегментам</div>
      <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 2 }}>
        Тот же расчёт отдельно внутри каждого сегмента — сравните со строкой выше.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((segment) => (
          <SegmentSection key={segment.label} segment={segment} />
        ))}
      </div>
    </div>
  );
}
