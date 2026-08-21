import { useEffect, useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { Dropzone, Field } from '../components/ui';
import * as api from '../api/client';
import type { OnboardDraft, Role } from '../types';

const ROLES: Role[] = ['Admin', 'Analyst', 'Product', 'Marketer', 'Other'];
const GOALS = ['Анализ A/B тестов', 'Поиск инсайтов', 'Отчёты для команды'];

export function OnboardForm() {
  const { c, s, goScreen, user, completeOnboarding } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<OnboardDraft>({
    name: '',
    role: 'Admin',
    company: '',
    goals: [GOALS[0]],
    mdFile: null,
  });

  // Компания и роль уже известны после регистрации — подставляем, но оставляем
  // редактируемыми: имя пользователь на этом шаге как раз и вводит.
  useEffect(() => {
    if (user) setDraft((d) => ({ ...d, name: d.name || user.name, role: user.role }));
  }, [user]);

  const [templateError, setTemplateError] = useState('');

  // Шаблон отдаёт бэкенд, а не статика фронта: секции в нём должны совпадать с
  // теми, что ждёт парсер онбординга, и копия в репозитории фронта разъехалась
  // бы с ними при первой же правке.
  const downloadTemplate = async () => {
    setTemplateError('');
    try {
      const content = await api.fetchContextTemplate();
      const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'company_context_template.md';
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setTemplateError('Не удалось скачать шаблон');
    }
  };

  const toggleGoal = (goal: string) =>
    setDraft((d) => ({
      ...d,
      goals: d.goals.includes(goal) ? d.goals.filter((g) => g !== goal) : [...d.goals, goal],
    }));

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div style={{ width: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 600 }}>Расскажите о себе и компании</div>
          <div style={{ fontSize: 13, color: c.textSecondary, marginTop: 4 }}>
            Это поможет агенту точнее анализировать ваши тесты
          </div>
        </div>

        <Field label="Имя">
          <input
            placeholder="Мария Иванова"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            style={s.input}
          />
        </Field>

        <Field label="Роль">
          <select
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}
            style={s.input}
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>

        <Field label="Компания / проект">
          <input
            placeholder="Acme Commerce"
            value={draft.company}
            onChange={(e) => setDraft({ ...draft, company: e.target.value })}
            style={s.input}
          />
        </Field>

        <div style={s.fieldLabel}>
          Основная цель использования
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            {GOALS.map((goal) => (
              <label
                key={goal}
                style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, fontWeight: 400 }}
              >
                <input
                  type="checkbox"
                  checked={draft.goals.includes(goal)}
                  onChange={() => toggleGoal(goal)}
                />
                {goal}
              </label>
            ))}
          </div>
        </div>

        <div style={s.fieldLabel}>
          Описание компании и продукта (.md)
          <Dropzone>
            {draft.mdFile ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{draft.mdFile.name}</div>
                <div style={{ fontSize: 12, color: c.textSecondary }}>загружен</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13 }}>Перетащите .md файл сюда или</div>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  style={s.secondaryButtonSmall}
                >
                  Выбрать файл
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".md"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setDraft((d) => ({ ...d, mdFile: file }));
                  }}
                />
              </>
            )}
          </Dropzone>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            <button
              type="button"
              onClick={downloadTemplate}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                color: c.accent,
                cursor: 'pointer',
              }}
            >
              Скачать шаблон .md
            </button>
            {templateError && (
              <span style={{ marginLeft: 8, color: c.error }}>{templateError}</span>
            )}
          </div>
        </div>

        <button
          onClick={async () => {
            setSubmitting(true);
            await completeOnboarding(draft.mdFile);
            setSubmitting(false);
            goScreen('onboard-chat');
          }}
          disabled={submitting || !draft.mdFile}
          style={{ ...s.primaryButton, opacity: submitting || !draft.mdFile ? 0.5 : 1 }}
        >
          {submitting ? 'Загружаем...' : 'Продолжить'}
        </button>
      </div>
    </div>
  );
}
