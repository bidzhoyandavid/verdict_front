import { useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { Dropzone, Field, Modal } from '../components/ui';
import type { NewTestDraft } from '../types';

const EMPTY: NewTestDraft = {
  name: '',
  hypothesis: '',
  testType: 'По пользователям',
  groups: 'A/B',
  tracker: '',
  segment: '',
  startDate: '',
  endDate: '',
  dataFile: null,
};

export function NewTestModal() {
  const { c, s, setNewTestModalOpen, createTest } = useStore();
  const [draft, setDraft] = useState<NewTestDraft>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const close = () => setNewTestModalOpen(false);
  const patch = (p: Partial<NewTestDraft>) => setDraft((d) => ({ ...d, ...p }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await createTest(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать тест');
      setSubmitting(false);
    }
  };

  return (
    <Modal width={520} onClose={close}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>Новый тест</div>

      <Field label="Название теста">
        <input
          placeholder="Новая карточка товара"
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          style={s.input}
        />
      </Field>

      <Field label="Гипотеза / что тестируем">
        <textarea
          placeholder="Изменение макета карточки товара увеличит конверсию в добавление в корзину"
          value={draft.hypothesis}
          onChange={(e) => patch({ hypothesis: e.target.value })}
          style={s.textarea}
        />
      </Field>

      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Тип теста" style={{ flex: 1 }}>
          <select value={draft.testType} onChange={(e) => patch({ testType: e.target.value })} style={s.input}>
            <option>По пользователям</option>
            <option>Switchback</option>
            <option>Cluster</option>
            <option>Ценообразование</option>
          </select>
        </Field>
        <Field label="Группы" style={{ flex: 1 }}>
          <select value={draft.groups} onChange={(e) => patch({ groups: e.target.value })} style={s.input}>
            <option>A/B</option>
            <option>A/B/n</option>
            <option>Multivariate</option>
          </select>
        </Field>
      </div>

      <Field label="Задача в трекере">
        <input
          placeholder="JIRA-1042"
          value={draft.tracker}
          onChange={(e) => patch({ tracker: e.target.value })}
          style={s.input}
        />
      </Field>

      <Field label="Сегмент/аудитория (опционально)">
        <input
          placeholder="Новые пользователи, iOS"
          value={draft.segment}
          onChange={(e) => patch({ segment: e.target.value })}
          style={s.input}
        />
      </Field>

      <div style={{ display: 'flex', gap: 10 }}>
        <Field label="Начало" style={{ flex: 1 }}>
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
            style={s.input}
          />
        </Field>
        <Field label="Конец" style={{ flex: 1 }}>
          <input
            type="date"
            value={draft.endDate}
            onChange={(e) => patch({ endDate: e.target.value })}
            style={s.input}
          />
        </Field>
      </div>

      <div style={s.fieldLabel}>
        Файл с данными (csv, parquet)
        <Dropzone padding={16}>
          {draft.dataFile ? (
            <div style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>{draft.dataFile.name}</div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: c.textSecondary }}>
                Перетащите файл сюда · до 200 МБ · нужны колонки с группой и метрикой
              </div>
              <button type="button" onClick={() => fileInput.current?.click()} style={s.secondaryButtonSmall}>
                Выбрать файл
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,.parquet"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) patch({ dataFile: file });
                }}
              />
            </>
          )}
        </Dropzone>
      </div>

      {error && <div style={{ fontSize: 13, color: c.error }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
        <button onClick={close} style={{ ...s.secondaryButton, width: 'auto', padding: '10px 16px' }}>
          Отмена
        </button>
        <button
          onClick={submit}
          disabled={submitting || !draft.name.trim() || !draft.dataFile}
          style={{ ...s.primaryButton, width: 'auto', padding: '10px 16px' }}
        >
          {submitting ? 'Загружаем...' : '✦ Запустить анализ'}
        </button>
      </div>
    </Modal>
  );
}
