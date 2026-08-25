import { useStore } from '../storeContext';
import { MONO } from '../theme';
import type { ResultRow, TestResults, Verdict } from '../types';

/**
 * Тон вывода по коду вердикта.
 *
 * Коды перечислены те, что реально приходят с бэкенда (`_run_verdict`):
 * `ship`, `rollback`, `blocked`, `no_data`, `difference_found`, `inconclusive`,
 * `hold`, `no_effect`. Незнакомый код — нейтральный, а не «всё хорошо»:
 * покрасить в зелёный то, чего не понял, хуже, чем не покрасить.
 */
export const TONE: Record<string, 'good' | 'bad' | 'neutral'> = {
  ship: 'good',
  rollback: 'bad',
  blocked: 'bad',
  no_data: 'bad',
  // Различия есть, но кто победил — неизвестно: это не «хорошо» и не «плохо».
  difference_found: 'neutral',
  inconclusive: 'neutral',
  hold: 'neutral',
  no_effect: 'neutral',
};

/**
 * Ярлык вердикта — глаголом и одним словом.
 *
 * `label` с бэкенда описывает, что нашли («Эффект отрицательный»), а не что с
 * этим делать. Читателю заголовка нужно второе, и нужно раньше: решение —
 * это `action`, а `label` объясняет, откуда оно взялось.
 */
const BADGE: Record<string, string> = {
  ship: 'РАСКАТЫВАТЬ',
  rollback: 'ОТКАТЫВАТЬ',
  blocked: 'НЕЛЬЗЯ СУДИТЬ',
  no_data: 'НЕТ ДАННЫХ',
  difference_found: 'РАЗБИРАТЬСЯ',
  inconclusive: 'РЕШЕНИЯ НЕТ',
  hold: 'ДЕРЖАТЬ ТЕСТ',
  no_effect: 'ЭФФЕКТА НЕТ',
};

function formatPercent(value: number | null): string {
  if (value === null) return '';
  // Минус типографский: в «-3.00% … -2.00%» дефис сливается с многоточием.
  return `${value >= 0 ? '+' : '−'}${(Math.abs(value) * 100).toFixed(2)}%`;
}

/** «1 оговорка / 2 оговорки / 5 оговорок» — иначе счётчик читается как опечатка. */
function plural(n: number): string {
  const tail = n % 100 >= 11 && n % 100 <= 14 ? 5 : n % 10;
  if (tail === 1) return 'оговорка';
  if (tail >= 2 && tail <= 4) return 'оговорки';
  return 'оговорок';
}

function formatP(value: number | null): string {
  if (value === null) return '';
  if (value < 0.0001) return 'p < 0.0001';
  return value < 0.01 ? `p = ${value.toExponential(1)}` : `p = ${value.toFixed(3)}`;
}

/**
 * Пара веток, про которую вынесен вердикт.
 *
 * Старый прогон приходит без `comparison` в вердикте — тогда пара достаётся
 * из строки таблицы, по которой он вынесен. Без имени ветки «Откатывать» при
 * трёх ветках — совет, который нельзя выполнить: просела одна, а заголовок
 * читается как приговор всему тесту.
 */
function branches(verdict: Verdict, rows: ResultRow[]): { treatment: string; control: string } | null {
  if (verdict.treatmentGroup && verdict.controlGroup) {
    return { treatment: verdict.treatmentGroup, control: verdict.controlGroup };
  }
  const hit = rows.find(
    (r) => r.metric === verdict.metric && r.relativeDiff === verdict.relativeDiff,
  );
  if (hit?.treatmentGroup && hit.controlGroup) {
    return { treatment: hit.treatmentGroup, control: hit.controlGroup };
  }
  return null;
}

/** Сколько ещё веток сравнивалось с контролем по той же метрике. */
function otherBranches(verdict: Verdict, rows: ResultRow[], treatment: string | null): string[] {
  const names = rows
    .filter((r) => r.metric === verdict.metric && r.comparisonMode !== 'omnibus')
    .map((r) => r.treatmentGroup)
    .filter((name): name is string => Boolean(name) && name !== treatment);
  return Array.from(new Set(names));
}

/**
 * Заголовок прогона: что получилось и что с этим делать — до таблиц.
 *
 * Блоки разделены явно: решение, факт, доверие к факту. Одним абзацем это
 * читалось как сводка, в которой всё равнозначно, — и «Откатывать» терялось
 * между названием метрики и p-value.
 *
 * Числа берутся из вердикта, а не пересчитываются здесь: формулировка в
 * заголовке и строка в таблице должны сходиться, а единственный способ это
 * гарантировать — читать один и тот же посчитанный факт.
 */
export function Headline({ results }: { results: TestResults }) {
  const { c } = useStore();
  const verdict = results.verdict;

  // Прогон, не дошедший до вердикта, всё равно заслуживает заголовка: `short`
  // говорит, чем он кончился, и молчать про это хуже, чем сказать коротко.
  if (!verdict) {
    if (!results.short) return null;
    return (
      <div
        style={{
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          padding: '14px 16px',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {results.short}
      </div>
    );
  }

  const tone = TONE[verdict.code] ?? 'neutral';
  const accent = tone === 'good' ? c.success : tone === 'bad' ? c.error : c.accent;
  const badge = BADGE[verdict.code] ?? verdict.label.toUpperCase();

  const pair = branches(verdict, results.rows);
  const others = otherBranches(verdict, results.rows, pair?.treatment ?? null);
  const diff = verdict.relativeDiff;
  const direction = diff === null ? '' : diff >= 0 ? 'выше' : 'ниже';

  // Интервал, а не точка: «упал на 2.0–3.8%» — это диапазон, в котором
  // принимают решение, а голая точка выглядит точнее, чем есть.
  const interval =
    verdict.relativeCiLow !== null && verdict.relativeCiHigh !== null
      ? `${formatPercent(verdict.relativeCiLow)} … ${formatPercent(verdict.relativeCiHigh)}`
      : '';

  const divider = { height: 1, background: `${accent}33` };
  const caption: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: c.textSecondary,
  };

  return (
    <div
      style={{
        border: `1px solid ${accent}55`,
        background: `${accent}0f`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Решение. Первое, что читают, и единственное, что выполняют. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.06em',
            color: tone === 'neutral' ? c.textPrimary : '#fff',
            background: tone === 'neutral' ? `${accent}33` : accent,
            borderRadius: 6,
            padding: '5px 10px',
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </span>
        <span style={{ fontSize: 20, fontWeight: 700, color: accent, lineHeight: 1.2 }}>
          {verdict.label}
        </span>
      </div>

      <div style={divider} />

      {/* Что именно посчитано: метрика, пара веток, направление, размер. */}
      {verdict.metric && (
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={caption}>ЧТО ПОСЧИТАНО</div>
          <div style={{ fontSize: 15, color: c.textPrimary, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700 }}>{verdict.metric}</span>
            {pair && (
              <>
                {': ветка '}
                <span style={{ fontFamily: MONO, fontWeight: 600 }}>{pair.treatment}</span>
                {diff !== null ? ` ${direction} контроля ` : ' против контроля '}
                <span style={{ fontFamily: MONO, fontWeight: 600 }}>{pair.control}</span>
              </>
            )}
            {diff !== null && (
              <>
                {pair ? ' на ' : ': '}
                <span style={{ fontFamily: MONO, fontWeight: 700, color: accent }}>
                  {formatPercent(diff).replace(/^[+−]/, '')}
                </span>
              </>
            )}
          </div>

          {/* Ветки, которых вердикт не касается. Без этой строки «Откатывать»
              читается как приговор всему тесту, а просела одна ветка. */}
          {others.length > 0 && (
            <div style={{ fontSize: 12, color: c.textSecondary }}>
              Вердикт — только про эту пару. Остальные ветки ({others.join(', ')}) смотрите в
              таблице ниже.
            </div>
          )}
        </div>
      )}

      <div style={divider} />

      {/* Насколько этому можно верить — отдельным блоком, а не хвостом строки
          с эффектом: интервал и p отвечают на другой вопрос, чем размер. */}
      <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={caption}>НАСКОЛЬКО ТОЧНО</div>
        <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.5 }}>
          {interval ? (
            <>
              Истинный эффект с вероятностью 95% лежит в{' '}
              <span style={{ fontFamily: MONO, color: c.textPrimary }}>{interval}</span>
            </>
          ) : (
            'Доверительный интервал не посчитан — судить о точности по одной точке нельзя'
          )}
          {verdict.pValue !== null && (
            <span style={{ fontFamily: MONO }}> · {formatP(verdict.pValue)}</span>
          )}
          {verdict.significant === false && ' · различие статистически не значимо'}
        </div>
      </div>

      <div style={divider} />

      {/* Что делать. Своя строка: действие — не примечание к числу. */}
      <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={caption}>ЧТО ДЕЛАТЬ</div>
        <div style={{ fontSize: 14, color: c.textPrimary, lineHeight: 1.45 }}>{verdict.action}</div>

        {/* Оговорки — здесь только счётчиком: разворот живёт в карточке вывода,
            и дублировать его в заголовке значит спорить с ней объёмом. */}
        {verdict.caveats.length > 0 && (
          <div style={{ fontSize: 12, color: c.warning }}>
            {`${verdict.caveats.length} ${plural(verdict.caveats.length)} — ниже, в выводе`}
          </div>
        )}
        {verdict.blockingChecks.length > 0 && (
          <div style={{ fontSize: 12, color: c.error }}>
            Не пройдены обязательные проверки: {verdict.blockingChecks.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}
