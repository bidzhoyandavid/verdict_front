import { useState } from 'react';
import { useStore } from '../storeContext';
import { GRADIENT, MONO } from '../theme';
import type { RunProgress, StepReport } from '../types';


/** Сырые входные данные шага — под спойлером, чтобы лента оставалась читаемой. */
function StepDetails({ report }: { report: StepReport }) {
  const { c } = useStore();
  const [open, setOpen] = useState(false);
  if (!Object.keys(report.inputs).length) return null;

  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: 12,
          color: c.textSecondary,
        }}
      >
        {open ? 'скрыть данные шага' : 'данные шага'}
      </button>
      {open && (
        <pre
          style={{
            margin: '4px 0 0',
            padding: 8,
            borderRadius: 8,
            background: c.surface,
            border: `1px solid ${c.border}`,
            fontFamily: MONO,
            fontSize: 11,
            color: c.textSecondary,
            overflowX: 'auto',
          }}
        >
          {JSON.stringify(report.inputs, null, 2)}
        </pre>
      )}
    </div>
  );
}

/**
 * Лента шагов пайплайна вместо безликого спиннера: анализ идёт минуты, и
 * видеть, что именно агент посчитал и какой вывод сделал, важнее, чем видеть,
 * что он «идёт». Интерпретацию пишет сам шаг — это не пересказ LLM.
 */
export function RunProgressList({ progress }: { progress: RunProgress }) {
  const { c } = useStore();
  if (progress.steps.length === 0) return null;

  const currentIndex = progress.done.length;
  const reportByNode = new Map(progress.reports.map((r) => [r.node, r]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {progress.steps.map((step, index) => {
        const isDone = progress.done.includes(step.id);
        const isCurrent = index === currentIndex;
        const report = reportByNode.get(step.id);
        // Шаг мог быть снят с прогона до того, как до него дошли: тогда он
        // не «ждёт», а уже всё про себя рассказал.
        const isSkipped = step.status === 'skipped';
        const isWarning = report?.status === 'warning' || step.status === 'warning';
        const isFailed = report?.status === 'error' || step.status === 'failed';
        const marker = isFailed
          ? c.error
          : isWarning
            ? c.warning
            : isDone
              ? c.success
              : isCurrent
                ? GRADIENT
                : c.surface;
        const active = isDone || isCurrent;

        return (
          <div
            key={step.id}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              fontSize: 13,
              color: active ? c.textPrimary : c.textSecondary,
              opacity: active ? 1 : isSkipped ? 0.6 : 0.5,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                flexShrink: 0,
                marginTop: 2,
                background: marker,
                border: active || isWarning || isFailed ? 'none' : `1px solid ${c.border}`,
                animation: isCurrent ? 'pulseGlow 1.6s ease-in-out infinite' : undefined,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div>{step.label}</div>
              {(report?.interpretation || step.detail) && (
                <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 2 }}>
                  {report?.interpretation || step.detail}
                </div>
              )}
              {report && <StepDetails report={report} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
