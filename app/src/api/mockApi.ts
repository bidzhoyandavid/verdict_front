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
 * Единственный слой, который знает, что данных ещё нет.
 * Реальный backend подменяется здесь — сигнатуры менять не нужно.
 */

const LATENCY = 180;
/** Демо: сколько "анализируется" свежесозданный тест. */
export const ANALYSIS_DEMO_MS = 3500;

function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const DEMO_RESULTS: TestResults = {
  short: 'Variant +21%, p=0.02',
  groups: [
    { group: 'Control', conversion: '3.8%', delta: '—' },
    { group: 'Variant', conversion: '4.6%', delta: '+21%, p=0.02', good: true },
  ],
};

const currentUser: User = {
  name: 'Мария Иванова',
  email: 'maria@acme-commerce.io',
  role: 'Admin',
  initials: 'МИ',
};

const tests: ABTest[] = [
  {
    id: '1',
    name: 'Новая карточка товара',
    hypothesis: 'Изменение макета карточки товара увеличит конверсию в добавление в корзину',
    status: 'done',
    decision: 'Принято',
    date: '28.07.2026',
    results: DEMO_RESULTS,
  },
  {
    id: '2',
    name: 'Persistent header CTA',
    hypothesis: 'Закреплённая кнопка CTA в хедере повысит клики на оформление заказа',
    status: 'analyzing',
    decision: '—',
    date: '02.08.2026',
  },
  {
    id: '3',
    name: 'Скидка в баннере vs без',
    hypothesis: 'Показ скидки в баннере на главной увеличит средний чек',
    status: 'done',
    decision: 'Отклонено',
    date: '15.07.2026',
    results: {
      short: 'Разницы нет, p=0.41',
      groups: [
        { group: 'Control', conversion: '2.1%', delta: '—' },
        { group: 'Variant', conversion: '2.2%', delta: '+4%, p=0.41' },
      ],
    },
  },
];

const teamMembers: TeamMember[] = [
  { id: 'u1', name: 'Мария Иванова', email: 'maria@acme-commerce.io', role: 'Admin' },
  { id: 'u2', name: 'Пётр Соколов', email: 'petr@acme-commerce.io', role: 'Analyst' },
  { id: 'u3', name: 'Анна Кузнецова', email: 'anna@acme-commerce.io', role: 'Marketer' },
];

const companyDocs: CompanyDoc[] = [
  { version: 'v2', filename: 'company_v2.md', updatedAt: '12.03.2026' },
  { version: 'v1', filename: 'company_v1.md', updatedAt: '04.01.2026' },
];

export function getCurrentUser(): User {
  return currentUser;
}

export function fetchTests(): Promise<ABTest[]> {
  return delay(tests.map((t) => ({ ...t })));
}

export function fetchMessages(test: ABTest): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  if (test.hypothesis.trim()) {
    messages.push({
      id: `${test.id}-u1`,
      author: currentUser.name,
      role: 'user',
      initials: currentUser.initials,
      text: test.hypothesis,
    });
  }
  if (test.status === 'done') {
    messages.push({
      id: `${test.id}-a1`,
      author: 'Verdict AI',
      role: 'agent',
      text: 'Анализ завершён. Вариант B показал статистически значимый прирост конверсии относительно контроля.',
      results: test.results,
    });
  }
  return delay(messages);
}

export function fetchOnboardMessages(): Promise<ChatMessage[]> {
  return delay([
    {
      id: 'o1',
      author: 'Verdict AI',
      role: 'agent',
      text: 'Изучил company.md. Правильно понимаю, что основные тесты у вас — по конверсии в оформление заказа?',
    },
    {
      id: 'o2',
      author: currentUser.name,
      role: 'user',
      initials: currentUser.initials,
      text: 'Да, верно, иногда ещё смотрим средний чек.',
    },
    {
      id: 'o3',
      author: 'Verdict AI',
      role: 'agent',
      text: 'У вас маркетплейс-модель — уточните: тестируете изменения на уровне продавцов или покупателей? Важно из-за риска spillover-эффектов между сторонами рынка.',
    },
    {
      id: 'o4',
      author: currentUser.name,
      role: 'user',
      initials: currentUser.initials,
      text: 'В основном на стороне покупателей.',
    },
  ]);
}

/** Ответ агента на реплику в чате. Заглушка до подключения LLM. */
export function sendChatMessage(_testId: string, _text: string): Promise<ChatMessage> {
  return delay(
    {
      id: `a-${Date.now()}`,
      author: 'Verdict AI',
      role: 'agent',
      text: 'Принял вопрос. Отвечу, когда будет подключён backend агента.',
    } satisfies ChatMessage,
    700,
  );
}

export function createTest(draft: NewTestDraft): Promise<ABTest> {
  const now = new Date();
  const date = now.toLocaleDateString('ru-RU');
  return delay({
    id: `t-${now.getTime()}`,
    name: draft.name.trim() || 'Без названия',
    hypothesis: draft.hypothesis.trim(),
    status: 'analyzing',
    decision: '—',
    date,
  });
}

/** Демо-подмена polling/websocket: чем закончится анализ. */
export function fetchTestResults(_testId: string): Promise<Pick<ABTest, 'status' | 'decision' | 'results'>> {
  return delay({ status: 'done' as const, decision: 'На паузе', results: DEMO_RESULTS }, 0);
}

export function fetchTeam(): Promise<TeamMember[]> {
  return delay(teamMembers.map((m) => ({ ...m })));
}

export function inviteMember(email: string, role: Role): Promise<TeamMember> {
  return delay({ id: `u-${Date.now()}`, name: email.split('@')[0], email, role }, 600);
}

export function fetchCompanyDocs(): Promise<CompanyDoc[]> {
  return delay(companyDocs.map((d) => ({ ...d })));
}
