import { useState } from 'react';
import { useStore } from '../storeContext';
import { ChatBubble } from '../components/ChatBubble';
import { Logo, StatusBadge } from '../components/ui';
import { GRADIENT } from '../theme';

export function MainChat() {
  const { c, s, currentTest, messages, sendMessage, awaitingReply, setNewTestModalOpen, user } = useStore();
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void sendMessage(text);
  };

  return (
    <>
      <div
        style={{
          height: 56,
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{currentTest ? currentTest.name : 'Новый чат'}</div>
        {currentTest && <StatusBadge status={currentTest.status} />}
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {!currentTest && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              textAlign: 'center',
            }}
          >
            <Logo size={52} radius={14} />
            <div style={{ fontSize: 18, fontWeight: 600 }}>
              Добро пожаловать, {user.name.split(' ')[0]}
            </div>
            <div style={{ fontSize: 14, color: c.textSecondary, maxWidth: 360 }}>
              Создайте тест — агент проанализирует данные и предложит выводы
            </div>
            <button onClick={() => setNewTestModalOpen(true)} style={s.primaryButton}>
              ✦ Создать новый тест
            </button>
          </div>
        )}

        {currentTest && (
          <>
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} showAuthor />
            ))}
            {(currentTest.status === 'analyzing' || awaitingReply) && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: GRADIENT,
                    animation: 'pulseGlow 1.6s ease-in-out infinite',
                  }}
                />
                <div style={{ fontSize: 13, color: c.textSecondary }}>
                  {currentTest.status === 'analyzing'
                    ? '✦ Агент анализирует данные...'
                    : '✦ Агент печатает...'}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {currentTest && (
        <div
          style={{
            padding: '12px 24px 20px',
            display: 'flex',
            gap: 8,
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <input
            placeholder="Спросите агента про этот тест..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            style={s.chatInput}
          />
        </div>
      )}
    </>
  );
}
