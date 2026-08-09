import { useState } from 'react';
import { useStore } from '../storeContext';
import { Logo } from '../components/ui';
import type { AuthMode } from '../types';

export function Auth() {
  const { c, s, authMode, setAuthMode, submitAuth } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
          submitAuth();
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={s.input}
          />
          <input
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={s.input}
          />
          <button type="submit" style={s.primaryButton}>
            {authMode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
          </button>
          <button type="button" style={s.secondaryButton}>
            Продолжить с Google
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: c.textSecondary }}>
          Демо-прототип, любые данные подойдут
        </div>
      </form>
    </div>
  );
}
