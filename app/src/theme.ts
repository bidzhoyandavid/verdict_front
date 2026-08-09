import type { CSSProperties } from 'react';

export type ThemeName = 'light' | 'dark';

export interface Colors {
  bg: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentActive: string;
  accentSoft: string;
  success: string;
  warning: string;
  error: string;
}

const light: Colors = {
  bg: '#FFFFFF',
  surface: '#F7F7F8',
  border: '#E5E5E8',
  textPrimary: '#1A1A1E',
  textSecondary: '#6B6B76',
  accent: '#6366F1',
  accentHover: '#4F46E5',
  accentActive: '#4338CA',
  accentSoft: '#EEF2FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

const dark: Colors = {
  ...light,
  bg: '#161618',
  surface: '#1E1E21',
  border: '#2E2E33',
  textPrimary: '#EDEDEF',
  textSecondary: '#9B9BA3',
  accentSoft: 'rgba(99,102,241,0.2)',
};

export const palettes: Record<ThemeName, Colors> = { light, dark };

export const GRADIENT = 'linear-gradient(135deg,#6366F1,#8B5CF6)';
export const MONO = "'JetBrains Mono',monospace";

export interface Styles {
  input: CSSProperties;
  textarea: CSSProperties;
  primaryButton: CSSProperties;
  secondaryButton: CSSProperties;
  secondaryButtonSmall: CSSProperties;
  fieldLabel: CSSProperties;
  chatInput: CSSProperties;
  menuItem: CSSProperties;
  menuItemDanger: CSSProperties;
  tableHeadCell: CSSProperties;
  tableCell: CSSProperties;
  tableCellMuted: CSSProperties;
  tableCellGood: CSSProperties;
  modalOverlay: CSSProperties;
  authTab: CSSProperties;
}

export function makeStyles(c: Colors): Styles {
  const input: CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: 14,
    borderRadius: 8,
    border: `1px solid ${c.border}`,
    background: c.bg,
    color: c.textPrimary,
    outline: 'none',
    fontFamily: 'Inter,sans-serif',
  };
  const secondaryButton: CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${c.border}`,
    background: 'transparent',
    color: c.textPrimary,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  };
  const menuItem: CSSProperties = {
    padding: '8px 10px',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer',
    color: c.textPrimary,
  };

  return {
    input,
    textarea: { ...input, minHeight: 70, resize: 'vertical' },
    primaryButton: {
      width: '100%',
      padding: '10px 14px',
      borderRadius: 8,
      border: 'none',
      background: c.accent,
      color: '#fff',
      fontSize: 14,
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    secondaryButton,
    secondaryButtonSmall: { ...secondaryButton, width: 'auto', padding: '6px 12px', fontSize: 13 },
    fieldLabel: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontSize: 13,
      fontWeight: 500,
      color: c.textSecondary,
    },
    chatInput: {
      flex: 1,
      padding: '12px 16px',
      borderRadius: 10,
      border: `1px solid ${c.border}`,
      background: c.surface,
      color: c.textPrimary,
      fontSize: 14,
      outline: 'none',
      fontFamily: 'Inter,sans-serif',
    },
    menuItem,
    menuItemDanger: { ...menuItem, color: c.error },
    tableHeadCell: {
      padding: '10px 14px',
      fontWeight: 600,
      fontFamily: MONO,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: '.04em',
      color: c.textSecondary,
    },
    tableCell: { padding: '10px 14px', color: c.textPrimary },
    tableCellMuted: { padding: '10px 14px', color: c.textSecondary },
    tableCellGood: { padding: '10px 14px', color: c.success, fontFamily: MONO, fontSize: 12 },
    modalOverlay: {
      position: 'absolute',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    },
    authTab: {
      flex: 1,
      textAlign: 'center',
      padding: 8,
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      color: c.textPrimary,
    },
  };
}
