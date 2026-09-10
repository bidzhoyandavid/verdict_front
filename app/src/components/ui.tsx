import type { CSSProperties, ReactNode } from 'react';
import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { commonDict } from '../lib/commonDict';
import { GRADIENT, type Colors } from '../theme';
import type { TestStatus } from '../types';

/** Цвет статуса. Подпись живёт в словаре: она зависит от языка, а цвет — нет,
 *  и вызывающему нужно то одно, то другое. */
export function statusMeta(status: TestStatus, c: Colors) {
  const map: Record<TestStatus, string> = {
    done: c.success,
    analyzing: c.warning,
    awaiting_input: c.accent,
    clarifying: c.accent,
    failed: c.error,
    queued: c.textSecondary,
  };
  const color = map[status];
  return { color, bg: `${color}22` };
}

export function StatusBadge({ status }: { status: TestStatus }) {
  const { c } = useStore();
  const t = useDict(commonDict);
  const meta = statusMeta(status, c);
  return (
    <span
      style={{
        fontSize: 12,
        padding: '3px 8px',
        borderRadius: 6,
        background: meta.bg,
        color: meta.color,
        fontWeight: 500,
      }}
    >
      {t.status[status] ?? status}
    </span>
  );
}

export function Logo({ size = 40, radius = 10 }: { size?: number; radius?: number }) {
  return <div style={{ width: size, height: size, borderRadius: radius, background: GRADIENT, flexShrink: 0 }} />;
}

export function Field({
  label,
  children,
  style,
}: {
  label: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const { s } = useStore();
  return (
    <label style={{ ...s.fieldLabel, ...style }}>
      {label}
      {children}
    </label>
  );
}

export function Dropzone({
  children,
  padding = 20,
}: {
  children: ReactNode;
  padding?: number;
}) {
  const { c } = useStore();
  return (
    <div
      style={{
        marginTop: 6,
        border: `1.5px dashed ${c.border}`,
        borderRadius: 10,
        padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        background: c.surface,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

export function Modal({
  width,
  onClose,
  children,
}: {
  width: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const { c, s } = useStore();
  return (
    <div style={s.modalOverlay} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxHeight: '88vh',
          overflow: 'auto',
          background: c.bg,
          borderRadius: 14,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
