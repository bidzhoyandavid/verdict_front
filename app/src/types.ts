export type Screen = 'auth' | 'onboard-form' | 'onboard-chat' | 'main' | 'all-tests' | 'settings';

export type AuthMode = 'signin' | 'signup';

/**
 * `awaiting_input` — граф встал на HITL-паузе, ответ идёт через кнопки.
 * `clarifying` — агент задал уточняющий вопрос в чате, ответ идёт текстом.
 */
export type TestStatus =
  | 'queued'
  | 'analyzing'
  | 'awaiting_input'
  | 'clarifying'
  | 'done'
  | 'failed';

export type SettingsTab = 'profile' | 'company' | 'team' | 'theme' | 'roles';

export type Role = 'Admin' | 'Analyst' | 'Product' | 'Marketer' | 'Other';

/** Строка итоговой таблицы — метрика в одном сравнении групп. При трёх и
 *  более ветках у метрики таких строк несколько. */
export interface ResultRow {
  metric: string;
  isPrimary: boolean;
  controlGroup: string | null;
  treatmentGroup: string | null;
  /** «variant_a vs control» — какая пара сравнивалась в этой строке. */
  comparison: string;
  /** 'omnibus' — строка про все ветки сразу: пары и размера эффекта у неё нет. */
  comparisonMode: string | null;
  controlValue: number | null;
  treatmentValue: number | null;
  nControl: number | null;
  nTreatment: number | null;
  absoluteDiff: number | null;
  relativeDiff: number | null;
  pValue: number | null;
  /** p-value после поправки на множественные сравнения, если она применялась. */
  adjustedPValue: number | null;
  ciLow: number | null;
  ciHigh: number | null;
  significant: boolean | null;
  method: string | null;
  warnings: string[];
}

export type CheckStatus = 'ok' | 'warning' | 'failed' | 'skipped';

export interface CheckResult {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface Verdict {
  code: string;
  label: string;
  action: string;
  metric: string | null;
  relativeDiff: number | null;
  pValue: number | null;
  blockingChecks: string[];
  caveats: string[];
  /** Расчёты сделаны поверх обнаруженного SRM по явному запросу аналитика. */
  srmOverride: boolean;
  /** Срезы, внутри которых нашёлся перекос при корректном общем сплите. */
  srmSegmentFailures: { column: string; levels: string[] }[];
}

/** Тот же results_table, посчитанный внутри одного сегмента аудитории. */
export interface SegmentResults {
  label: string;
  fields: Record<string, string>;
  nRows: number;
  rows: ResultRow[];
}

export interface TestResults {
  rows: ResultRow[];
  checks: CheckResult[];
  verdict: Verdict | null;
  /** Короткая сводка для колонки "Результаты" в All Tests. */
  short: string;
  srmDetected: boolean;
  srmOverride: boolean;
  correctionApplied: string | null;
  powerVerdict: string | null;
  timelineWarnings: string[];
  guardrailViolations: string[];
  /** Пусто, если гетерогенность по сегментам не запрашивалась. */
  segments: SegmentResults[];
  raw?: Record<string, unknown> | null;
}

/** Plotly-спека графика с бэкенда. */
export interface Chart {
  kind: string;
  title: string;
  data: unknown[];
  layout: Record<string, unknown>;
  /** Подсказка лейаута от агента: на всю ширину или в половину строки. */
  span?: 'full' | 'half';
  /** Высота в px, если графику нужна нестандартная (растёт с числом метрик). */
  height?: number;
}

/** Вариант обработки, предложенный агентом в HITL-паузе. */
export interface InterruptOption {
  method: string;
  params: Record<string, unknown>;
  n_affected: number;
  /** Есть у обработки выбросов; у null-обработки доля не определена. */
  share_affected?: number;
  label?: string;
  /** Чем этот вариант плох или хорош — показываем рядом с кнопкой. */
  note?: string;
}

/** Статистика пропусков, которую агент показывает перед вопросом. */
export interface NullStats {
  n_rows: number;
  per_column: { column: string; n_null: number; share: number; role: string }[];
  metric_by_group: { group: string; n_rows: number; n_null: number; share: number }[];
  group_skew: number;
  key_columns_affected: string[];
  max_share: number;
}

/** Строка распределения по группам: сколько единиц и сколько ожидалось. */
export interface SrmAllocationRow {
  group: string;
  observed: number;
  observed_share: number;
  expected: number;
  expected_share: number;
  diff: number;
  relative_diff: number | null;
}

/** Колонка-кандидат в сегменты с её реальной разбивкой. */
export interface SegmentCandidate {
  column: string;
  n_levels: number;
  null_share: number;
  levels: { level: string; n_rows: number; share: number }[];
}

export interface SrmSegmentLevel {
  level: string;
  status: 'checked' | 'skipped';
  n_rows?: number;
  p_value?: number;
  has_srm?: boolean;
  observed_counts?: Record<string, number>;
  reason?: string;
}

export interface SrmSegmentResult {
  column: string;
  alpha: number;
  n_levels_tested: number;
  levels: SrmSegmentLevel[];
  failed_levels: string[];
}

export interface SrmResult {
  has_srm: boolean;
  p_value: number;
  chi2_stat: number;
  alpha: number;
  unit_col: string | null;
  counted: 'units' | 'rows';
  allocation: SrmAllocationRow[];
  segments: SrmSegmentResult[];
  failed_segments: { column: string; levels: string[] }[];
  segment_srm: boolean;
  /** Плановый сплит, заданный аналитиком; null — сравнивали с равными долями. */
  expected_split?: Record<string, number> | null;
  split_mode?: string | null;
}

/** Диагностика распределения метрики перед выбором обработки выбросов. */
export interface OutlierDiagnostics {
  n: number;
  kind: string | null;
  mean: number | null;
  median: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  skewness: number;
  kurtosis: number | null;
  zero_share: number;
  negative_share: number;
  outlier_share: number;
  n_outliers: number;
  quantiles: Record<string, number>;
  top1_share_of_sum: number | null;
  log_applicable: boolean;
}

/** Статистики метрики до и после обработки — по группе и суммарно. */
export interface OutlierComparisonRow {
  group: string;
  before: Record<string, number | null>;
  after: Record<string, number | null>;
  delta: Record<string, number | null>;
  rows_removed: number;
}

/** Колонка-кандидат на роль экспозиции в свитчбэке: сколько времени ветка
 *  реально проработала. Итоги по группам — то, на чём и строится решение. */
export interface ExposureCandidate {
  column: string;
  total: number;
  mean: number;
  null_share: number;
  totals_by_group: Record<string, number>;
}

/** Колонка-кандидат на роль единицы рандомизации, с фактами для выбора. */
export interface UnitCandidate {
  column: string;
  n_unique: number;
  rows_per_unit: number | null;
  one_row_per_value: boolean;
  null_share: number;
}

export interface PendingInterrupt {
  kind: string;
  metric_col?: string;
  outlier_share?: number;
  stats?: NullStats;
  diagnostics?: OutlierDiagnostics;
  decision?: { method: string; params?: Record<string, unknown> };
  comparison?: OutlierComparisonRow[];
  charts?: Chart[];
  /** Варианты, которые аналитик уже отклонил в этом же шаге. */
  rejected?: { method: string; params?: Record<string, unknown> }[];
  unit_col?: string | null;
  srm_result?: SrmResult;
  allocation?: SrmAllocationRow[];
  causes?: string[];
  candidates?: SegmentCandidate[];
  segments?: SrmSegmentResult[];
  failed_segments?: { column: string; levels: string[] }[];
  options?: InterruptOption[];
  recommendation?: string | null;
  report?: StepReport;
  /** srm_unit: колонки-кандидаты на единицу рандомизации. */
  unit_candidates?: UnitCandidate[];
  suggested_column?: string | null;
  /** srm_design: доля единиц, побывавших более чем в одной ветке. */
  overlap_hint?: { column: string; overlap_share: number; n_units: number } | null;
  /** srm_exposure: чем измеряется экспозиция в свитчбэке. */
  exposure_candidates?: ExposureCandidate[];
  /** Все числовые колонки датасета — из них можно выбрать свою экспозицию. */
  numeric_columns?: string[];
  /** srm_split: наблюдаемое распределение, от которого отталкивается ответ. */
  groups?: string[];
  observed_counts?: Record<string, number>;
  observed_split?: Record<string, number>;
  /** group_comparisons: размеры веток и распознанный контроль. */
  group_sizes?: Record<string, number>;
  suggested_control?: string | null;
  group_col?: string;
  /** alpha_setup: значения по умолчанию для SRM и для значимости метрик. */
  defaults?: { srm_alpha: number; metric_alpha: number };
}

/** Запись «ленты шагов»: что нода сделала, на чём и что это значит. */
export interface StepReport {
  node: string;
  title: string;
  status: 'done' | 'waiting_human' | 'skipped' | 'warning' | 'error';
  inputs: Record<string, unknown>;
  result: Record<string, unknown>;
  interpretation: string;
}

export interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  status: TestStatus;
  decision: string;
  date: string;
  datasetId?: string | null;
  results?: TestResults | null;
  charts?: Chart[] | null;
  pendingInterrupt?: PendingInterrupt | null;
  error?: string | null;
}

export interface ChatMessage {
  id: string;
  author: string;
  role: 'agent' | 'user';
  text: string;
  /** Инициалы для аватара пользователя. */
  initials?: string;
  results?: TestResults;
  /** Заданный ранее HITL-вопрос вместе с выбранным ответом — история решений. */
  answeredInterrupt?: AnsweredInterrupt;
}

export interface AnsweredInterrupt {
  payload: PendingInterrupt;
  decision: Record<string, unknown>;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CompanyDoc {
  version: string;
  filename: string;
  updatedAt: string;
}

export interface NewTestDraft {
  name: string;
  hypothesis: string;
  testType: string;
  groups: string;
  tracker: string;
  segment: string;
  startDate: string;
  endDate: string;
  dataFile: File | null;
}

export interface OnboardDraft {
  name: string;
  role: Role;
  company: string;
  goals: string[];
  mdFile: File | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  companyId: string;
  onboarded: boolean;
}

/** Шаг пайплайна, как его присылает бэкенд.
 *
 *  Список приходит целиком и сразу — включая шаги, которые не будут
 *  выполняться: проверка, о которой не сказали, читается как проверка,
 *  которую не делали. Поэтому `status` есть у каждого, а не только у
 *  отработавших. */
export interface RunStep {
  id: string;
  label: string;
  phase: string;
  status: 'pending' | 'ok' | 'warning' | 'failed' | 'skipped';
  detail: string;
}

/** Прогресс анализа: шаги пайплайна и те, что уже отработали. */
export interface RunProgress {
  steps: RunStep[];
  done: string[];
  /** Отчёты выполненных шагов, в порядке выполнения. */
  reports: StepReport[];
  /** 'answer' — агент отвечает на реплику, пайплайн не пересчитывается. */
  mode: 'analysis' | 'answer';
}
