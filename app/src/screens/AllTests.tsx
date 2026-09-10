import { useState } from 'react';

import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { appDict } from '../lib/appDict';
import { StatusBadge } from '../components/ui';

const GRID = '2fr 2fr 1.1fr 1fr 1.4fr 1.1fr 1fr';

type Scope = 'all' | 'mine';

export function AllTests() {
  const { c, s, tests, selectTest, setNewTestModalOpen } = useStore();
  const t = useDict(appDict);
  // По умолчанию — все тесты компании. Спрятать чужие за фильтром значило бы
  // вернуть изоляцию команд, ради отмены которой пул и делался (итерация 005).
  const [scope, setScope] = useState<Scope>('all');

  // Чужой тест приходит с `readOnly`, так что «моя команда» — это ровно те,
  // в которые можно писать; отдельного поля для этого не нужно.
  const visible = scope === 'all' ? tests : tests.filter((t) => !t.readOnly);

  const tab = (value: Scope, label: string) => (
    <button
      onClick={() => setScope(value)}
      style={{
        ...s.secondaryButtonSmall,
        background: scope === value ? c.surface : 'transparent',
        color: scope === value ? c.textPrimary : c.textSecondary,
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div
        style={{
          height: 56,
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          fontSize: 15,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        <span style={{ flex: 1 }}>{t.allTests.title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab('all', t.allTests.allTeams)}
          {tab('mine', t.allTests.myTeam)}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {visible.length > 0 ? (
          <div style={{ border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                background: c.surface,
                fontSize: 12,
                color: c.textSecondary,
              }}
            >
              <div style={s.tableHeadCell}>{t.allTests.name}</div>
              <div style={s.tableHeadCell}>{t.allTests.team}</div>
              <div style={s.tableHeadCell}>{t.allTests.hypothesis}</div>
              <div style={s.tableHeadCell}>{t.allTests.status}</div>
              <div style={s.tableHeadCell}>{t.allTests.results}</div>
              <div style={s.tableHeadCell}>{t.allTests.decision}</div>
              <div style={s.tableHeadCell}>{t.allTests.date}</div>
            </div>
            {visible.map((row) => (
              <div
                key={row.id}
                onClick={() => selectTest(row.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  cursor: 'pointer',
                  borderTop: `1px solid ${c.border}`,
                  fontSize: 13,
                }}
              >
                <div style={s.tableCell}>{row.name}</div>
                <div style={s.tableCellMuted}>{row.teamName || '—'}</div>
                <div style={s.tableCellMuted}>{row.hypothesis}</div>
                <div style={s.tableCell}>
                  <StatusBadge status={row.status} />
                </div>
                <div style={s.tableCellMuted}>
                  {row.results
                    ? row.results.short
                    : row.status === 'analyzing'
                      ? t.allTests.inProgress
                      : '—'}
                </div>
                <div style={s.tableCell}>{row.decision}</div>
                <div style={s.tableCellMuted}>{row.date}</div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: c.surface }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {scope === 'mine' && tests.length > 0
                ? t.allTests.emptyMine
                : t.allTests.emptyAll}
            </div>
            {scope === 'mine' && tests.length > 0 ? (
              <button onClick={() => setScope('all')} style={s.secondaryButtonSmall}>
                {t.allTests.showAllTeams}
              </button>
            ) : (
              <button onClick={() => setNewTestModalOpen(true)} style={s.primaryButton}>
                {t.allTests.createFirst}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
