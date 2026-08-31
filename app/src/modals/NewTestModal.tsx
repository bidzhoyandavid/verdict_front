import { useEffect, useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { Dropzone, Field, Modal } from '../components/ui';
import {
  fetchOverlaps,
  previewDerived,
  uploadDataset,
  type DerivedPreview,
  type TestOverlap,
} from '../api/client';
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
  derivedColumns: [],
  derivedUnit: '',
  datasetId: null,
};

export function NewTestModal() {
  const { c, s, setNewTestModalOpen, createTest } = useStore();
  const [draft, setDraft] = useState<NewTestDraft>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overlaps, setOverlaps] = useState<TestOverlap[]>([]);
  const [preview, setPreview] = useState<DerivedPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Пересечения показываются, пока даты ещё правят: предупреждение после
  // создания теста приходит, когда решение уже принято.
  useEffect(() => {
    if (!draft.startDate && !draft.endDate) {
      setOverlaps([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void fetchOverlaps(draft.startDate, draft.endDate, draft.segment)
        .then((rows) => {
          if (!cancelled) setOverlaps(rows);
        })
        // Пересечения — подсказка, а не условие создания теста: молча ничего
        // не показываем, вместо того чтобы ронять форму.
        .catch(() => {
          if (!cancelled) setOverlaps([]);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft.startDate, draft.endDate, draft.segment]);

  const close = () => setNewTestModalOpen(false);
  const patch = (p: Partial<NewTestDraft>) => setDraft((d) => ({ ...d, ...p }));

  const patchColumn = (index: number, part: Partial<{ name: string; expression: string }>) =>
    setDraft((d) => ({
      ...d,
      derivedColumns: d.derivedColumns.map((c, i) => (i === index ? { ...c, ...part } : c)),
    }));

  const addColumn = () =>
    setDraft((d) => ({ ...d, derivedColumns: [...d.derivedColumns, { name: '', expression: '' }] }));

  const dropColumn = (index: number) =>
    setDraft((d) => ({ ...d, derivedColumns: d.derivedColumns.filter((_, i) => i !== index) }));

  // Превью считается на настоящих данных, поэтому файл заливается здесь же.
  // Тот же датасет потом уходит в тест — второй загрузки не будет.
  const checkColumns = async () => {
    if (!draft.dataFile) return;
    setPreviewing(true);
    setError(null);
    try {
      const datasetId = draft.datasetId ?? (await uploadDataset(draft.dataFile)).dataset_id;
      if (!draft.datasetId) patch({ datasetId });
      const checked = await previewDerived(datasetId, draft.derivedColumns, draft.derivedUnit);
      setPreview(checked);
      // Юнит мог быть угадан на бэке: подставляем его в форму, чтобы в тест
      // уехало ровно то, на чём формулы проверены.
      if (!draft.derivedUnit && checked.unit) patch({ derivedUnit: checked.unit });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось посчитать формулы');
    } finally {
      setPreviewing(false);
    }
  };

  // Формулы проверяются перед созданием, а не по кнопке: непроверенная формула
  // отбивается уже внутри прогона, и человек узнаёт об этом из оговорки в
  // вердикте — то есть когда анализ посчитан без его метрик.
  const filledColumns = () =>
    draft.derivedColumns.filter((column) => column.name.trim() && column.expression.trim());

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const columns = filledColumns();
      if (columns.length > 0) {
        const datasetId = draft.datasetId ?? (draft.dataFile ? (await uploadDataset(draft.dataFile)).dataset_id : null);
        if (!datasetId) {
          setError('Для производных колонок нужен файл с данными');
          setSubmitting(false);
          return;
        }
        if (!draft.datasetId) patch({ datasetId });
        const checked = await previewDerived(datasetId, columns, draft.derivedUnit);
        setPreview(checked);
        if (!draft.derivedUnit && checked.unit) patch({ derivedUnit: checked.unit });
        const failed = checked.columns.filter((row) => row.status === 'failed');
        if (failed.length > 0) {
          setError(`Формулы не считаются: ${failed.map((row) => row.name || '(без имени)').join(', ')}`);
          setSubmitting(false);
          return;
        }
      }
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
        Производные колонки (опционально)
        <div style={{ fontSize: 12, color: c.textSecondary, fontWeight: 400 }}>
          Колонка, которой нет в файле. Можно формулой — sum(orders) / count(*), — а можно
          словами: «конверсия из просмотра в заказ». Агент подберёт колонки сам и покажет,
          что именно посчитал. Юнит агрегации оставьте пустым — определим по данным.
        </div>
        {draft.derivedColumns.map((column, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              placeholder="cr"
              value={column.name}
              onChange={(e) => patchColumn(index, { name: e.target.value })}
              style={{ ...s.input, flex: 1 }}
            />
            <input
              placeholder="конверсия из визита в заказ"
              value={column.expression}
              onChange={(e) => patchColumn(index, { expression: e.target.value })}
              style={{ ...s.input, flex: 2 }}
            />
            <button type="button" onClick={() => dropColumn(index)} style={s.secondaryButtonSmall}>
              Убрать
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button type="button" onClick={addColumn} style={s.secondaryButtonSmall}>
            Добавить колонку
          </button>
          {draft.derivedColumns.length > 0 && (
            <>
              <input
                placeholder="юнит: определим сам, напр. user_id"
                value={draft.derivedUnit}
                onChange={(e) => patch({ derivedUnit: e.target.value })}
                style={{ ...s.input, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => void checkColumns()}
                disabled={previewing || !draft.dataFile}
                style={s.secondaryButtonSmall}
              >
                {previewing ? 'Считаю...' : 'Проверить на данных'}
              </button>
            </>
          )}
        </div>
        {draft.derivedColumns.length > 0 && !draft.dataFile && (
          <div style={{ fontSize: 12, color: c.textSecondary, marginTop: 6, fontWeight: 400 }}>
            Проверить формулу можно после выбора файла с данными.
          </div>
        )}
        {preview && (
          <div
            style={{
              marginTop: 8,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              fontWeight: 400,
            }}
          >
            {preview.columns.map((row) => (
              <div
                key={row.name}
                style={{ color: row.status === 'failed' ? c.error : c.textSecondary }}
              >
                {row.name}: {row.status === 'failed' ? row.detail : row.detail || 'посчитано'}
                {row.status === 'ok' && row.aggregatedBy ? ` · по «${row.aggregatedBy}»` : ''}
                {row.written && row.expression ? ` · «${row.written}» → ${row.expression}` : ''}
              </div>
            ))}
            {preview.rows.length > 0 && (
              <div style={{ marginTop: 8, overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {Object.keys(preview.rows[0]).map((key) => (
                        <th key={key} style={{ textAlign: 'left', padding: '2px 10px 2px 0' }}>
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, index) => (
                      <tr key={index}>
                        {Object.keys(preview.rows[0]).map((key) => (
                          <td key={key} style={{ padding: '2px 10px 2px 0', color: c.textSecondary }}>
                            {row[key] === null ? '—' : String(row[key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {overlaps.length > 0 && (
        <div
          style={{
            border: `1px solid ${c.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 13,
            color: c.textSecondary,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ color: c.textPrimary, fontWeight: 500 }}>
            В это окно уже идут тесты: {overlaps.length}
          </div>
          {overlaps.slice(0, 4).map((row) => (
            <div key={row.testId}>
              {row.name}
              {row.team ? ` · ${row.team}` : ''} · {row.days} дн. пересечения
              {row.sameAudience ? ' · та же аудитория' : ''}
            </div>
          ))}
          {overlaps.length > 4 && <div>и ещё {overlaps.length - 4}</div>}
          <div>
            Это не мешает создать тест, но эффект может быть создан не только вашим изменением.
          </div>
        </div>
      )}

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
                  // Файл сменился — прежняя заливка и её превью относятся к
                  // другим данным.
                  if (file) {
                    patch({ dataFile: file, datasetId: null });
                    setPreview(null);
                  }
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
