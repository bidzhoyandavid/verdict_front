import { useEffect, useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { ChatBubble } from '../components/ChatBubble';
import * as api from '../api/client';
import type { ChatMessage } from '../types';

/**
 * Ревью контекста компании: агент собирает черновик company_context.md из
 * загруженного .md, пользователь правит его репликами, каждая правка уходит
 * в chat_notes и черновик перегенерируется.
 *
 * Адаптивного интервью из ТЗ здесь пока нет — бэкенд отдаёт линейный
 * draft/confirm, ветвящиеся вопросы появятся вместе с графом онбординга.
 */
export function OnboardChat() {
  const { c, s, goScreen, user } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [context, setContext] = useState('');
  const [busy, setBusy] = useState(true);
  const notes = useRef<string[]>([]);

  const regenerate = async (chatNotes: string[]) => {
    setBusy(true);
    try {
      const content = await api.draftCompanyContext({
        product_description: '',
        business_model: '',
        key_metrics: '',
        chat_notes: chatNotes,
      });
      setContext(content);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          author: 'Verdict AI',
          role: 'agent',
          text: `Вот как я понял ваш продукт:\n\n${content}\n\nЕсли что-то не так — напишите, поправлю.`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          author: 'Verdict AI',
          role: 'agent',
          text: 'Не удалось собрать контекст. Проверьте, что бэкенд запущен и ANTHROPIC_API_KEY задан.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  // StrictMode в dev прогоняет эффекты дважды, а тут каждый прогон — реальный
  // запрос к LLM. Флаг гарантирует ровно один черновик на монтирование.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void regenerate([]);
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, author: user?.name ?? '', role: 'user', initials: user?.initials, text },
    ]);
    setDraft('');
    notes.current = [...notes.current, text];
    void regenerate(notes.current);
  };

  const finish = async () => {
    setBusy(true);
    try {
      if (context) await api.confirmCompanyContext(context);
      goScreen('main');
    } finally {
      setBusy(false);
    }
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
          Агент изучает описание компании и уточняет детали
        </div>
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {busy && <div style={{ fontSize: 13, color: c.textSecondary }}>✦ Агент думает...</div>}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
          <button
            onClick={() => void finish()}
            disabled={busy || !context}
            style={{ ...s.primaryButton, opacity: busy || !context ? 0.5 : 1 }}
          >
            Всё верно, начать работу
          </button>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 640, padding: '12px 16px 24px', display: 'flex', gap: 8 }}>
        <input
          placeholder="Ответить агенту..."
          value={draft}
          disabled={busy}
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
