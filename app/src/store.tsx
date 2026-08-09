import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from './api/mockApi';
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
} from './types';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light');
  const [screen, setScreen] = useState<Screen>('auth');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
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

  const user = api.getCurrentUser();
  const c = palettes[theme];
  const s = useMemo(() => makeStyles(c), [c]);

  const inApp = screen === 'main' || screen === 'all-tests' || screen === 'settings';

  useEffect(() => {
    if (!inApp || tests.length > 0) return;
    void api.fetchTests().then(setTests);
  }, [inApp, tests.length]);

  useEffect(() => {
    if (screen !== 'settings') return;
    void api.fetchTeam().then(setTeam);
    void api.fetchCompanyDocs().then(setCompanyDocs);
  }, [screen]);

  const currentTest = tests.find((t) => t.id === currentTestId);

  useEffect(() => {
    if (!currentTest) {
      setMessages([]);
      return;
    }
    let stale = false;
    void api.fetchMessages(currentTest).then((m) => {
      if (!stale) setMessages(m);
    });
    return () => {
      stale = true;
    };
    // Перезагружаем историю при смене теста и при переходе analyzing → done.
  }, [currentTest?.id, currentTest?.status]);

  const goScreen = useCallback((next: Screen) => {
    setScreen(next);
    setProfileMenuOpen(false);
  }, []);

  const submitAuth = useCallback(() => {
    setScreen(authMode === 'signup' ? 'onboard-form' : 'main');
  }, [authMode]);

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

    // Демо вместо polling/websocket по статусу анализа.
    setTimeout(() => {
      void api.fetchTestResults(test.id).then((patch) => {
        setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, ...patch } : t)));
      });
    }, api.ANALYSIS_DEMO_MS);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!currentTestId) return;
      const own: ChatMessage = {
        id: `u-${Date.now()}`,
        author: user.name,
        role: 'user',
        initials: user.initials,
        text,
      };
      setMessages((prev) => [...prev, own]);
      setAwaitingReply(true);
      const reply = await api.sendChatMessage(currentTestId, text);
      setMessages((prev) => [...prev, reply]);
      setAwaitingReply(false);
    },
    [currentTestId, user.initials, user.name],
  );

  const invite = useCallback(async (email: string, role: Role) => {
    const member = await api.inviteMember(email, role);
    setTeam((prev) => [...prev, member]);
  }, []);

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
    user,
    tests,
    currentTestId,
    currentTest,
    selectTest,
    createTest,
    messages,
    sendMessage,
    awaitingReply,
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
