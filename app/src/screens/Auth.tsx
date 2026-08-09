import { useState } from 'react';
import { useStore } from '../storeContext';
import { Logo } from '../components/ui';
import type { AuthMode } from '../types';

export function Auth() {
  const { c, s, authMode, setAuthMode, submitAuth, authError, authBusy } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');

  const isSignup = authMode === 'signup';
  const canSubmit = email.trim() && password.length >= 8 && (!isSignup || company.trim());

  const tabStyle = (mode: AuthMode) => ({
    ...s.authTab,
    background: authMode === mode ? c.bg : 'transparent',
    boxShadow: authMode === mode ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
  });

  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form
        style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit && !authBusy) void submitAuth(email.trim(), password, company.trim());
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Logo />
          <div style={{ fontSize: 20, fontWeight: 600 }}>Verdict AI</div>
          <div style={{ fontSize: 13, color: c.textSecondary }}>Анализ A/B-тестов с AI-агентом</div>
        </div>

        <div style={{ display: 'flex', gap: 4, background: c.surface, borderRadius: 10, padding: 4 }}>
          <div onClick={() => setAuthMode('signin')} style={tabStyle('signin')}>
            Вход
          </div>
          <div onClick={() => setAuthMode('signup')} style={tabStyle('signup')}>
            Регистрация
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={s.input}
          />
          <input
            placeholder="Пароль (минимум 8 символов)"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={s.input}
          />
          {isSignup && (
            <input
              placeholder="Компания"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              style={s.input}
            />
          )}

          {authError && (
            <div style={{ fontSize: 13, color: c.error, textAlign: 'center' }}>{authError}</div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || authBusy}
            style={{ ...s.primaryButton, opacity: !canSubmit || authBusy ? 0.5 : 1 }}
          >
            {authBusy ? 'Подождите...' : isSignup ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: c.textSecondary }}>
          {isSignup ? 'Первый пользователь компании становится администратором' : ''}
        </div>
      </form>
    </div>
  );
}
