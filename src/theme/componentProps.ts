import { Components, CssVarsTheme, PaletteMode, Theme } from "@mui/material";

export const componentsProps: Components<Omit<Theme, "components" | "palette"> & CssVarsTheme> = {
  MuiButton: {
    defaultProps: {
      size: 'small',
    },
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 600,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 10,
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        borderRadius: 6,
      },
    },
  },
  MuiSvgIcon: {
    defaultProps: {
      fontSize: 'small',
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
      fullWidth: true,
      slotProps: {
        formHelperText: {
          sx: {
            position: 'absolute',
            bottom: -18,
            left: 0,
            m: 0,
          },
        },
      },
    },
    styleOverrides: {
      root: {
        position: 'relative',
        marginBottom: '18px',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        width: 32,
        height: 32,
        fontSize: '1rem',
        fontWeight: 600
      },
    },
  }
};

export const avatarColorsLight = [
  '#FFB6B6', // Light red
  '#FFD59E', // Light orange
  '#FFF7A1', // Light yellow
  '#C1FBA4', // Light green
  '#A0E7E5', // Aqua
  '#B5D0FF', // Light blue
  '#D3A0FF', // Lavender
  '#FFABCE', // Pink
  '#C7ECEE', // Pale teal
  '#E0BBE4', // Light purple
  ];

export const avatarColorsDeep = [
  '#D32F2F', // red[700]
  '#C2185B', // pink[700]
  '#7B1FA2', // purple[700]
  '#512DA8', // deepPurple[700]
  '#303F9F', // indigo[700]
  '#1976D2', // blue[700]
  '#0288D1', // lightBlue[700]
  '#00796B', // teal[700]
  '#388E3C', // green[700]
  '#F57C00', // orange[700]
];

export function getRandomColor(mode: PaletteMode, s: string = ''): string {
  const colors = mode === 'dark' ? avatarColorsLight : avatarColorsDeep;

  let index = Math.floor(Math.random() * colors.length);
  if(s) index = s.charCodeAt(0) % colors.length;

  return colors[index];
}
