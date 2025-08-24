'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PaletteMode } from '@mui/material';

type ThemeContextType = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeProvider');
  return context;
};

export const ThemeContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<PaletteMode>('dark');

  // Load saved mode from localStorage or system preference on first load
  useEffect(() => {
    const stored = localStorage.getItem('themeMode') as PaletteMode | null;
    if (stored) {
      setMode(stored);
      document.body.setAttribute("data-theme", stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialMode: PaletteMode = prefersDark ? 'dark' : 'light';
      setMode(initialMode);
      localStorage.setItem('themeMode', initialMode);
      document.body.setAttribute("data-theme", initialMode);
    }
  }, []);

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', next);
      document.body.setAttribute("data-theme", next);
      return next;
    });
  };

  const value = useMemo(() => ({ mode, toggleColorMode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
