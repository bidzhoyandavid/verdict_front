export type Screen = 'auth' | 'onboard-form' | 'onboard-chat' | 'main' | 'all-tests' | 'settings';

export type AuthMode = 'signin' | 'signup';

export type TestStatus = 'queued' | 'analyzing' | 'done' | 'failed';

export type SettingsTab = 'profile' | 'company' | 'team' | 'theme' | 'roles';

export type Role = 'Admin' | 'Analyst' | 'Product' | 'Marketer' | 'Other';

export interface GroupResult {
  group: string;
  conversion: string;
  delta: string;
  /** Подсветка зелёным — значимый положительный результат. */
  good?: boolean;
}

export interface TestResults {
  groups: GroupResult[];
  /** Короткая сводка для колонки "Результаты" в All Tests. */
  short: string;
}

export interface ABTest {
  id: string;
  name: string;
  hypothesis: string;
  status: TestStatus;
  decision: string;
  date: string;
  results?: TestResults;
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
  dataFileName: string | null;
}

export interface OnboardDraft {
  name: string;
  role: Role;
  company: string;
  goals: string[];
  mdFileName: string | null;
}

export interface User {
  name: string;
  email: string;
  role: Role;
  initials: string;
}
