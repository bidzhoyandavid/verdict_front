import { useState } from 'react';
import { useStore } from '../storeContext';
import { useDict } from '../lib/lang';
import { appDict } from '../lib/appDict';
import { commonDict } from '../lib/commonDict';
import { Field, Modal } from '../components/ui';
import type { Role } from '../types';

const ROLES: Role[] = ['Admin', 'Analyst', 'Product', 'Marketer'];

export function InviteModal() {
  const { c, s, setInviteModalOpen, invite } = useStore();
  const t = useDict(appDict);
  const shared = useDict(commonDict);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Analyst');
  const [sent, setSent] = useState(false);

  const close = () => setInviteModalOpen(false);

  const send = async () => {
    if (!email.trim()) return;
    await invite(email.trim(), role);
    setSent(true);
    setTimeout(close, 1400);
  };

  return (
    <Modal width={400} onClose={close}>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{t.invite.title}</div>

      <Field label="Email">
        <input
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={s.input}
        />
      </Field>

      <Field label={t.invite.role}>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={s.input}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      {sent && (
        <div style={{ fontSize: 13, color: c.success }}>{t.invite.sent(email)}</div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
        <button onClick={close} style={{ ...s.secondaryButton, width: 'auto', padding: '10px 16px' }}>
          {shared.cancel}
        </button>
        <button onClick={send} style={{ ...s.primaryButton, width: 'auto', padding: '10px 16px' }}>
          {t.invite.send}
        </button>
      </div>
    </Modal>
  );
}
