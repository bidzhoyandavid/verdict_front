import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { appDict } from '../lib/appDict';
import { MONO } from '../theme';
import type { DerivedColumn } from '../types';

/** Как посчитаны производные колонки.
 *
 *  Имя метрики без формулы не даёт проверить, ту ли величину посчитал агент:
 *  «конверсия из мапчекинга в оффер» — это `sum(a)/sum(b)` или среднее
 *  построчных дробей? Разница в числе, и видеть её надо рядом с результатом,
 *  а не в форме, которую заполняли до прогона. */
export function DerivedPanel({ columns }: { columns: DerivedColumn[] }) {
  const { c, s } = useStore();
  const t = useDict(appDict);

  if (columns.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{t.derived.title}</div>
      <div
        style={{
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {columns.map((column, i) => {
          const failed = column.status === 'failed';
          const isRatio = Boolean(column.numerator && column.denominator);
          return (
            <div
              key={column.name}
              style={{
                padding: '10px 14px',
                borderTop: i > 0 ? `1px solid ${c.border}` : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{column.name}</span>
                {isRatio && (
                  <span
                    style={{
                      ...s.tableHeadCell,
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: c.accentSoft,
                      color: c.accent,
                    }}
                  >
                    {t.derived.ratio}
                  </span>
                )}
                {failed && (
                  <span style={{ fontSize: 12, color: c.error }}>{t.derived.notComputed}</span>
                )}
              </div>

              {column.expression && (
                <div style={{ fontFamily: MONO, fontSize: 12, color: c.textSecondary }}>
                  {column.expression}
                </div>
              )}

              <div style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.5 }}>
                {isRatio
                  ? // Главное, что должен знать аналитик про отношение: оно
                    // сравнивается суммами, а не средним построчных дробей.
                    t.derived.ratioNote
                  : column.aggregatedBy
                    ? t.derived.aggregatedBy(column.aggregatedBy)
                    : t.derived.perRow}
                {column.detail ? ` · ${column.detail}` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
