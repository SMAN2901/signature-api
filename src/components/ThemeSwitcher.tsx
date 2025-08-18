'use client'

import { IconButton, IconButtonProps } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { useThemeMode } from '@/contexts/ThemeContext';

export default function ThemeSwitcher(props: IconButtonProps) {
  const { toggleColorMode, mode } = useThemeMode();

  return (
    <IconButton aria-label="Toggle color mode" color="inherit" onClick={toggleColorMode} {...props}>
      {mode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}
    </IconButton>
  );
}
