import type {
  Evidence,
  ABTest,
  AnsweredInterrupt,
  Chart,
  CheckResult,
  ChatMessage,
  CompanyDoc,
  CompanyMetric,
  Permission,
  MethodSummaryGroup,
  NewTestDraft,
  ResultRow,
  Role,
  TeamMember,
  TestResults,
  User,
} from '../types';

/**
 * Единственный слой, знающий про HTTP. Формы данных подогнаны под types.ts,
 * поэтому экраны про сеть ничего не знают.
 */

const BASE_URL: string = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
const TOKEN_KEY = 'verdict.token';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });

  if (!response.ok) {
    // FastAPI кладёт человекочитаемую причину в detail; валидационные ошибки —
    // массивом, их разворачивать смысла нет, показываем статус.
    let message = response.statusText;
    try {
      const body = await response.json();
      if (typeof body.detail === 'string') message = body.detail;
    } catch {
      /* тело не JSON — оставляем statusText */
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ auth */

interface UserDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  permission?: Permission;
  team_id?: string | null;
  initials: string;
  company_id: string;
  onboarded: boolean;
}

interface TokenDto {
  access_token: string;
  user: UserDto;
}

function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    permission: dto.permission ?? 'member',
    teamId: dto.team_id ?? null,
    initials: dto.initials,
    companyId: dto.company_id,
    onboarded: dto.onboarded,
  };
}

export async function signup(
  email: string,
  password: string,
  company: string,
  name = '',
): Promise<User> {
  const dto = await postJson<TokenDto>('/auth/signup', { email, password, company, name });
  setToken(dto.access_token);
  return toUser(dto.user);
}

export async function login(email: string, password: string): Promise<User> {
  const dto = await postJson<TokenDto>('/auth/login', { email, password });
  setToken(dto.access_token);
  return toUser(dto.user);
}

export function logout(): void {
  setToken(null);
}

export async function fetchCurrentUser(): Promise<User> {
  return toUser(await request<UserDto>('/auth/me'));
}

/* ----------------------------------------------------------------- tests */

interface ResultRowDto {
  metric: string;
  is_primary: boolean;
  control_group: string | null;
  treatment_group: string | null;
  comparison: string | null;
  comparison_mode: string | null;
  control_value: number | null;
  treatment_value: number | null;
  n_control: number | null;
  n_treatment: number | null;
  absolute_diff: number | null;
  relative_diff: number | null;
  p_value: number | null;
  adjusted_p_value: number | null;
  ci_low: number | null;
  ci_high: number | null;
  relative_ci_low: number | null;
  relative_ci_high: number | null;
  significant: boolean | null;
  method: string | null;
  estimand: string | null;
  estimand_label: string | null;
  how: string | null;
  warnings: string[];
}

interface EvidenceDto {
  effect: {
    metric: string | null;
    relative_diff: number | null;
    relative_ci_low: number | null;
    relative_ci_high: number | null;
    estimand_label: string | null;
    method: string | null;
    significant: boolean | null;
  } | null;
  confidence: {
    sample: {
      n_control: number | null;
      n_treatment: number | null;
      control_group: string | null;
      treatment_group: string | null;
    } | null;
    checks: {
      total: number;
      ok: number;
      warning: number;
      failed: number;
      skipped: number;
      failed_names: string[];
      warning_names: string[];
    };
    correction: {
      method: string;
      tests: number;
      significant_before: number;
      significant_after: number;
      lost: string[];
      lost_total: number;
    } | null;
    srm: { detected: boolean; override: boolean };
  };
  power: {
    conclusion: string;
    n_per_group_now: number | null;
    n_per_group_needed: number | null;
    extra_observations: number | null;
    days_left: number | null;
  } | null;
  guardrails: {
    watched: string[];
    violations: {
      metric: string;
      label: string;
      comparison: string;
      relative_diff: number | null;
      p_value: number | null;
    }[];
  } | null;
  limits: string[];
}

interface VerdictDto {
  code: string;
  label: string;
  action: string;
  options?: { action: string; why: string; recommended: boolean }[];
  metric: string | null;
  comparison?: string | null;
  comparison_mode?: string | null;
  control_group?: string | null;
  treatment_group?: string | null;
  significant?: boolean | null;
  relative_diff: number | null;
  relative_ci_low: number | null;
  relative_ci_high: number | null;
  p_value: number | null;
  blocking_checks: string[];
  caveats: string[];
  srm_override: boolean;
  srm_segment_failures: { column: string; levels: string[] }[];
  method_notes: string[];
  method_summary?: MethodSummaryGroup[];
  narrative?: string;
  evidence?: EvidenceDto | null;
}

/** snake_case с бэкенда → camelCase. Старый прогон приходит без блока — null. */
function toEvidence(dto: EvidenceDto | null | undefined): Evidence | null {
  if (!dto) return null;
  const checks = dto.confidence?.checks;
  const correction = dto.confidence?.correction;
  const sample = dto.confidence?.sample;
  const power = dto.power;
  return {
    effect: dto.effect
      ? {
          metric: dto.effect.metric,
          relativeDiff: dto.effect.relative_diff,
          relativeCiLow: dto.effect.relative_ci_low,
          relativeCiHigh: dto.effect.relative_ci_high,
          estimandLabel: dto.effect.estimand_label,
          method: dto.effect.method,
          significant: dto.effect.significant,
        }
      : null,
    confidence: {
      sample: sample
        ? {
            nControl: sample.n_control,
            nTreatment: sample.n_treatment,
            controlGroup: sample.control_group,
            treatmentGroup: sample.treatment_group,
          }
        : null,
      checks: {
        total: checks?.total ?? 0,
        ok: checks?.ok ?? 0,
        warning: checks?.warning ?? 0,
        failed: checks?.failed ?? 0,
        skipped: checks?.skipped ?? 0,
        failedNames: checks?.failed_names ?? [],
        warningNames: checks?.warning_names ?? [],
      },
      correction: correction
        ? {
            method: correction.method,
            tests: correction.tests,
            significantBefore: correction.significant_before,
            significantAfter: correction.significant_after,
            lost: correction.lost ?? [],
            lostTotal: correction.lost_total ?? 0,
          }
        : null,
      srm: {
        detected: dto.confidence?.srm?.detected ?? false,
        override: dto.confidence?.srm?.override ?? false,
      },
    },
    power: power
      ? {
          conclusion: power.conclusion,
          nPerGroupNow: power.n_per_group_now,
          nPerGroupNeeded: power.n_per_group_needed,
          extraObservations: power.extra_observations,
          daysLeft: power.days_left,
        }
      : null,
    guardrails: dto.guardrails
      ? {
          watched: dto.guardrails.watched ?? [],
          violations: (dto.guardrails.violations ?? []).map((v) => ({
            metric: v.metric,
            label: v.label,
            comparison: v.comparison,
            relativeDiff: v.relative_diff,
            pValue: v.p_value,
          })),
        }
      : null,
    limits: dto.limits ?? [],
  };
}

interface SegmentResultsDto {
  label: string;
  fields: Record<string, string>;
  n_rows: number;
  rows: ResultRowDto[];
}

interface TestResultsDto {
  rows: ResultRowDto[];
  checks: CheckResult[];
  verdict: VerdictDto | null;
  short: string;
  srm_detected: boolean;
  srm_override: boolean;
  correction_applied: string | null;
  power_verdict: string | null;
  timeline_warnings: string[];
  guardrail_violations: string[];
  segments: SegmentResultsDto[];
  raw: Record<string, unknown> | null;
}

interface TestDto {
  id: string;
  name: string;
  hypothesis: string;
  status: ABTest['status'];
  decision: string;
  date: string;
  dataset_id: string | null;
  results: TestResultsDto | null;
  charts: Chart[] | null;
  pending_interrupt: ABTest['pendingInterrupt'];
  error: string | null;
  team_id?: string | null;
  team_name?: string;
  read_only?: boolean;
}

function toRow(dto: ResultRowDto): ResultRow {
  return {
    metric: dto.metric,
    isPrimary: dto.is_primary,
    controlGroup: dto.control_group,
    treatmentGroup: dto.treatment_group,
    comparison: dto.comparison ?? `${dto.treatment_group} vs ${dto.control_group}`,
    comparisonMode: dto.comparison_mode ?? null,
    controlValue: dto.control_value,
    treatmentValue: dto.treatment_value,
    nControl: dto.n_control,
    nTreatment: dto.n_treatment,
    absoluteDiff: dto.absolute_diff,
    relativeDiff: dto.relative_diff,
    pValue: dto.p_value,
    adjustedPValue: dto.adjusted_p_value,
    ciLow: dto.ci_low,
    ciHigh: dto.ci_high,
    relativeCiLow: dto.relative_ci_low ?? null,
    relativeCiHigh: dto.relative_ci_high ?? null,
    significant: dto.significant,
    method: dto.method,
    estimand: dto.estimand ?? null,
    estimandLabel: dto.estimand_label ?? null,
    how: dto.how ?? null,
    warnings: dto.warnings ?? [],
  };
}

function toResults(dto: TestResultsDto | null): TestResults | null {
  if (!dto) return null;
  return {
    rows: (dto.rows ?? []).map(toRow),
    checks: dto.checks ?? [],
    verdict: dto.verdict
      ? {
          code: dto.verdict.code,
          label: dto.verdict.label,
          action: dto.verdict.action,
          options: dto.verdict.options ?? [],
          metric: dto.verdict.metric,
          comparison: dto.verdict.comparison ?? null,
          comparisonMode: dto.verdict.comparison_mode ?? null,
          controlGroup: dto.verdict.control_group ?? null,
          treatmentGroup: dto.verdict.treatment_group ?? null,
          significant: dto.verdict.significant ?? null,
          relativeDiff: dto.verdict.relative_diff,
          relativeCiLow: dto.verdict.relative_ci_low ?? null,
          relativeCiHigh: dto.verdict.relative_ci_high ?? null,
          pValue: dto.verdict.p_value,
          narrative: dto.verdict.narrative ?? '',
          evidence: toEvidence(dto.verdict.evidence),
          blockingChecks: dto.verdict.blocking_checks ?? [],
          caveats: dto.verdict.caveats ?? [],
          srmOverride: dto.verdict.srm_override ?? false,
          srmSegmentFailures: dto.verdict.srm_segment_failures ?? [],
          methodNotes: dto.verdict.method_notes ?? [],
          methodSummary: dto.verdict.method_summary ?? [],
        }
      : null,
    short: dto.short,
    srmDetected: dto.srm_detected,
    srmOverride: dto.srm_override ?? false,
    correctionApplied: dto.correction_applied,
    powerVerdict: dto.power_verdict,
    timelineWarnings: dto.timeline_warnings ?? [],
    guardrailViolations: dto.guardrail_violations ?? [],
    segments: (dto.segments ?? []).map((seg) => ({
      label: seg.label,
      fields: seg.fields ?? {},
      nRows: seg.n_rows,
      rows: (seg.rows ?? []).map(toRow),
    })),
    raw: dto.raw,
  };
}

export function toTest(dto: TestDto): ABTest {
  return {
    id: dto.id,
    name: dto.name,
    hypothesis: dto.hypothesis,
    status: dto.status,
    decision: dto.decision,
    date: dto.date,
    datasetId: dto.dataset_id,
    results: toResults(dto.results),
    charts: dto.charts,
    pendingInterrupt: dto.pending_interrupt,
    error: dto.error,
    teamId: dto.team_id ?? null,
    teamName: dto.team_name ?? '',
    readOnly: dto.read_only ?? false,
  };
}

export async function fetchTests(): Promise<ABTest[]> {
  return (await request<TestDto[]>('/tests')).map(toTest);
}

export async function fetchTest(testId: string): Promise<ABTest> {
  return toTest(await request<TestDto>(`/tests/${testId}`));
}

export interface DatasetInfo {
  dataset_id: string;
  n_rows: number;
  columns: string[];
}

export async function uploadDataset(file: File): Promise<DatasetInfo> {
  const form = new FormData();
  form.append('file', file);
  return request<DatasetInfo>('/files/datasets', { method: 'POST', body: form });
}

export async function createTest(draft: NewTestDraft): Promise<ABTest> {
  // Датасет заливается первым: без него бэкенд создаст тест, но не запустит анализ.
  // Если его уже залили ради превью формул, второй раз не грузим.
  const datasetId =
    draft.datasetId ?? (draft.dataFile ? (await uploadDataset(draft.dataFile)).dataset_id : null);
  const dto = await postJson<TestDto>('/tests', {
    name: draft.name,
    hypothesis: draft.hypothesis,
    test_type: draft.testType,
    groups: draft.groups,
    tracker: draft.tracker,
    segment: draft.segment,
    start_date: draft.startDate,
    end_date: draft.endDate,
    dataset_id: datasetId,
    derived_columns: draft.derivedColumns.filter((c) => c.name.trim() && c.expression.trim()),
    derived_unit: draft.derivedUnit,
  });
  return toTest(dto);
}

export async function renameTest(testId: string, name: string): Promise<ABTest> {
  return toTest(
    await request<TestDto>(`/tests/${testId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),
  );
}

export async function deleteTest(testId: string): Promise<void> {
  await request<void>(`/tests/${testId}`, { method: 'DELETE' });
}

/* -------------------------------------------------------------- messages */

interface MessageDto {
  id: string;
  role: 'agent' | 'user';
  author: string;
  text: string;
  initials: string | null;
  results: TestResultsDto | null;
  interrupt: AnsweredInterrupt | null;
}

function toMessage(dto: MessageDto): ChatMessage {
  return {
    id: dto.id,
    role: dto.role,
    author: dto.author,
    text: dto.text,
    initials: dto.initials ?? undefined,
    results: toResults(dto.results) ?? undefined,
    answeredInterrupt: dto.interrupt ?? undefined,
  };
}

export async function fetchMessages(testId: string): Promise<ChatMessage[]> {
  return (await request<MessageDto[]>(`/tests/${testId}/messages`)).map(toMessage);
}

export async function sendChatMessage(testId: string, text: string): Promise<ChatMessage> {
  return toMessage(await postJson<MessageDto>(`/tests/${testId}/messages`, { text }));
}

/** Ответ на HITL-паузу: агент продолжит с этого места. */
export async function resumeTest(testId: string, decision: Record<string, unknown>): Promise<void> {
  await postJson<{ status: string }>(`/tests/${testId}/resume`, { decision });
}

/** URL для EventSource: заголовки он слать не умеет, токен идёт параметром. */
export function streamUrl(testId: string): string {
  return `${BASE_URL}/tests/${testId}/stream?token=${encodeURIComponent(getToken() ?? '')}`;
}

export interface DerivedColumnReport {
  name: string;
  status: 'ok' | 'failed';
  detail: string;
  aggregatedBy?: string;
  nNull?: number;
  /** Что человек написал, если агент это переписал. */
  written?: string;
  /** Формула, которой считали. */
  expression?: string;
  note?: string;
}

export interface DerivedPreview {
  /** Юнит, по которому считали: мог быть угадан, а не введён. */
  unit: string;
  columns: DerivedColumnReport[];
  rows: Record<string, number | string | null>[];
}

interface DerivedReportDto {
  name: string;
  status: 'ok' | 'failed';
  detail?: string;
  aggregated_by?: string;
  n_null?: number;
  written?: string;
  expression?: string;
  note?: string;
}

/** Посчитать формулы на залитых данных и показать несколько строк. */
export async function previewDerived(
  datasetId: string,
  columns: { name: string; expression: string }[],
  unit: string,
): Promise<DerivedPreview> {
  const dto = await postJson<{
    unit?: string;
    columns: DerivedReportDto[];
    rows: Record<string, number | string | null>[];
  }>(`/files/datasets/${datasetId}/derived-preview`, { columns, unit });
  return {
    unit: dto.unit ?? '',
    columns: dto.columns.map((row) => ({
      name: row.name,
      status: row.status,
      detail: row.detail ?? '',
      aggregatedBy: row.aggregated_by,
      nNull: row.n_null,
      written: row.written,
      expression: row.expression,
      note: row.note,
    })),
    rows: dto.rows,
  };
}

export interface TestOverlap {
  testId: string;
  name: string;
  team: string;
  audience: string;
  start: string | null;
  end: string | null;
  days: number;
  sameAudience: boolean;
}

interface TestOverlapDto {
  test_id: string;
  name: string;
  team: string;
  audience: string;
  start: string | null;
  end: string | null;
  days: number;
  same_audience: boolean;
}

/** Какие тесты уже идут в это окно — спрашивается, пока даты ещё правят. */
export async function fetchOverlaps(
  startDate: string,
  endDate: string,
  audience: string,
): Promise<TestOverlap[]> {
  const rows = await postJson<TestOverlapDto[]>('/tests/overlaps', {
    start_date: startDate,
    end_date: endDate,
    audience,
  });
  return rows.map((row) => ({
    testId: row.test_id,
    name: row.name,
    team: row.team,
    audience: row.audience,
    start: row.start,
    end: row.end,
    days: row.days,
    sameAudience: row.same_audience,
  }));
}

/* ------------------------------------------------------ team / onboarding */

export async function fetchTeam(): Promise<TeamMember[]> {
  return request<TeamMember[]>('/team');
}

export async function inviteMember(email: string, role: Role): Promise<TeamMember> {
  return postJson<TeamMember>('/team', { email, role });
}

export async function fetchCompanyMetrics(): Promise<CompanyMetric[]> {
  return request<CompanyMetric[]>('/metrics');
}

export async function addCompanyMetric(
  name: string,
  aliases: string[],
  description: string,
): Promise<CompanyMetric> {
  return postJson<CompanyMetric>('/metrics', { name, aliases, description });
}

export async function deleteCompanyMetric(metricId: string): Promise<void> {
  await request<void>(`/metrics/${metricId}`, { method: 'DELETE' });
}

export async function fetchCompanyDocs(): Promise<CompanyDoc[]> {
  return request<CompanyDoc[]>('/files/company-doc');
}

export async function uploadCompanyDoc(file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  await request('/files/company-doc', { method: 'POST', body: form });
}

export interface OnboardingIntake {
  product_description: string;
  business_model: string;
  key_metrics: string;
  chat_notes: string[];
}

export interface OnboardingQuestion {
  id: string;
  section: string;
  text: string;
  kind: 'open' | 'confirm';
  options: string[];
}

/** Brief plus what is still unfilled and what the agent wants to ask. */
export interface OnboardingReview {
  content: string;
  missing: string[];
  questions: OnboardingQuestion[];
}

export async function draftCompanyContext(intake: OnboardingIntake): Promise<OnboardingReview> {
  return postJson<OnboardingReview>('/onboarding/draft', intake);
}

/** Blank template the company fills in by hand instead of doing the interview. */
export async function fetchContextTemplate(): Promise<string> {
  const body = await request<{ content: string }>('/onboarding/template');
  return body.content;
}

/** Normalise a hand-filled brief and get back the gaps + questions. */
export async function reviewCompanyContext(content: string): Promise<OnboardingReview> {
  return postJson<OnboardingReview>('/onboarding/review', { content });
}

export async function fetchCurrentCompanyContext(): Promise<OnboardingReview> {
  return request<OnboardingReview>('/onboarding/current');
}

export async function answerOnboardingQuestions(
  content: string,
  answers: Record<string, string>,
): Promise<OnboardingReview> {
  return postJson<OnboardingReview>('/onboarding/answers', { content, answers });
}

export async function confirmCompanyContext(content: string): Promise<void> {
  await postJson<{ content: string }>('/onboarding/confirm', { content });
}
