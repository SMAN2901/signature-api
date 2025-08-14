import { createTheme } from "@mui/material/styles";
import { componentsProps } from "./componentProps";

const lightTheme = createTheme({
    palette: {
    mode: 'light',
    primary: {
      main: '#a4e031',
      light: '#B6E65A',
      dark: '#729C22',
      contrastText: 'rgba(0,0,0,0.87)',
    },
    secondary: {
      main: '#539e69',
      light: '#75B187',
      dark: '#3A6E49',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#2196f3',
      light: '#4DABF5',
      dark: '#1769AA',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F44336',
      light: '#F6685E',
      dark: '#AA2E25',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FF9800',
      light: '#FFAC33',
      dark: '#B26A00',
      contrastText: 'rgba(0,0,0,0.87)',
    },
    success: {
      main: '#4CAF50',
      light: '#6FBF73',
      dark: '#357A38',
      contrastText: 'rgba(0,0,0,0.87)',
    },
    divider: 'rgba(0,0,0,0.12)',
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: 'rgba(0, 0, 0, 0.7)',
      disabled: 'rgba(0, 0, 0, 0.5)',
    },
  },

  typography: {
    fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 600 },
    h3: { fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 500 },
    h6: { fontSize: '1rem', fontWeight: 500 },
    subtitle1: { fontSize: '1rem', fontWeight: 400 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 400 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' },
    button: { fontWeight: 600, textTransform: 'none' },
    caption: { fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' },
    overline: { fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' },
  },

  shape: {
    borderRadius: 8,
  },

  components: componentsProps
});

export default lightTheme;
