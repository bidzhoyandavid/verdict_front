import { useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { Dropzone, Field } from '../components/ui';
import type { OnboardDraft, Role } from '../types';

const ROLES: Role[] = ['Admin', 'Analyst', 'Product', 'Marketer', 'Other'];
const GOALS = ['Анализ A/B тестов', 'Поиск инсайтов', 'Отчёты для команды'];

export function OnboardForm() {
  const { c, s, goScreen } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<OnboardDraft>({
    name: '',
    role: 'Admin',
    company: '',
    goals: [GOALS[0]],
    mdFileName: null,
  });

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
            {draft.mdFileName ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{draft.mdFileName}</div>
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
                    if (file) setDraft((d) => ({ ...d, mdFileName: file.name }));
                  }}
                />
              </>
            )}
          </Dropzone>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            <a href="#" style={{ color: c.accent, textDecoration: 'none' }}>
              Скачать шаблон .md
            </a>
          </div>
        </div>

        <button onClick={() => goScreen('onboard-chat')} style={s.primaryButton}>
          Продолжить
        </button>
      </div>
    </div>
  );
}
