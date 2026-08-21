import { useEffect, useRef, useState } from 'react';
import { useStore } from '../storeContext';
import { AnsweredInterruptCard } from '../components/AnsweredInterruptCard';
import { ChatBubble } from '../components/ChatBubble';
import { ChartPanel } from '../components/ChartPanel';
import { ChecksPanel } from '../components/ChecksPanel';
import { InterruptCard } from '../components/InterruptCard';
import { ResultsTable } from '../components/ResultsTable';
import { SegmentBreakdown } from '../components/SegmentBreakdown';
import { VerdictCard } from '../components/VerdictCard';
import { RunProgressList } from '../components/RunProgressList';
import { Logo, StatusBadge } from '../components/ui';
import { GRADIENT } from '../theme';

export function MainChat() {
  const { c, s, currentTest, messages, sendMessage, awaitingReply, progress, setNewTestModalOpen, user } =
    useStore();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const analyzing = currentTest?.status === 'analyzing';
  const paused = currentTest?.status === 'awaiting_input';
  // Пока агент занят или ждёт ответа на свой вопрос, писать в чат нельзя —
  // бэкенд в этот момент всё равно ответит 409.
  const inputDisabled = !currentTest || analyzing || paused;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, progress.done.length, currentTest?.status]);

  const submit = () => {
    const text = draft.trim();
    if (!text || inputDisabled) return;
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
              Добро пожаловать, {user?.name.split(' ')[0]}
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
            {messages.map((m) =>
              m.answeredInterrupt ? (
                <AnsweredInterruptCard key={m.id} entry={m.answeredInterrupt} />
              ) : (
                <ChatBubble key={m.id} message={m} showAuthor />
              ),
            )}

            {currentTest.results && currentTest.results.rows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Результаты по метрикам</div>
                <ResultsTable results={currentTest.results} />
              </div>
            )}

            {currentTest.results && currentTest.results.checks.length > 0 && (
              <ChecksPanel checks={currentTest.results.checks} />
            )}

            {currentTest.results && currentTest.results.segments.length > 0 && (
              <SegmentBreakdown segments={currentTest.results.segments} />
            )}

            {currentTest.charts && currentTest.charts.length > 0 && (
              <ChartPanel charts={currentTest.charts} />
            )}

            {/* Вывод — последним: его читают после таблицы и графиков. */}
            {currentTest.results?.verdict && <VerdictCard verdict={currentTest.results.verdict} />}

            {analyzing && progress.mode === 'answer' && (
              <div style={{ fontSize: 13, color: c.textSecondary }}>✦ Агент печатает...</div>
            )}

            {analyzing && progress.mode !== 'answer' && progress.steps.length > 0 && (
              <RunProgressList progress={progress} />
            )}

            {analyzing && progress.mode !== 'answer' && progress.steps.length === 0 && (
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
                <div style={{ fontSize: 13, color: c.textSecondary }}>✦ Агент анализирует данные...</div>
              </div>
            )}

            {awaitingReply && !analyzing && (
              <div style={{ fontSize: 13, color: c.textSecondary }}>✦ Агент печатает...</div>
            )}

            {paused && currentTest.pendingInterrupt && (
              <InterruptCard interrupt={currentTest.pendingInterrupt} />
            )}

            {currentTest.status === 'failed' && currentTest.error && (
              <div
                style={{
                  border: `1px solid ${c.error}55`,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 13,
                  color: c.error,
                }}
              >
                Анализ упал: {currentTest.error}
              </div>
            )}

            <div ref={bottomRef} />
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
            placeholder={
              paused ? 'Сначала ответьте на вопрос агента выше' : 'Спросите агента про этот тест...'
            }
            value={draft}
            disabled={inputDisabled}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            style={{ ...s.chatInput, opacity: inputDisabled ? 0.6 : 1 }}
          />
        </div>
      )}
    </>
  );
}
