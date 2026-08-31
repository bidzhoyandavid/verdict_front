import { useState } from 'react';

import { useStore } from '../storeContext';
import { StatusBadge } from '../components/ui';

const GRID = '2fr 2fr 1.1fr 1fr 1.4fr 1.1fr 1fr';

type Scope = 'all' | 'mine';

export function AllTests() {
  const { c, s, tests, selectTest, setNewTestModalOpen } = useStore();
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
        <span style={{ flex: 1 }}>Все тесты</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab('all', 'Все команды')}
          {tab('mine', 'Моя команда')}
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
              <div style={s.tableHeadCell}>Название</div>
              <div style={s.tableHeadCell}>Команда</div>
              <div style={s.tableHeadCell}>Гипотеза</div>
              <div style={s.tableHeadCell}>Статус</div>
              <div style={s.tableHeadCell}>Результаты</div>
              <div style={s.tableHeadCell}>Решение</div>
              <div style={s.tableHeadCell}>Дата</div>
            </div>
            {visible.map((t) => (
              <div
                key={t.id}
                onClick={() => selectTest(t.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  cursor: 'pointer',
                  borderTop: `1px solid ${c.border}`,
                  fontSize: 13,
                }}
              >
                <div style={s.tableCell}>{t.name}</div>
                <div style={s.tableCellMuted}>{t.teamName || '—'}</div>
                <div style={s.tableCellMuted}>{t.hypothesis}</div>
                <div style={s.tableCell}>
                  <StatusBadge status={t.status} />
                </div>
                <div style={s.tableCellMuted}>
                  {t.results ? t.results.short : t.status === 'analyzing' ? 'В процессе' : '—'}
                </div>
                <div style={s.tableCell}>{t.decision}</div>
                <div style={s.tableCellMuted}>{t.date}</div>
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
                ? 'У вашей команды пока нет тестов'
                : 'Пока нет ни одного теста'}
            </div>
            {scope === 'mine' && tests.length > 0 ? (
              <button onClick={() => setScope('all')} style={s.secondaryButtonSmall}>
                Показать тесты всех команд
              </button>
            ) : (
              <button onClick={() => setNewTestModalOpen(true)} style={s.primaryButton}>
                ✦ Создать первый тест
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
