import { useEffect, useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { ChatBubble } from '../components/ChatBubble';
import * as api from '../api/client';
import type { ChatMessage } from '../types';

/**
 * Ревью контекста компании: агент собирает черновик company_context.md из
 * загруженного .md, затем задаёт уточняющие вопросы по пустым критичным
 * разделам (единица рандомизации, метрики, поле SRM).
 *
 * Вопросы приходят с бэкенда (детерминированный анализ пробелов), задаются по
 * одному, ответ дописывается в соответствующий раздел брифа. Если открытых
 * вопросов нет, реплика уходит в chat_notes и черновик перегенерируется LLM —
 * это дороже, поэтому только как запасной путь.
 */
export function OnboardChat() {
  const { c, s, goScreen, user } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [context, setContext] = useState('');
  const [questions, setQuestions] = useState<api.OnboardingQuestion[]>([]);
  const [busy, setBusy] = useState(true);
  const notes = useRef<string[]>([]);

  const agentSays = (text: string) =>
    setMessages((prev) => [...prev, { id: `a-${Date.now()}-${prev.length}`, author: 'Verdict AI', role: 'agent', text }]);

  const applyReview = (review: api.OnboardingReview, intro: string) => {
    setContext(review.content);
    setQuestions(review.questions);
    agentSays(intro);
    if (review.questions.length) agentSays(review.questions[0].text);
  };

  const regenerate = async (chatNotes: string[]) => {
    setBusy(true);
    try {
      const review = await api.draftCompanyContext({
        product_description: '',
        business_model: '',
        key_metrics: '',
        chat_notes: chatNotes,
      });
      applyReview(review, `Вот как я понял ваш продукт:\n\n${review.content}`);
    } catch {
      agentSays('Не удалось собрать контекст. Проверьте, что бэкенд запущен и ANTHROPIC_API_KEY задан.');
    } finally {
      setBusy(false);
    }
  };

  const answerCurrent = async (text: string) => {
    const current = questions[0];
    setBusy(true);
    try {
      const review = await api.answerOnboardingQuestions(context, { [current.id]: text });
      setContext(review.content);
      // Ответ может открыть новый вопрос (например, ratio-метрика), поэтому
      // список берём из ответа, а не просто отрезаем первый элемент.
      const pending = review.questions.filter((q) => q.id !== current.id);
      setQuestions(pending);
      if (pending.length) agentSays(pending[0].text);
      else agentSays('Спасибо, этого достаточно — все ключевые разделы заполнены.');
    } catch {
      agentSays('Не удалось сохранить ответ. Попробуйте ещё раз.');
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
    if (questions.length) {
      void answerCurrent(text);
      return;
    }
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
        {!busy && questions.length > 0 && (
          <div style={{ fontSize: 13, color: c.textSecondary, textAlign: 'center' }}>
            Осталось уточнить: {questions.length}
          </div>
        )}
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
          placeholder={questions.length ? 'Ответить на вопрос агента...' : 'Ответить агенту...'}
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
