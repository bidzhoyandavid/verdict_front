import { useEffect, useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { GRADIENT } from '../theme';
import { statusMeta } from '../components/ui';
import type { ABTest } from '../types';

/** Строка теста со своим меню действий: переименовать / удалить. */
function TestRow({ test }: { test: ABTest }) {
  const { c, s, currentTestId, selectTest, renameTest, deleteTest } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(test.name);
  const [hovered, setHovered] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
    setConfirmDelete(false);
  }

  function startRename() {
    setDraftName(test.name);
    setEditing(true);
    closeMenu();
  }

  async function commitRename() {
    setEditing(false);
    const next = draftName.trim();
    if (!next || next === test.name) return;
    await renameTest(test.id, next);
  }

  const active = currentTestId === test.id;

  return (
    <div
      ref={rowRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 8px',
        borderRadius: 7,
        cursor: 'pointer',
        fontSize: 13,
        background: active ? c.bg : 'transparent',
        color: c.textPrimary,
      }}
    >
      {editing ? (
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={() => void commitRename()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void commitRename();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            ...s.input,
            padding: '2px 6px',
            fontSize: 13,
            flex: 1,
            minWidth: 0,
          }}
        />
      ) : (
        <div
          onClick={() => selectTest(test.id)}
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
        >
          {test.name}
        </div>
      )}

      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: statusMeta(test.status, c).color,
          flexShrink: 0,
        }}
      />

      <div
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
          setConfirmDelete(false);
        }}
        title="Действия"
        style={{
          width: 18,
          textAlign: 'center',
          flexShrink: 0,
          color: c.textSecondary,
          lineHeight: 1,
          // Кнопка появляется по наведению, но у активной строки и открытого
          // меню держим её видимой — иначе меню «висит» без якоря.
          visibility: hovered || menuOpen || active ? 'visible' : 'hidden',
        }}
      >
        ⋯
      </div>

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 30,
            right: 4,
            zIndex: 20,
            width: 180,
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
          <div onClick={startRename} style={s.menuItem}>
            Переименовать
          </div>
          <div
            onClick={() => {
              void navigator.clipboard?.writeText(test.id);
              closeMenu();
            }}
            style={s.menuItem}
          >
            Скопировать ID
          </div>
          <div
            onClick={() => {
              if (!confirmDelete) {
                setConfirmDelete(true);
                return;
              }
              closeMenu();
              void deleteTest(test.id);
            }}
            style={s.menuItemDanger}
          >
            {confirmDelete ? 'Точно удалить?' : 'Удалить тест'}
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const {
    c,
    s,
    sidebarCollapsed,
    toggleSidebar,
    tests,
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
            <TestRow key={t.id} test={t} />
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
