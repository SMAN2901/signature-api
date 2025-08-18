'use client';

import { ThemeProvider, CssBaseline, createTheme, GlobalStyles } from '@mui/material';
import dark from './dark';
import light from './light';
import { useThemeMode } from '@/contexts/ThemeContext';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
	const { mode } = useThemeMode();
  const theme = createTheme(mode === 'light' ? light : dark);
	
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<GlobalStyles
        styles={{
          body: {
            backgroundColor: theme.palette.background.default,
            color: theme.palette.text.primary,
            transition: 'background-color 0.3s ease',
          },
        }}
      />
			{children}
		</ThemeProvider>
	);
}
