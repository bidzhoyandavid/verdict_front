import { useState } from 'react';
import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { resultsDict } from './results.dict';
import type { DecisionOption, MethodSummaryGroup, Verdict } from '../types';
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
  const t = useDict(resultsDict);
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
          {t.conclusion}
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: accent }}>{verdict.label}</span>
        {verdict.metric && (
          <span style={{ fontSize: 12, color: c.textSecondary }}>
            {t.byMetric(verdict.metric)}
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
          {t.srmBroken}
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
          {t.srmInSegments(
            verdict.srmSegmentFailures
              .map((f) => `${f.column}: ${f.levels.join(', ')}`)
              .join('; '),
          )}
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

      <Decision verdict={verdict} accent={accent} />

      {verdict.evidence && <EvidencePanel evidence={verdict.evidence} />}

      {verdict.blockingChecks.length > 0 && (
        <div style={{ fontSize: 13, color: c.error }}>
          {t.blockingChecks(verdict.blockingChecks.join(', '))}
        </div>
      )}

      <MethodSummary groups={verdict.methodSummary} notes={verdict.methodNotes} />

      {verdict.caveats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>{t.whatWeakens}</div>
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


/** Что делать — вариантами, а не одной строкой.
 *
 * Между «катить на всех» и «откатывать» лежат «держать тест» и «раскатить на
 * сегмент, где эффект подтверждён». Одна рекомендация выглядела как
 * единственный доступный ход, хотя выбор здесь всегда за человеком: пайплайн
 * знает, что показали числа, но не знает цены каждого из решений.
 */
function Decision({ verdict, accent }: { verdict: Verdict; accent: string }) {
  const { c } = useStore();
  const t = useDict(resultsDict);
  const options = verdict.options ?? [];

  // Старый прогон приходит без каталога — показываем то, что в нём есть.
  if (options.length === 0) {
    return (
      <div style={{ fontSize: 14, lineHeight: 1.5 }}>
        <span style={{ fontWeight: 600 }}>{t.recommendation}</span>
        {verdict.action}
      </div>
    );
  }

  const recommended = options.filter((option) => option.recommended);
  const alternatives = options.filter((option) => !option.recommended);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: c.textSecondary }}>
        {t.whatToDo}
      </div>
      {recommended.map((option) => (
        <Option key={option.action} option={option} accent={accent} />
      ))}
      {alternatives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 12, color: c.textSecondary }}>{t.otherOptions}</div>
          {alternatives.map((option) => (
            <Option key={option.action} option={option} accent={accent} />
          ))}
        </div>
      )}
    </div>
  );
}

function Option({ option, accent }: { option: DecisionOption; accent: string }) {
  const { c } = useStore();
  return (
    <div
      style={{
        borderLeft: `3px solid ${option.recommended ? accent : c.border}`,
        paddingLeft: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: option.recommended ? 700 : 600, lineHeight: 1.4 }}>
        {option.action}
      </div>
      <div style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.45 }}>{option.why}</div>
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
  const t = useDict(resultsDict);
  const [open, setOpen] = useState<string | null>(null);

  // Старый прогон мог не нести сводки — тогда показываем то, что есть.
  if (groups.length === 0) {
    if (notes.length === 0) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>{t.howComputed}</div>
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
      <div style={{ fontSize: 12, fontWeight: 600, color: c.textSecondary }}>{t.howComputed}</div>
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
              • {t.metricsCount(group.metrics.length)} — {group.estimand_label}, {group.method}{' '}
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

