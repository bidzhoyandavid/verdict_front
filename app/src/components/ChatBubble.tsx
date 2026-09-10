import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { appDict } from '../lib/appDict';
import { GRADIENT } from '../theme';
import { ResultsTable } from './ResultsTable';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
  showAuthor?: boolean;
  /**
   * Снапшот результатов на момент этого прогона уже неактуален: после него
   * был ещё один прогон (например, досчёт метрики). Разворачивается по клику —
   * раскрытая устаревшая таблица прямо в ленте читается как свежий ответ.
   */
  staleResults?: boolean;
  /**
   * Свежий снапшот дублирует живую панель прогона, которую чат рисует сразу
   * под этим сообщением, — инлайн-таблица тут не нужна.
   */
  hideResults?: boolean;
}

export function ChatBubble({
  message,
  showAuthor = false,
  staleResults = false,
  hideResults = false,
}: Props) {
  const { c } = useStore();
  const t = useDict(appDict);
  const isAgent = message.role === 'agent';

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        flexDirection: isAgent ? 'row' : 'row-reverse',
        textAlign: isAgent ? 'left' : 'right',
      }}
    >
      {isAgent ? (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: GRADIENT, flexShrink: 0 }} />
      ) : (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: c.accent,
            color: '#fff',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {message.initials}
        </div>
      )}
      <div style={{ maxWidth: 520 }}>
        {showAuthor && (
          <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 4 }}>{message.author}</div>
        )}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.5,
            background: isAgent ? c.surface : c.accentSoft,
            color: c.textPrimary,
          }}
        >
          {message.text}
        </div>
        {message.results &&
          !hideResults &&
          (staleResults ? (
            <details style={{ marginTop: 6 }}>
              <summary style={{ fontSize: 12, color: c.textSecondary, cursor: 'pointer' }}>
                {t.chat.staleResults}
              </summary>
              <div style={{ marginTop: 6 }}>
                <ResultsTable results={message.results} />
              </div>
            </details>
          ) : (
            <ResultsTable results={message.results} />
          ))}
      </div>
    </div>
  );
}
