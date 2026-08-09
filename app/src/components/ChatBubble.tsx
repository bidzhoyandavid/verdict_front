import { useStore } from '../storeContext';
import { GRADIENT } from '../theme';
import { ResultTable } from './ui';
import type { ChatMessage } from '../types';

export function ChatBubble({ message, showAuthor = false }: { message: ChatMessage; showAuthor?: boolean }) {
  const { c } = useStore();
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
        {message.results && <ResultTable results={message.results} />}
      </div>
    </div>
  );
}
