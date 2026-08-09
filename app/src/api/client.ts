import type {
  ABTest,
  ChatMessage,
  CompanyDoc,
  NewTestDraft,
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

interface TestDto {
  id: string;
  name: string;
  hypothesis: string;
  status: ABTest['status'];
  decision: string;
  date: string;
  dataset_id: string | null;
  results: TestResults | null;
  pending_interrupt: ABTest['pendingInterrupt'];
  error: string | null;
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
    results: dto.results,
    pendingInterrupt: dto.pending_interrupt,
    error: dto.error,
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
  const dataset = draft.dataFile ? await uploadDataset(draft.dataFile) : null;
  const dto = await postJson<TestDto>('/tests', {
    name: draft.name,
    hypothesis: draft.hypothesis,
    test_type: draft.testType,
    groups: draft.groups,
    tracker: draft.tracker,
    segment: draft.segment,
    start_date: draft.startDate,
    end_date: draft.endDate,
    dataset_id: dataset?.dataset_id ?? null,
  });
  return toTest(dto);
}

/* -------------------------------------------------------------- messages */

interface MessageDto {
  id: string;
  role: 'agent' | 'user';
  author: string;
  text: string;
  initials: string | null;
  results: TestResults | null;
}

function toMessage(dto: MessageDto): ChatMessage {
  return {
    id: dto.id,
    role: dto.role,
    author: dto.author,
    text: dto.text,
    initials: dto.initials ?? undefined,
    results: dto.results ?? undefined,
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

/* ------------------------------------------------------ team / onboarding */

export async function fetchTeam(): Promise<TeamMember[]> {
  return request<TeamMember[]>('/team');
}

export async function inviteMember(email: string, role: Role): Promise<TeamMember> {
  return postJson<TeamMember>('/team', { email, role });
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

export async function draftCompanyContext(intake: OnboardingIntake): Promise<string> {
  const body = await postJson<{ content: string }>('/onboarding/draft', intake);
  return body.content;
}

export async function confirmCompanyContext(content: string): Promise<void> {
  await postJson<{ content: string }>('/onboarding/confirm', { content });
}
