import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as api from './api/client';
import { useTestStream } from './api/useTestStream';
import { makeStyles, palettes, type ThemeName } from './theme';
import { StoreContext, type Store } from './storeContext';
import type {
  ABTest,
  AuthMode,
  ChatMessage,
  CompanyDoc,
  NewTestDraft,
  Role,
  Screen,
  SettingsTab,
  TeamMember,
  User,
} from './types';

function errorText(error: unknown): string {
  if (error instanceof api.ApiError) return error.message;
  // fetch бросает TypeError, когда бэкенд просто не поднят — самая частая
  // ошибка на локальной разработке, отдельно про это и пишем.
  return 'Не удалось связаться с сервером';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light');
  const [screen, setScreen] = useState<Screen>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newTestModalOpen, setNewTestModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [companyDocs, setCompanyDocs] = useState<CompanyDoc[]>([]);

  const c = palettes[theme];
  const s = useMemo(() => makeStyles(c), [c]);

  const inApp = screen === 'main' || screen === 'all-tests' || screen === 'settings';
  const currentTest = tests.find((t) => t.id === currentTestId);

  // Восстановление сессии: токен переживает перезагрузку страницы.
  useEffect(() => {
    if (!api.getToken()) return;
    void api
      .fetchCurrentUser()
      .then((me) => {
        setUser(me);
        setScreen(me.onboarded ? 'main' : 'onboard-form');
      })
      .catch(() => api.logout());
  }, []);

  const reloadTests = useCallback(async () => {
    const rows = await api.fetchTests();
    setTests(rows);
  }, []);

  useEffect(() => {
    if (!inApp || !user) return;
    void reloadTests();
  }, [inApp, user, reloadTests]);

  useEffect(() => {
    if (screen !== 'settings') return;
    void api.fetchTeam().then(setTeam);
    void api.fetchCompanyDocs().then(setCompanyDocs);
  }, [screen]);

  // История чата перечитывается при смене теста; дальше сообщения приходят
  // по стриму и дописываются точечно.
  useEffect(() => {
    if (!currentTestId) {
      setMessages([]);
      return;
    }
    let stale = false;
    void api.fetchMessages(currentTestId).then((rows) => {
      if (!stale) setMessages(rows);
    });
    return () => {
      stale = true;
    };
  }, [currentTestId]);

  const patchTest = useCallback((test: ABTest) => {
    setTests((prev) => prev.map((t) => (t.id === test.id ? test : t)));
  }, []);

  // Каждый вызов получает свой номер: `state` и `run.started` прилетают
  // подряд, ответы на них возвращаются в произвольном порядке, и без этого
  // более старый ответ мог затереть более свежий.
  const refreshSeq = useRef(0);
  const refreshTimer = useRef<number | null>(null);

  // Историю перечитываем вместе с тестом: подписка на SSE может подняться
  // уже после того, как быстрый run закончился, и его сообщения иначе
  // не долетят до перезагрузки страницы.
  const refreshCurrentTest = useCallback(() => {
    if (!currentTestId) return;

    // События идут пачками (state + run.started, resume + interrupt), а
    // перезапрос тянет тест и всю историю целиком — склеиваем пачку в один.
    if (refreshTimer.current !== null) window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null;
      const seq = ++refreshSeq.current;
      const fresh = () => seq === refreshSeq.current;

      void api.fetchTest(currentTestId).then((test) => {
        if (fresh()) patchTest(test);
      });
      void api.fetchMessages(currentTestId).then((rows) => {
        if (!fresh()) return;
        setAwaitingReply(false);
        setMessages(rows);
      });
    }, 60);
  }, [currentTestId, patchTest]);

  // Смена теста отменяет перезапрос предыдущего — иначе его ответ приедет
  // в уже открытый чужой тест.
  useEffect(() => {
    refreshSeq.current += 1;
    return () => {
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
    };
  }, [currentTestId]);

  const appendMessage = useCallback((message: ChatMessage) => {
    setAwaitingReply(false);
    setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  const progress = useTestStream(currentTestId, {
    onMessage: appendMessage,
    onTestChanged: refreshCurrentTest,
  });

  const goScreen = useCallback((next: Screen) => {
    setScreen(next);
    setProfileMenuOpen(false);
  }, []);

  const submitAuth = useCallback(
    async (email: string, password: string, company: string) => {
      setAuthBusy(true);
      setAuthError(null);
      try {
        const me =
          authMode === 'signup'
            ? await api.signup(email, password, company)
            : await api.login(email, password);
        setUser(me);
        setScreen(authMode === 'signup' || !me.onboarded ? 'onboard-form' : 'main');
      } catch (error) {
        setAuthError(errorText(error));
      } finally {
        setAuthBusy(false);
      }
    },
    [authMode],
  );

  const signOut = useCallback(() => {
    api.logout();
    setUser(null);
    setTests([]);
    setCurrentTestId(null);
    setMessages([]);
    setScreen('auth');
    setProfileMenuOpen(false);
  }, []);

  const selectTest = useCallback((id: string) => {
    setCurrentTestId(id);
    setScreen('main');
  }, []);

  const createTest = useCallback(async (draft: NewTestDraft) => {
    const test = await api.createTest(draft);
    setTests((prev) => [test, ...prev]);
    setCurrentTestId(test.id);
    setScreen('main');
    setNewTestModalOpen(false);
  }, []);

  const renameTest = useCallback(async (id: string, name: string) => {
    const test = await api.renameTest(id, name);
    setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, name: test.name } : t)));
  }, []);

  const deleteTest = useCallback(
    async (id: string) => {
      await api.deleteTest(id);
      setTests((prev) => prev.filter((t) => t.id !== id));
      // Открытый тест исчез — чат показывать нечего, уводим на список.
      if (currentTestId === id) {
        setCurrentTestId(null);
        setMessages([]);
        setScreen('all-tests');
      }
    },
    [currentTestId],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!currentTestId || !user) return;
      setAwaitingReply(true);
      try {
        const own = await api.sendChatMessage(currentTestId, text);
        setMessages((prev) => [...prev, own]);
        refreshCurrentTest();
      } catch (error) {
        setAwaitingReply(false);
        appendMessage({
          id: `err-${Date.now()}`,
          role: 'agent',
          author: 'Verdict AI',
          text: errorText(error),
        });
      }
    },
    [appendMessage, currentTestId, refreshCurrentTest, user],
  );

  /** Ответ на HITL-паузу — выбранный вариант обработки. */
  const answerInterrupt = useCallback(
    async (decision: Record<string, unknown>) => {
      if (!currentTestId) return;
      await api.resumeTest(currentTestId, decision);
      refreshCurrentTest();
    },
    [currentTestId, refreshCurrentTest],
  );

  const invite = useCallback(async (email: string, role: Role) => {
    const member = await api.inviteMember(email, role);
    setTeam((prev) => [...prev, member]);
  }, []);

  const completeOnboarding = useCallback(
    async (mdFile: File | null) => {
      if (mdFile) await api.uploadCompanyDoc(mdFile);
      if (user) setUser({ ...user, onboarded: true });
    },
    [user],
  );

  const value: Store = {
    theme,
    c,
    s,
    setTheme,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    screen,
    goScreen,
    authMode,
    setAuthMode,
    submitAuth,
    authError,
    authBusy,
    user,
    signOut,
    tests,
    currentTestId,
    currentTest,
    selectTest,
    createTest,
    renameTest,
    deleteTest,
    messages,
    sendMessage,
    awaitingReply,
    progress,
    answerInterrupt,
    completeOnboarding,
    sidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed((v) => !v),
    profileMenuOpen,
    setProfileMenuOpen,
    newTestModalOpen,
    setNewTestModalOpen,
    inviteModalOpen,
    setInviteModalOpen,
    settingsTab,
    setSettingsTab,
    team,
    invite,
    companyDocs,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
