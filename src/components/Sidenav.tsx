"use client";
import React from "react";
import {
  Paper,
  Stack,
  Typography,
  Button,
  Tooltip,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  Box,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ErrorIcon from "@mui/icons-material/Error";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { WizardState, Action, StepKey } from "../types";

interface Settings {
  enableAutomation: boolean;
  useLocalStorage: boolean;
}

interface SidenavProps {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  stepsOrder: { key: StepKey; label: string; icon: React.ReactNode }[];
  runAll: () => Promise<void>;
  go: (step: StepKey) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
}

export default function Sidenav({ state, dispatch, stepsOrder, runAll, go, settings, setSettings }: SidenavProps) {
  const [showSettings, setShowSettings] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleToggle = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(value));
    }
  };

  return (
    <Paper elevation={0} sx={{ p: 2, height: "100%", overflow: "auto", borderRadius: 0 }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Steps</Typography>
          {settings.enableAutomation && (
            <Tooltip title="Run all steps automatically with delays">
              <span>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PlayCircleIcon />}
                  onClick={runAll}
                  disabled={state.autoRun}
                >
                  Execute All
                </Button>
              </span>
            </Tooltip>
          )}
        </Stack>
        <List>
          {stepsOrder.map(({ key, label, icon }) => {
            const s = state.steps[key].status;
            const color =
              s === "success"
                ? "success.main"
                : s === "error"
                ? "error.main"
                : s === "running"
                ? "info.main"
                : "text.disabled";
            const activeIcon =
              s === "success" ? (
                <CheckCircleIcon fontSize="small" sx={{ color }} />
              ) : s === "error" ? (
                <ErrorIcon fontSize="small" sx={{ color }} />
              ) : s === "running" ? (
                <CircularProgress size={16} sx={{ color }} />
              ) : (
                <RadioButtonUncheckedIcon fontSize="small" sx={{ color }} />
              );
            return (
              <ListItem key={key} disablePadding>
                <ListItemButton selected={state.current === key} onClick={() => go(key)} sx={{ borderRadius: 1 }}>
                  <ListItemIcon>{icon}</ListItemIcon>
                  <ListItemText primary={label} />
                  {activeIcon}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        {showSettings && (
          <>
            <Divider />
            <Stack spacing={1}>
              <Typography variant="subtitle1">Settings</Typography>
              <FormControlLabel
                control={<Switch checked={settings.enableAutomation} onChange={handleToggle("enableAutomation")} />}
                label="Enable Automation"
              />
              <FormControlLabel
                control={<Switch checked={settings.useLocalStorage} onChange={handleToggle("useLocalStorage")} />}
                label="Use local storage"
              />
              {settings.enableAutomation && (
                <TextField
                  label="Automation Delay (ms)"
                  type="number"
                  size="small"
                  value={state.autoDelayMs}
                  onChange={(e) =>
                    dispatch({ type: "SET_FIELD", key: "autoDelayMs", value: Number(e.target.value) })
                  }
                  fullWidth
                  sx={{ maxWidth: 400 }}
                />
              )}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}

