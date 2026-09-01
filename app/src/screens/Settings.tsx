import { useEffect, useState } from 'react';

import { useStore } from '../storeContext';
import { Field } from '../components/ui';
import { addCompanyMetric, deleteCompanyMetric, fetchCompanyMetrics } from '../api/client';
import type { CompanyMetric, SettingsTab } from '../types';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'profile', label: 'Профиль' },
  { id: 'company', label: 'Компания' },
  { id: 'team', label: 'Команда' },
  { id: 'metrics', label: 'Метрики' },
  { id: 'theme', label: 'Тема' },
  { id: 'roles', label: 'Роли и права' },
];

export function Settings() {
  const { c, settingsTab, setSettingsTab } = useStore();

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
        Настройки
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          style={{
            width: 200,
            borderRight: `1px solid ${c.border}`,
            padding: '16px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            flexShrink: 0,
          }}
        >
          {TABS.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                background: settingsTab === tab.id ? c.surface : 'transparent',
                color: c.textPrimary,
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          {settingsTab === 'profile' && <ProfileTab />}
          {settingsTab === 'company' && <CompanyTab />}
          {settingsTab === 'team' && <TeamTab />}
          {settingsTab === 'metrics' && <MetricsTab />}
          {settingsTab === 'theme' && <ThemeTab />}
          {settingsTab === 'roles' && <RolesTab />}
        </div>
      </div>
    </>
  );
}

function ProfileTab() {
  const { c, s, user } = useStore();
  return (
    <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Имя">
        <input defaultValue={user?.name} style={s.input} />
      </Field>
      <Field label="Email">
        <input defaultValue={user?.email} style={s.input} />
      </Field>
      <Field label="Пароль">
        <button style={s.secondaryButtonSmall}>Изменить пароль</button>
      </Field>
      <div style={s.fieldLabel}>
        Роль
        <div style={{ fontSize: 14, color: c.textSecondary }}>{user?.role}</div>
      </div>
    </div>
  );
}

function MetricsTab() {
  const { c, s, user } = useStore();
  const [metrics, setMetrics] = useState<CompanyMetric[]>([]);
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Читают словарь все, правят лид и владелец — бэкенд отвечает на попытку 403,
  // и показывать форму, которая заведомо не сработает, незачем.
  const canEdit = user?.permission === 'owner' || user?.permission === 'lead';

  useEffect(() => {
    void fetchCompanyMetrics().then(setMetrics).catch(() => setMetrics([]));
  }, []);

  const add = async () => {
    setError(null);
    try {
      const created = await addCompanyMetric(
        name,
        aliases.split(',').map((a) => a.trim()).filter(Boolean),
        '',
      );
      setMetrics((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setAliases('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось добавить метрику');
    }
  };

  const drop = async (metricId: string) => {
    await deleteCompanyMetric(metricId);
    setMetrics((prev) => prev.filter((m) => m.id !== metricId));
  };

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, color: c.textSecondary }}>
        Общие имена метрик для всей компании. Агент подставляет их в постановку теста, поэтому
        одинаковые метрики разных команд сходятся, а не расходятся по названиям.
      </div>

      {metrics.map((metric) => (
        <div
          key={metric.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderTop: `1px solid ${c.border}`,
            paddingTop: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{metric.name}</div>
            {metric.aliases.length > 0 && (
              <div style={{ fontSize: 12, color: c.textSecondary }}>
                также: {metric.aliases.join(', ')}
              </div>
            )}
          </div>
          {canEdit && (
            <button onClick={() => void drop(metric.id)} style={s.secondaryButtonSmall}>
              Убрать
            </button>
          )}
        </div>
      ))}

      {metrics.length === 0 && (
        <div style={{ fontSize: 13, color: c.textSecondary }}>Словарь пока пуст.</div>
      )}

      {canEdit && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Field label="Имя метрики" style={{ flex: 1 }}>
            <input
              placeholder="ARPU"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={s.input}
            />
          </Field>
          <Field label="Синонимы через запятую" style={{ flex: 1 }}>
            <input
              placeholder="arpu_total, выручка на пользователя"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              style={s.input}
            />
          </Field>
          <button onClick={() => void add()} disabled={!name.trim()} style={s.secondaryButtonSmall}>
            Добавить
          </button>
        </div>
      )}
      {error && <div style={{ fontSize: 13, color: c.error }}>{error}</div>}
    </div>
  );
}

const CONTEXT_LABEL: Record<string, string> = {
  ready: 'Заполнен',
  draft: 'Начат, но не подтверждён',
  absent: 'Не заполнен',
};

function CompanyTab() {
  const { c, s, companyDocs, user, goScreen } = useStore();
  const latest = companyDocs[0];
  const isOwner = user?.permission === 'owner';
  const status = user?.contextStatus ?? 'absent';

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.fieldLabel}>
        Название
        <div style={{ fontSize: 14, color: c.textSecondary }}>{user?.companyName || '—'}</div>
      </div>

      <div style={s.fieldLabel}>
        Контекст для агента
        <div style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>
          {CONTEXT_LABEL[status]}
          {status !== 'ready' && ' — агент отвечает без специфики вашего продукта'}
        </div>
        {/* Заполняет только владелец: документ действует на выводы во всех
            командах компании. */}
        {isOwner && status !== 'ready' && (
          <button
            onClick={() => goScreen('onboard-form')}
            style={{
              marginTop: 8,
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              fontWeight: 600,
              color: c.accent,
              cursor: 'pointer',
            }}
          >
            {status === 'draft' ? 'Продолжить заполнение' : 'Заполнить'}
          </button>
        )}
        {!isOwner && status !== 'ready' && (
          <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 6 }}>
            Заполнить может владелец компании.
          </div>
        )}
      </div>
      <div style={s.fieldLabel}>
        Описание компании/продукта
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{latest?.filename ?? '—'}</div>
            <div style={{ fontSize: 12, color: c.textSecondary }}>
              {latest ? `контекст компании ${latest.version} · обновлён ${latest.updatedAt}` : ''}
            </div>
          </div>
          <button style={s.secondaryButtonSmall}>Загрузить новый</button>
        </div>
      </div>
      <div style={s.fieldLabel}>
        История версий
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
          {companyDocs.map((doc, i) => (
            <div
              key={doc.version}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13,
                padding: '6px 0',
                borderBottom: i < companyDocs.length - 1 ? `1px solid ${c.border}` : 'none',
              }}
            >
              <span>
                {doc.version} — {doc.updatedAt}
              </span>
              <a href="#" style={{ color: c.accent, textDecoration: 'none' }}>
                Скачать
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  const { c, s, team, setInviteModalOpen } = useStore();
  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setInviteModalOpen(true)} style={s.secondaryButtonSmall}>
          Пригласить участника
        </button>
      </div>
      {team.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: c.textSecondary }}>{p.email}</div>
          </div>
          <div style={{ fontSize: 13, color: c.textSecondary }}>{p.role}</div>
        </div>
      ))}
    </div>
  );
}

function ThemeTab() {
  const { c, theme, setTheme } = useStore();
  const option = (active: boolean) => ({
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${active ? c.accent : c.border}`,
    cursor: 'pointer',
    fontSize: 14,
  });
  return (
    <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div onClick={() => setTheme('light')} style={option(theme === 'light')}>
        Светлая
      </div>
      <div onClick={() => setTheme('dark')} style={option(theme === 'dark')}>
        Тёмная
      </div>
    </div>
  );
}

function RolesTab() {
  const { c } = useStore();
  return (
    <div style={{ maxWidth: 520, fontSize: 13, lineHeight: 1.6, color: c.textSecondary }}>
      <div style={{ marginBottom: 10 }}>
        <b style={{ color: c.textPrimary }}>Admin</b> — полный доступ: команда, настройки компании, все
        тесты
      </div>
      <div>
        <b style={{ color: c.textPrimary }}>Analyst / Product / Marketer</b> — создание тестов, просмотр
        всех тестов компании, чат с агентом
      </div>
    </div>
  );
}
