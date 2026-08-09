import { createContext, useContext } from 'react';
import type { Colors, Styles, ThemeName } from './theme';
import type {
  ABTest,
  AuthMode,
  ChatMessage,
  CompanyDoc,
  NewTestDraft,
  Role,
  RunProgress,
  Screen,
  SettingsTab,
  TeamMember,
  User,
} from './types';

export interface Store {
  theme: ThemeName;
  c: Colors;
  s: Styles;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;

  screen: Screen;
  goScreen: (screen: Screen) => void;
  authMode: AuthMode;
  setAuthMode: (m: AuthMode) => void;
  submitAuth: (email: string, password: string, company: string) => Promise<void>;
  authError: string | null;
  authBusy: boolean;

  /** null до входа — экраны приложения рендерятся только с юзером. */
  user: User | null;
  signOut: () => void;

  tests: ABTest[];
  currentTestId: string | null;
  currentTest: ABTest | undefined;
  selectTest: (id: string) => void;
  createTest: (draft: NewTestDraft) => Promise<void>;

  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  awaitingReply: boolean;
  /** Живой прогресс по шагам пайплайна из SSE. */
  progress: RunProgress;
  answerInterrupt: (decision: Record<string, unknown>) => Promise<void>;
  completeOnboarding: (mdFile: File | null) => Promise<void>;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (open: boolean) => void;

  newTestModalOpen: boolean;
  setNewTestModalOpen: (open: boolean) => void;
  inviteModalOpen: boolean;
  setInviteModalOpen: (open: boolean) => void;

  settingsTab: SettingsTab;
  setSettingsTab: (tab: SettingsTab) => void;

  team: TeamMember[];
  invite: (email: string, role: Role) => Promise<void>;
  companyDocs: CompanyDoc[];
}

export const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
