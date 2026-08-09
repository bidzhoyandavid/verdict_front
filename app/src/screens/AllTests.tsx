import { useStore } from '../storeContext';
import { StatusBadge } from '../components/ui';

const GRID = '2fr 2.4fr 1fr 1.6fr 1.2fr 1fr';

export function AllTests() {
  const { c, s, tests, selectTest, setNewTestModalOpen } = useStore();

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
        Все тесты
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {tests.length > 0 ? (
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
              <div style={s.tableHeadCell}>Гипотеза</div>
              <div style={s.tableHeadCell}>Статус</div>
              <div style={s.tableHeadCell}>Результаты</div>
              <div style={s.tableHeadCell}>Решение</div>
              <div style={s.tableHeadCell}>Дата</div>
            </div>
            {tests.map((t) => (
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
            <div style={{ fontSize: 15, fontWeight: 600 }}>Пока нет ни одного теста</div>
            <button onClick={() => setNewTestModalOpen(true)} style={s.primaryButton}>
              ✦ Создать первый тест
            </button>
          </div>
        )}
      </div>
    </>
  );
}
