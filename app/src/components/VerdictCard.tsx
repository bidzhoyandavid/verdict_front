import { useState } from 'react';
import { useStore } from '../storeContext';
import type { MethodSummaryGroup, Verdict } from '../types';
// Одна карта тонов на заголовок и на карточку: разный цвет под одним
// вердиктом читается как два разных вывода.
import { TONE } from './Headline';
import { EvidencePanel } from './EvidencePanel';

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

      {verdict.srmOverride && (
        <div
          style={{
            border: `1px solid ${c.error}66`,
            background: `${c.error}14`,
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 13,
            color: c.error,
            fontWeight: 600,
          }}
        >
          SRM: разбиение по группам нарушено. Расчёты выполнены по вашему запросу — числа ниже
          нельзя использовать для решения, пока не найдена причина перекоса.
        </div>
      )}

      {verdict.srmSegmentFailures.length > 0 && !verdict.srmOverride && (
        <div
          style={{
            border: `1px solid ${c.warning}66`,
            background: `${c.warning}14`,
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 13,
            color: c.warning,
          }}
        >
          Общий сплит корректен, но перекос есть внутри срезов:{' '}
          {verdict.srmSegmentFailures.map((f) => `${f.column}: ${f.levels.join(', ')}`).join('; ')}. Выводы
          по этим срезам делать нельзя, пока причина не найдена.
        </div>
      )}

      {/* Связный пересказ — до разбора по блокам: сначала читают вывод, а
          потом идут проверять его по числам, а не наоборот. */}
      {verdict.narrative && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {verdict.narrative
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => (
              <div key={paragraph} style={{ fontSize: 14, lineHeight: 1.55 }}>
                {paragraph}
              </div>
            ))}
        </div>
      )}

      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600 }}>Рекомендация: </span>
        {verdict.action}
      </div>

      {verdict.evidence && <EvidencePanel evidence={verdict.evidence} />}

      {verdict.blockingChecks.length > 0 && (
        <div style={{ fontSize: 13, color: c.error }}>
          Не пройдены обязательные проверки: {verdict.blockingChecks.join(', ')}
        </div>
      )}

      <MethodSummary groups={verdict.methodSummary} notes={verdict.methodNotes} />

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


/** «Как считали», свёрнутое по паре «величина + критерий».
 *
 * По строке на метрику это пятнадцать почти одинаковых серых строк подряд —
 * их не читают. Сгруппированные, они отвечают на вопрос «что тут вообще
 * делали» одним взглядом, а подробности достаются кликом.
 */
function MethodSummary({ groups, notes }: { groups: MethodSummaryGroup[]; notes: string[] }) {
  const { c } = useStore();
  const [open, setOpen] = useState<string | null>(null);

  // Старый прогон мог не нести сводки — тогда показываем то, что есть.
  if (groups.length === 0) {
    if (notes.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>Как считали:</div>
        {notes.map((note) => (
          <div key={note} style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.45 }}>
            • {note}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Критерий и сравниваемую величину аналитик подтверждал только по
          главным метрикам — по остальным решение принял агент, и оно обязано
          быть видно здесь, а не только в логе прогона. */}
      <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>Как считали:</div>
      {groups.map((group) => {
        const id = `${group.estimand_label}/${group.method}`;
        const expanded = open === id;
        return (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button
              onClick={() => setOpen(expanded ? null : id)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: 12,
                color: c.textSecondary,
                lineHeight: 1.45,
              }}
            >
              • {plural(group.metrics.length)} — {group.estimand_label}, {group.method}{' '}
              <span style={{ color: c.accent }}>{expanded ? '▾' : '▸'}</span>
            </button>
            {expanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingLeft: 12 }}>
                {group.notes.map((note) => (
                  <div key={note} style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.45 }}>
                    {note}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function plural(n: number): string {
  const tail = n % 100 >= 11 && n % 100 <= 14 ? 5 : n % 10;
  if (tail === 1) return `${n} метрика`;
  if (tail >= 2 && tail <= 4) return `${n} метрики`;
  return `${n} метрик`;
}
