"use client";
import React from "react";
import {
  Paper,
  Stack,
  Typography,
  Button,
  Tooltip,
  Switch,
  FormControlLabel,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PendingIcon from "@mui/icons-material/Pending";
import ErrorIcon from "@mui/icons-material/Error";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { WizardState, Action, StepKey } from "../types";

interface SidenavProps {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  stepsOrder: { key: StepKey; label: string; icon: React.ReactNode }[];
  runAll: () => Promise<void>;
  go: (step: StepKey) => void;
}

export default function Sidenav({ state, dispatch, stepsOrder, runAll, go }: SidenavProps) {
  return (
    <Paper elevation={0} sx={{ p: 2, height: "100%", overflow: "auto", borderRadius: 0 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Steps</Typography>
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
      </Stack>
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={state.simulate}
              onChange={(e) => dispatch({ type: "SET_FIELD", key: "simulate", value: e.target.checked })}
            />
          }
          label="Simulate API"
        />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          label="Automation Delay (ms)"
          type="number"
          size="small"
          value={state.autoDelayMs}
          onChange={(e) => dispatch({ type: "SET_FIELD", key: "autoDelayMs", value: Number(e.target.value) })}
          fullWidth
        />
      </Stack>
      <Divider sx={{ mb: 2 }} />
      <List>
        {stepsOrder.map(({ key, label, icon }) => {
          const s = state.steps[key].status;
          const ActiveIcon =
            s === "success"
              ? CheckCircleIcon
              : s === "error"
              ? ErrorIcon
              : s === "running"
              ? PendingIcon
              : RadioButtonUncheckedIcon;
          const color =
            s === "success"
              ? "success.main"
              : s === "error"
              ? "error.main"
              : s === "running"
              ? "info.main"
              : "text.disabled";
          return (
            <ListItem key={key} disablePadding>
              <ListItemButton selected={state.current === key} onClick={() => go(key)}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={label} />
                <ActiveIcon fontSize="small" sx={{ color }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}

