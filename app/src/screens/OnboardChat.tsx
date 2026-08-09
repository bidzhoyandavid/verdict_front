import { useEffect, useState } from 'react';
import { useStore } from '../storeContext';
import { ChatBubble } from '../components/ChatBubble';
import * as api from '../api/mockApi';
import type { ChatMessage } from '../types';

export function OnboardChat() {
  const { c, s, goScreen, user } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    void api.fetchOnboardMessages().then(setMessages);
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, author: user.name, role: 'user', initials: user.initials, text },
    ]);
    setDraft('');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          flex: 1,
          overflow: 'auto',
          padding: '32px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center' }}>
          Агент изучает company.md и уточняет детали
        </div>
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button onClick={() => goScreen('main')} style={s.primaryButton}>
            Всё верно, начать работу
          </button>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 640, padding: '12px 16px 24px', display: 'flex', gap: 8 }}>
        <input
          placeholder="Ответить агенту..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          style={s.chatInput}
        />
      </div>
    </div>
  );
}
