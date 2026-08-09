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

/** Строка итоговой таблицы — одна метрика. */
export interface ResultRow {
  metric: string;
  isPrimary: boolean;
  controlGroup: string | null;
  treatmentGroup: string | null;
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
}

export interface TestResults {
  rows: ResultRow[];
  checks: CheckResult[];
  verdict: Verdict | null;
  /** Короткая сводка для колонки "Результаты" в All Tests. */
  short: string;
  srmDetected: boolean;
  correctionApplied: string | null;
  powerVerdict: string | null;
  timelineWarnings: string[];
  guardrailViolations: string[];
  raw?: Record<string, unknown> | null;
}

/** Plotly-спека графика с бэкенда. */
export interface Chart {
  kind: string;
  title: string;
  data: unknown[];
  layout: Record<string, unknown>;
}

/** Вариант обработки, предложенный агентом в HITL-паузе. */
export interface InterruptOption {
  method: string;
  params: Record<string, unknown>;
  n_affected: number;
  share_affected: number;
}

export interface PendingInterrupt {
  kind: string;
  metric_col?: string;
  outlier_share?: number;
  options?: InterruptOption[];
  recommendation?: string;
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

/** Прогресс анализа: шаги пайплайна и те, что уже отработали. */
export interface RunProgress {
  steps: string[];
  done: string[];
}
