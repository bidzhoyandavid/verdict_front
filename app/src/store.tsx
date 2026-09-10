import { currentLang } from './lib/lang';
import { appDict } from './lib/appDict';
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
  return appDict[currentLang()].errors.noServer;
}

/** Куда попадает человек после входа.
 *
 *  Контекст компании — не пропуск в продукт, а способ улучшить формулировки
 *  агента, и держать за ним вход неправильно. Поэтому экран показывается
 *  ровно один раз и ровно одному человеку: владельцу, который ещё не начинал
 *  и не отказывался. Всем остальным — сразу работа. */
function landingScreen(me: User): Screen {
  if (me.permission !== 'owner') return 'main';
  if (me.contextStatus === 'ready' || me.contextDeferred) return 'main';
  return 'onboard-form';
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
  //
  // Сначала — код перехода с сайта (`?handoff=...`). Сайт живёт на другом
  // origin, и его `localStorage` нам недоступен; код обменивается на токен и
  // перекрывает то, что лежало здесь раньше, — иначе человек, вошедший на
  // сайте под одной компанией, попадал бы в приложение под другой.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get('handoff');

    const restore = (me: User) => {
      setUser(me);
      setScreen(landingScreen(me));
    };

    if (handoff) {
      // Код одноразовый: убираем его из адреса сразу, чтобы перезагрузка
      // страницы не пыталась обменять его повторно и не оставляла в истории.
      window.history.replaceState({}, '', window.location.pathname);
      void api
        .exchangeHandoff(handoff)
        .then(restore)
        .catch(() => {
          // Код протух или уже использован — остаётся прежняя сессия, если она есть.
          if (api.getToken()) void api.fetchCurrentUser().then(restore).catch(() => api.logout());
        });
      return;
    }

    if (!api.getToken()) return;
    void api.fetchCurrentUser().then(restore).catch(() => api.logout());
  }, []);

  // Список тестов отдаётся без графиков (`include_charts` только в карточке
  // одного теста), поэтому строки мержатся, а не заменяют массив целиком:
  // иначе перезагрузка списка гасила бы панель графиков у открытого теста.
  const reloadTests = useCallback(async () => {
    const rows = await api.fetchTests();
    setTests((prev) => {
      const known = new Map(prev.map((t) => [t.id, t]));
      return rows.map((row) => {
        const old = known.get(row.id);
        return old ? { ...row, charts: row.charts ?? old.charts } : row;
      });
    });
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
    // Чистим синхронно: `currentTest` меняется сразу, а история приезжает
    // запросом, и без этого под шапкой нового теста висела бы лента старого —
    // вместе с его таблицами и графиками.
    setMessages([]);
    if (!currentTestId) return;
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

  /** «Заполню позже». Отметка на сервере, чтобы экран не встречал владельца
   *  при каждом входе; работа при этом не блокируется ничем. */
  const deferContext = useCallback(async () => {
    try {
      await api.deferCompanyContext();
    } catch {
      // Отметка не сохранилась — не повод держать человека на экране.
    }
    setUser((prev) => (prev ? { ...prev, contextDeferred: true } : prev));
    setScreen('main');
  }, []);

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
        setScreen(landingScreen(me));
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

  /** Загрузить новое описание компании и обновить то, что показывают
   *  настройки: список версий и статус контекста у пользователя — оба
   *  меняются этой же загрузкой. */
  const uploadCompanyDoc = useCallback(async (file: File) => {
    await api.uploadCompanyDoc(file);
    setCompanyDocs(await api.fetchCompanyDocs());
    setUser(await api.fetchCurrentUser());
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
      if (user) {
        setUser({ ...user, onboarded: true, contextStatus: 'ready', contextDeferred: false });
      }
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
    deferContext,
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
    uploadCompanyDoc,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
