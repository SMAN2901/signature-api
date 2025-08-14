import { createTheme } from "@mui/material/styles";

const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0ea5e9" },
    secondary: { main: "#8b5cf6" },
    success: { main: "#22c55e" },
  },
  shape: { borderRadius: 16 },
});

export default lightTheme;
