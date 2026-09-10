import { useState } from 'react';
import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { appDict } from '../lib/appDict';

const SNOOZE_KEY = 'verdict.context-reminder-snoozed-until';
const SNOOZE_DAYS = 7;

/** Ненавязчивое напоминание про незаполненный контекст компании.
 *
 *  Полоска, а не модалка: модалка на входе — это тот же гейт, только злее.
 *  Закрывается на неделю и возвращается — молчать совсем нельзя, потому что
 *  без контекста агент отвечает хуже, и человек должен знать причину.
 *
 *  Видит только владелец: заполнять контекст больше некому. */
export function ContextReminder() {
  const { c, user, goScreen } = useStore();
  const t = useDict(appDict);

  const [snoozed, setSnoozed] = useState(() => {
    try {
      const until = Number(localStorage.getItem(SNOOZE_KEY) ?? 0);
      return Date.now() < until;
    } catch {
      return false;
    }
  });

  if (!user || user.permission !== 'owner') return null;
  if (user.contextStatus === 'ready' || snoozed) return null;

  const started = user.contextStatus === 'draft';

  function snooze() {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * 86_400_000));
    } catch {
      /* приватный режим — напоминание вернётся после перезагрузки */
    }
    setSnoozed(true);
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        background: c.surface,
        borderBottom: `1px solid ${c.border}`,
        fontSize: 13,
        color: c.textSecondary,
      }}
    >
      <span style={{ flex: 1 }}>
        {started
          ? t.context.partial
          : t.context.absent}
      </span>
      <button
        onClick={() => goScreen('onboard-form')}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          fontWeight: 600,
          color: c.accent,
          cursor: 'pointer',
        }}
      >
        {started ? t.context.continueFilling : t.context.fill}
      </button>
      <button
        onClick={snooze}
        aria-label={t.context.hideReminder}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          font: 'inherit',
          color: c.textSecondary,
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
}
