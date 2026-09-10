import { useEffect, useRef, useState } from 'react';

import { useStore } from '../storeContext';
import { useDict, useLang } from '../lib/lang';
import type { Lang } from '../lib/lang';
import { appDict } from '../lib/appDict';
import { Field } from '../components/ui';
import {
  addCompanyMetric,
  changePassword,
  deleteCompanyMetric,
  fetchCompanyMetrics,
  saveLocale,
} from '../api/client';
import type { CompanyMetric, SettingsTab } from '../types';

const TABS: SettingsTab[] = ['profile', 'company', 'team', 'metrics', 'theme', 'roles'];

export function Settings() {
  const { c, settingsTab, setSettingsTab } = useStore();
  const t = useDict(appDict);

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
        {t.settings.title}
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
              key={tab}
              onClick={() => setSettingsTab(tab)}
              style={{
                padding: '8px 10px',
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                background: settingsTab === tab ? c.surface : 'transparent',
                color: c.textPrimary,
              }}
            >
              {t.settings.tabs[tab]}
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

/** Смена пароля прямо в настройках.
 *
 *  Раскрывается по кнопке, а не живёт формой всегда: три поля ввода в
 *  профиле читаются как то, что нужно заполнить, а пароль меняют редко.
 *  Текущий пароль спрашивается не для формальности — сессия могла остаться
 *  открытой на чужой машине.
 */
function PasswordChange() {
  const { c, s } = useStore();
  const t = useDict(appDict);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setCurrent('');
    setNext('');
    setRepeat('');
    setError(null);
  };

  const submit = async () => {
    if (next !== repeat) {
      setError(t.settings.passwordsDiffer);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await changePassword(current, next);
      reset();
      setOpen(false);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.settings.passwordChangeFailed);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Field label={t.settings.password}>
        <button
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
          style={s.secondaryButtonSmall}
        >
          {t.settings.changePassword}
        </button>
        {done && (
          <div style={{ fontSize: 13, color: c.success, marginTop: 6 }}>
            {t.settings.passwordChanged}
          </div>
        )}
      </Field>
    );
  }

  const blocked = busy || !current || next.length < 8 || !repeat;

  return (
    <Field label={t.settings.password}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="password"
          autoComplete="current-password"
          placeholder={t.settings.currentPassword}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          style={s.input}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t.settings.newPassword}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          style={s.input}
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder={t.settings.repeatPassword}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          style={s.input}
        />
        {error && <div style={{ fontSize: 13, color: c.error }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => void submit()}
            disabled={blocked}
            style={{
              ...s.secondaryButtonSmall,
              opacity: blocked ? 0.5 : 1,
              cursor: blocked ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? t.settings.savingPassword : t.settings.savePassword}
          </button>
          <button
            onClick={() => {
              reset();
              setOpen(false);
            }}
            style={s.secondaryButtonSmall}
          >
            {t.settings.cancel}
          </button>
        </div>
      </div>
    </Field>
  );
}

function ProfileTab() {
  const { c, s, user } = useStore();
  const t = useDict(appDict);
  return (
    <div style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label={t.settings.name}>
        <input defaultValue={user?.name} style={s.input} />
      </Field>
      <Field label="Email">
        <input defaultValue={user?.email} style={s.input} />
      </Field>
      <PasswordChange />
      <div style={s.fieldLabel}>
        {t.settings.role}
        <div style={{ fontSize: 14, color: c.textSecondary }}>{user?.role}</div>
      </div>
    </div>
  );
}

function MetricsTab() {
  const { c, s, user } = useStore();
  const t = useDict(appDict);
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
      setError(e instanceof Error ? e.message : t.settings.addFailed);
    }
  };

  const drop = async (metricId: string) => {
    await deleteCompanyMetric(metricId);
    setMetrics((prev) => prev.filter((m) => m.id !== metricId));
  };

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, color: c.textSecondary }}>
        {t.settings.metricsIntro}
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
                {t.settings.alsoKnownAs(metric.aliases.join(', '))}
              </div>
            )}
          </div>
          {canEdit && (
            <button onClick={() => void drop(metric.id)} style={s.secondaryButtonSmall}>
              {t.settings.remove}
            </button>
          )}
        </div>
      ))}

      {metrics.length === 0 && (
        <div style={{ fontSize: 13, color: c.textSecondary }}>{t.settings.emptyDictionary}</div>
      )}

      {canEdit && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Field label={t.settings.metricName} style={{ flex: 1 }}>
            <input
              placeholder="ARPU"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={s.input}
            />
          </Field>
          <Field label={t.settings.aliases} style={{ flex: 1 }}>
            <input
              placeholder={t.settings.aliasesPlaceholder}
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              style={s.input}
            />
          </Field>
          <button onClick={() => void add()} disabled={!name.trim()} style={s.secondaryButtonSmall}>
            {t.settings.add}
          </button>
        </div>
      )}
      {error && <div style={{ fontSize: 13, color: c.error }}>{error}</div>}
    </div>
  );
}

function CompanyTab() {
  const { c, s, companyDocs, user, goScreen, uploadCompanyDoc } = useStore();
  const t = useDict(appDict);
  const docInput = useRef<HTMLInputElement>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  const sendDoc = async (file: File) => {
    setDocBusy(true);
    setDocError(null);
    try {
      await uploadCompanyDoc(file);
    } catch (e) {
      setDocError(e instanceof Error ? e.message : t.settings.uploadDocFailed);
    } finally {
      setDocBusy(false);
    }
  };
  const latest = companyDocs[0];
  const isOwner = user?.permission === 'owner';
  const status = user?.contextStatus ?? 'absent';

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.fieldLabel}>
        {t.settings.companyName}
        <div style={{ fontSize: 14, color: c.textSecondary }}>{user?.companyName || '—'}</div>
      </div>

      <div style={s.fieldLabel}>
        {t.settings.contextForAgent}
        <div style={{ fontSize: 14, color: c.textSecondary, marginTop: 4 }}>
          {t.settings.contextStatus[status]}
          {status !== 'ready' && t.settings.contextNoSpecifics}
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
            {status === 'draft' ? t.settings.continueFilling : t.settings.fill}
          </button>
        )}
        {!isOwner && status !== 'ready' && (
          <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 6 }}>
            {t.settings.ownerFills}
          </div>
        )}
      </div>
      <div style={s.fieldLabel}>
        {t.settings.companyDescription}
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
              {latest ? t.settings.contextVersion(latest.version, latest.updatedAt) : ''}
            </div>
          </div>
          <button
            onClick={() => docInput.current?.click()}
            disabled={docBusy}
            style={{ ...s.secondaryButtonSmall, opacity: docBusy ? 0.5 : 1 }}
          >
            {docBusy ? t.settings.uploadingDoc : t.settings.uploadNew}
          </button>
          <input
            ref={docInput}
            type="file"
            accept=".md"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Значение сбрасывается сразу: иначе повторный выбор того же
              // файла не даёт события, и кнопка снова «не работает».
              e.target.value = '';
              if (file) void sendDoc(file);
            }}
          />
        </div>
      </div>
      {docError && <div style={{ fontSize: 13, color: c.error }}>{docError}</div>}

      <div style={s.fieldLabel}>
        {t.settings.versionHistory}
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
                {t.settings.download}
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
  const t = useDict(appDict);
  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setInviteModalOpen(true)} style={s.secondaryButtonSmall}>
          {t.settings.inviteMember}
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
  const { c, s, theme, setTheme } = useStore();
  const t = useDict(appDict);
  const { lang, setLang } = useLang();

  // Язык переключается сразу, а на пользователе сохраняется в фоне: письмо
  // уходит из процесса без браузера, и localStorage ему недоступен. Отказ
  // сохранения интерфейс не трогает — язык уже переключён.
  const switchTo = (next: Lang) => {
    if (next === lang) return;
    setLang(next);
    void saveLocale(next).catch(() => {});
  };
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
        {t.settings.lightTheme}
      </div>
      <div onClick={() => setTheme('dark')} style={option(theme === 'dark')}>
        {t.settings.darkTheme}
      </div>

      {/* Язык рядом с темой: и то и другое — как выглядит продукт для этого
          человека, и искать их в разных местах незачем. */}
      <div style={{ ...s.fieldLabel, marginTop: 10 }}>{t.settings.language}</div>
      <div onClick={() => switchTo('ru')} style={option(lang === 'ru')}>
        Русский
      </div>
      <div onClick={() => switchTo('en')} style={option(lang === 'en')}>
        English
      </div>
    </div>
  );
}

function RolesTab() {
  const { c } = useStore();
  const t = useDict(appDict);
  return (
    <div style={{ maxWidth: 520, fontSize: 13, lineHeight: 1.6, color: c.textSecondary }}>
      <div style={{ marginBottom: 10 }}>
        <b style={{ color: c.textPrimary }}>Admin</b>
        {t.settings.adminRights}
      </div>
      <div>
        <b style={{ color: c.textPrimary }}>Analyst / Product / Marketer</b>
        {t.settings.memberRights}
      </div>
    </div>
  );
}
