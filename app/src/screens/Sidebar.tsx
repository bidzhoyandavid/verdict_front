import { useStore } from '../storeContext';
import { GRADIENT } from '../theme';
import { statusMeta } from '../components/ui';

export function Sidebar() {
  const {
    c,
    s,
    sidebarCollapsed,
    toggleSidebar,
    tests,
    currentTestId,
    selectTest,
    screen,
    goScreen,
    setNewTestModalOpen,
    profileMenuOpen,
    setProfileMenuOpen,
    toggleTheme,
    theme,
    user,
    signOut,
  } = useStore();

  const wrapStyle = {
    width: sidebarCollapsed ? 56 : 240,
    borderRight: `1px solid ${c.border}`,
    background: c.surface,
    flexShrink: 0,
    transition: 'width .15s ease',
  } as const;

  if (sidebarCollapsed) {
    return (
      <div style={wrapStyle}>
        <div
          style={{
            padding: '14px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div onClick={toggleSidebar} style={{ cursor: 'pointer', color: c.textSecondary }}>
            ⟩
          </div>
          <div
            onClick={() => setNewTestModalOpen(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: c.accent,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            ✦
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <div
        style={{
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: GRADIENT }} />
            Verdict AI
          </div>
          <div
            onClick={toggleSidebar}
            style={{ cursor: 'pointer', color: c.textSecondary, fontSize: 13, padding: 4 }}
          >
            ⟨
          </div>
        </div>

        <button onClick={() => setNewTestModalOpen(true)} style={s.primaryButton}>
          ✦ Новый тест
        </button>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              fontSize: 11,
              color: c.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              padding: '8px 8px 4px',
            }}
          >
            Тесты
          </div>
          {tests.map((t) => (
            <div
              key={t.id}
              onClick={() => selectTest(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 8px',
                borderRadius: 7,
                cursor: 'pointer',
                fontSize: 13,
                background: currentTestId === t.id ? c.bg : 'transparent',
                color: c.textPrimary,
              }}
            >
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: statusMeta(t.status, c).color,
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
        </div>

        <div
          onClick={() => goScreen('all-tests')}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: screen === 'all-tests' ? c.accent : c.textPrimary,
            padding: '7px 8px',
            cursor: 'pointer',
          }}
        >
          Все тесты
        </div>

        <div style={{ position: 'relative', borderTop: `1px solid ${c.border}`, paddingTop: 10 }}>
          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: c.accent,
                color: '#fff',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
              }}
            >
              {user?.initials}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{user?.name}</div>
          </div>

          {profileMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 44,
                left: 6,
                width: 200,
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div onClick={() => goScreen('settings')} style={s.menuItem}>
                Настройки
              </div>
              <div onClick={toggleTheme} style={s.menuItem}>
                Тема: {theme === 'light' ? 'Светлая' : 'Тёмная'}
              </div>
              <div style={s.menuItem}>Помощь / документация</div>
              <div onClick={signOut} style={s.menuItemDanger}>
                Выйти
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
