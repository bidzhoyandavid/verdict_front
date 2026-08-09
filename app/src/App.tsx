import { StoreProvider } from './store';
import { useStore } from './storeContext';
import { Auth } from './screens/Auth';
import { OnboardForm } from './screens/OnboardForm';
import { OnboardChat } from './screens/OnboardChat';
import { Sidebar } from './screens/Sidebar';
import { MainChat } from './screens/MainChat';
import { AllTests } from './screens/AllTests';
import { Settings } from './screens/Settings';
import { NewTestModal } from './modals/NewTestModal';
import { InviteModal } from './modals/InviteModal';

function Shell() {
  const { c, screen, newTestModalOpen, inviteModalOpen } = useStore();
  const inApp = screen === 'main' || screen === 'all-tests' || screen === 'settings';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: c.bg,
        color: c.textPrimary,
        overflow: 'hidden',
      }}
    >
      {screen === 'auth' && <Auth />}
      {screen === 'onboard-form' && <OnboardForm />}
      {screen === 'onboard-chat' && <OnboardChat />}

      {inApp && (
        <div style={{ height: '100%', display: 'flex' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {screen === 'main' && <MainChat />}
            {screen === 'all-tests' && <AllTests />}
            {screen === 'settings' && <Settings />}
          </div>
        </div>
      )}

      {newTestModalOpen && <NewTestModal />}
      {inviteModalOpen && <InviteModal />}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
