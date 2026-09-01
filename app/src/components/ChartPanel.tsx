import { useEffect, useRef } from 'react';
import { useStore } from '../storeContext';
import type { Chart } from '../types';

const HEIGHT = 340;
/** Два графика в ряд на широком экране, один — на узком. Сколько колонок
 * занимает конкретный график, решает бэкенд через `span`: только он знает
 * состав и число метрик. */
const GRID = 'repeat(auto-fit, minmax(420px, 1fr))';

type PlotlyApi = {
  newPlot: (node: HTMLElement, data: unknown, layout: unknown, config: unknown) => Promise<unknown>;
  purge: (node: HTMLElement) => void;
};

let plotlyPromise: Promise<PlotlyApi> | null = null;

/** Один общий импорт на всё приложение: пакет большой, грузить его на каждый
 * график отдельно незачем.
 *
 * Типы @types/plotly.js описывают пакет как namespace без default-экспорта,
 * а plotly.js-dist-min отдаёт именно default — отсюда приведение. */
function loadPlotly(): Promise<PlotlyApi> {
  plotlyPromise ??= import('plotly.js-dist-min').then(
    (module) => (module as unknown as { default: PlotlyApi }).default,
  );
  return plotlyPromise;
}

/**
 * Рендер plotly-спеки, пришедшей с бэкенда.
 *
 * Макет (поля, легенда, заголовок) задан в abex.viz — здесь переопределяются
 * только цвета под тему приложения.
 */
function ChartFigure({ chart }: { chart: Chart }) {
  const container = useRef<HTMLDivElement>(null);
  const { theme, c } = useStore();
  const height = chart.height ?? HEIGHT;

  useEffect(() => {
    const node = container.current;
    if (!node) return;

    let cancelled = false;
    // Флаг обязателен: в StrictMode эффект прогоняется дважды, и очистка
    // первого прохода иначе успевает стереть график, отрисованный вторым.
    let plotted = false;

    void loadPlotly().then((Plotly) => {
      if (cancelled) return;
      // Сетка и оси приходят из abex.viz со светлыми умолчаниями: подложка
      // прозрачная, а линии остаются почти белыми, и в тёмной теме график
      // светится сеткой сильнее, чем данными.
      const axis = {
        gridcolor: c.border,
        zerolinecolor: c.border,
        linecolor: c.border,
        tickfont: { color: c.textSecondary, size: 11 },
        // `title` не трогаем: в нём лежит текст подписи оси, и перезапись
        // объекта стёрла бы её. Цвет заголовка идёт из общего `font`.
      };
      const source = chart.layout as Record<string, unknown>;
      const layout = {
        ...source,
        height,
        autosize: true,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: c.textPrimary, size: 12 },
        // Собственные подписи осей из спеки сохраняются: перезаписываются
        // только цвета.
        xaxis: { ...(source.xaxis as object), ...axis },
        yaxis: { ...(source.yaxis as object), ...axis },
        legend: { font: { color: c.textSecondary, size: 11 } },
      };
      plotted = true;
      return Plotly.newPlot(node, chart.data, layout, {
        displayModeBar: false,
        responsive: true,
      });
    });

    return () => {
      cancelled = true;
      if (plotted) {
        void loadPlotly().then((Plotly) => Plotly.purge(node));
      }
    };
    // Тема меняет цвет подписей — перерисовываем.
  }, [chart, theme, c.textPrimary, c.textSecondary, c.border, height]);

  return <div ref={container} style={{ width: '100%', height }} />;
}

export function ChartPanel({ charts }: { charts: Chart[] }) {
  const { c } = useStore();
  if (charts.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: 12 }}>
      {charts.map((chart, index) => (
        <div
          key={`${chart.kind}-${index}`}
          style={{
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            padding: 10,
            overflow: 'hidden',
            minWidth: 0,
            // `1 / -1` — вся строка сетки независимо от числа колонок.
            gridColumn: chart.span === 'full' ? '1 / -1' : undefined,
          }}
        >
          <ChartFigure chart={chart} />
        </div>
      ))}
    </div>
  );
}
