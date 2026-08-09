import { useState } from 'react';
import { useStore } from '../storeContext';
import type { CheckResult, CheckStatus } from '../types';

const ICONS: Record<CheckStatus, string> = {
  ok: '✓',
  warning: '!',
  failed: '✕',
  skipped: '–',
};

const ORDER: CheckStatus[] = ['failed', 'warning', 'ok', 'skipped'];

/**
 * Все проверки пайплайна со статусами. Проверка, о которой промолчали,
 * с точки зрения аналитика не выполнялась — поэтому здесь и `skipped`
 * показывается явно, с причиной.
 */
export function ChecksPanel({ checks }: { checks: CheckResult[] }) {
  const { c } = useStore();
  // Проблемные проверки раскрыты сразу, пройденные — по клику.
  const [expanded, setExpanded] = useState(false);

  if (checks.length === 0) return null;

  const color = (status: CheckStatus) =>
    status === 'ok' ? c.success : status === 'warning' ? c.warning : status === 'failed' ? c.error : c.textSecondary;

  const counts = ORDER.map((status) => ({
    status,
    n: checks.filter((check) => check.status === status).length,
  })).filter((item) => item.n > 0);

  const visible = expanded ? checks : checks.filter((check) => check.status !== 'ok' && check.status !== 'skipped');
  const hidden = checks.length - visible.length;

  return (
    <div style={{ border: `1px solid ${c.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: visible.length ? 10 : 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Проверки</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {counts.map(({ status, n }) => (
            <span
              key={status}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 6,
                background: `${color(status)}1f`,
                color: color(status),
              }}
            >
              {ICONS[status]} {n}
            </span>
          ))}
        </div>
        {hidden > 0 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: c.accent,
              fontSize: 12,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            показать все ({checks.length})
          </button>
        )}
        {expanded && (
          <button
            onClick={() => setExpanded(false)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: c.accent,
              fontSize: 12,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            свернуть
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {visible.map((check) => (
          <div key={check.name} style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                flexShrink: 0,
                background: `${color(check.status)}22`,
                color: color(check.status),
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ICONS[check.status]}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, minWidth: 190 }}>{check.name}</span>
            <span style={{ fontSize: 12, color: c.textSecondary, lineHeight: 1.45 }}>{check.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
