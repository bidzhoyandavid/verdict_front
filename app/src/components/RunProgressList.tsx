import { useStore } from '../storeContext';
import { GRADIENT } from '../theme';
import type { RunProgress } from '../types';

const STEP_LABELS: Record<string, string> = {
  load: 'Загрузка данных',
  validate_profile: 'Валидация и профиль метрики',
  assumption_checks: 'Проверка предпосылок и ковариат',
  timeline_check: 'Проверка временной шкалы',
  outlier_review: 'Обработка выбросов',
  srm_gate: 'Проверка SRM',
  test_selector: 'Выбор стат-критерия',
  stat_test: 'Статистические тесты по метрикам',
  ratio_metrics: 'Ratio-метрики',
  multiple_testing: 'Поправка на множественные сравнения',
  guardrail: 'Guardrail-метрики',
  power_check: 'Расчёт мощности',
  charts: 'Построение графиков',
  report_table: 'Сборка итоговой таблицы',
  checks_summary: 'Сводка проверок',
  verdict: 'Вывод и рекомендация',
  insight: 'Выводы',
};

/**
 * Чеклист шагов пайплайна вместо безликого спиннера: анализ идёт минуты,
 * и видеть, где он сейчас, важнее, чем видеть, что он «идёт».
 */
export function RunProgressList({ progress }: { progress: RunProgress }) {
  const { c } = useStore();
  if (progress.steps.length === 0) return null;

  const currentIndex = progress.done.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {progress.steps.map((step, index) => {
        const isDone = progress.done.includes(step);
        const isCurrent = index === currentIndex;
        return (
          <div
            key={step}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              fontSize: 13,
              color: isDone || isCurrent ? c.textPrimary : c.textSecondary,
              opacity: isDone || isCurrent ? 1 : 0.5,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                flexShrink: 0,
                background: isDone ? c.success : isCurrent ? GRADIENT : c.surface,
                border: isDone || isCurrent ? 'none' : `1px solid ${c.border}`,
                animation: isCurrent ? 'pulseGlow 1.6s ease-in-out infinite' : undefined,
              }}
            />
            {STEP_LABELS[step] ?? step}
          </div>
        );
      })}
    </div>
  );
}
