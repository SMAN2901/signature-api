"use client";
import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Typography,
  Button,
  TextField,
  Divider,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import SendIcon from "@mui/icons-material/Send";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import PendingIcon from "@mui/icons-material/Pending";
import { getToken, buildTokenRequest } from "../services/token";

// ————————————————————————————————————————————
// Minimal Next.js single-file page. Drop this into app/page.tsx
// You will plug in your own API URLs and payload builders below.
// Everything is in-memory; a reload resets the wizard.
// ————————————————————————————————————————————

// —— Configuration placeholders (edit these later) ——
const API = {
  TOKEN_URL: "",
  UPLOAD_URL: "",
  PREPARE_URL: "",
  PREPARE_AND_SEND_URL: "",
  SEND_URL: "",
  POLL_URL: "", // e.g. `${base}/poll/:id` or `${base}/poll` with body { id }
};

// —— Theme ——
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0ea5e9",
    },
    secondary: {
      main: "#8b5cf6",
    },
    success: {
      main: "#22c55e",
    },
  },
  shape: { borderRadius: 16 },
});

import { StepKey, StepState, WizardState, Action } from "../types";
import StepIntro from "../components/steps/StepIntro";
import StepToken from "../components/steps/StepToken";
import StepUpload from "../components/steps/StepUpload";
import StepPrepare from "../components/steps/StepPrepare";
import StepSend from "../components/steps/StepSend";
import StepDone from "../components/steps/StepDone";

const initialState: WizardState = {
  current: "intro",
  environment: (typeof window !== "undefined" && (localStorage.getItem("environment") as any)) || "development",
  clientId: "",
  clientSecret: "",
  token: undefined,
  file: null,
  fileName: undefined,
  processId: undefined,
  emails: "",
  actionChoice: "prepare",
  autoRun: false,
  autoDelayMs: 900,
  simulate: true,
  steps: {
    intro: { status: "idle" },
    token: { status: "idle" },
    upload: { status: "idle", polling: { isActive: false, logs: [] } },
    prepare: { status: "idle", polling: { isActive: false, logs: [] } },
    send: { status: "idle", polling: { isActive: false, logs: [] } },
    done: { status: "idle" },
  },
};

// —— Reducer ——

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.key]: action.value } as WizardState;
    case "SET_STEP": {
      const prev = state.steps[action.step] || { status: "idle" };
      return { ...state, steps: { ...state.steps, [action.step]: { ...prev, ...action.patch } } };
    }
    case "GOTO":
      return { ...state, current: action.step };
  }
}

// —— Utility UI ——
function StepBadge({ s }: { s: StepState["status"] }) {
  const color = s === "success" ? "success" : s === "error" ? "error" : s === "running" ? "info" : "default";
  const label = s[0].toUpperCase() + s.slice(1);
  return <Chip size="small" color={color as any} label={label} />;
}

function useDelay() {
  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
  return wait;
}

// —— Polling helper ——
function usePoller() {
  const timerRef = useRef<Record<string, any>>({});

  useEffect(() => {
    return () => {
      // cleanup any intervals on unmount
      Object.values(timerRef.current).forEach((id) => clearInterval(id));
    };
  }, []);

  const start = useCallback(
    async (
      key: StepKey,
      id: string,
      onTick: (payload: any) => void,
      fetcher: () => Promise<any>,
      isDone: (payload: any) => boolean,
      intervalMs = 1500
    ) => {
      // Kick an immediate tick, then interval
      const first = await fetcher();
      onTick(first);
      if (isDone(first)) return;
      const t = setInterval(async () => {
        const data = await fetcher();
        onTick(data);
        if (isDone(data)) {
          clearInterval(t);
          delete timerRef.current[key];
        }
      }, intervalMs);
      timerRef.current[key] = t;
    },
    []
  );

  const stop = useCallback((key: StepKey) => {
    const t = timerRef.current[key];
    if (t) {
      clearInterval(t);
      delete timerRef.current[key];
    }
  }, []);

  return { start, stop };
}

// —— Mock API (you can switch off with simulate=false) ——
async function mockCall(name: string, payload: any) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));
  // Return a generic shape you can replace later
  if (name === "getToken") {
    return { access_token: "mock_token_" + Math.random().toString(36).slice(2), expires_in: 3600 };
  }
  if (name === "upload") {
    return { fileId: "file_" + Math.random().toString(36).slice(2), name: payload?.fileName };
  }
  if (name === "prepare") {
    return { processId: "proc_" + Math.random().toString(36).slice(2), status: "queued" };
  }
  if (name === "prepare_send") {
    return { processId: "proc_" + Math.random().toString(36).slice(2), status: "queued", sent: true };
  }
  if (name === "send") {
    return { processId: payload?.processId || "proc_" + Math.random().toString(36).slice(2), status: "queued" };
  }
  if (name === "poll") {
    // produce a fake progressing status
    const pct = Math.min(100, (payload?.__pct || 0) + 25 + Math.round(Math.random() * 20));
    const done = pct >= 100;
    return { status: done ? "completed" : "processing", progress: pct, timestamp: new Date().toISOString() };
  }
  return { ok: true };
}

// —— Real fetch wrapper (fills in later) ——
async function realFetch(url: string, body?: any, token?: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// —— Page ——
export default function Page() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wait = useDelay();
  const poller = usePoller();
  const [snack, setSnack] = useState<string | null>(null);

  const stepsOrder: { key: StepKey; label: string; icon: React.ReactNode }[] = [
    { key: "intro", label: "Intro", icon: <SettingsEthernetIcon /> },
    { key: "token", label: "Get Token", icon: <LockOpenIcon /> },
    { key: "upload", label: "Upload File", icon: <CloudUploadIcon /> },
    { key: "prepare", label: "Prepare / Prepare+Send", icon: <DescriptionIcon /> },
    { key: "send", label: "Send Contract", icon: <SendIcon /> },
    { key: "done", label: "Complete", icon: <CheckCircleIcon /> },
  ];

  const go = (step: StepKey) => dispatch({ type: "GOTO", step });

  // —— Handlers per step ——
  const handleGetStarted = async () => {
    go("token");
  };

  const runToken = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "running", error: undefined } });
      const body = { client_id: state.clientId, client_secret: state.clientSecret, grant_type: "client_credentials" };
      const { url } = buildTokenRequest(state.clientId, state.clientSecret);
      dispatch({ type: "SET_STEP", step: "token", patch: { request: { url, body } } });
      const data = state.simulate ? await mockCall("getToken", body) : await getToken(state.clientId, state.clientSecret);
      dispatch({ type: "SET_FIELD", key: "token", value: data.access_token });
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "success", response: data } });
      setSnack("Token acquired.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "error", error: String(e) } });
    }
  }, [state.clientId, state.clientSecret, state.simulate]);

  const runUpload = useCallback(async () => {
    if (!state.file) {
      setSnack("Please choose a PDF first.");
      return;
    }
    try {
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "running", error: undefined } });
      const body = { fileName: state.fileName, contentType: state.file?.type || "application/pdf" };
      dispatch({ type: "SET_STEP", step: "upload", patch: { request: { url: API.UPLOAD_URL || "<UPLOAD_URL>", body } } });
      const data = state.simulate ? await mockCall("upload", body) : await realFetch(API.UPLOAD_URL, body, state.token);
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "success", response: data } });

      // Polling for upload processing
      const tickRef = { pct: 0 } as any;
      dispatch({ type: "SET_STEP", step: "upload", patch: { polling: { isActive: true, logs: [] } } });
      await poller.start(
        "upload",
        data.fileId,
        (payload) => {
          tickRef.pct = payload.progress;
          dispatch({ type: "SET_STEP", step: "upload", patch: { polling: { isActive: true, logs: [ ...(state.steps.upload.polling?.logs || []), payload ], last: payload } } });
        },
        () => state.simulate ? mockCall("poll", { __pct: tickRef.pct }) : realFetch(API.POLL_URL, { fileId: data.fileId }),
        (p) => p.status === "completed"
      );
      setSnack("File uploaded.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "error", error: String(e) } });
    }
  }, [state.file, state.fileName, state.token, state.simulate, state.steps.upload.polling, poller]);

  const runPrepareOrPrepareSend = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "running", error: undefined } });
      const emails = state.emails.split(",").map((e) => e.trim()).filter(Boolean);
      const body = { emails, fileId: state.steps.upload.response?.fileId };
      const url = state.actionChoice === "prepare_send" ? (API.PREPARE_AND_SEND_URL || "<PREPARE_AND_SEND_URL>") : (API.PREPARE_URL || "<PREPARE_URL>");
      const mockName = state.actionChoice === "prepare_send" ? "prepare_send" : "prepare";
      dispatch({ type: "SET_STEP", step: "prepare", patch: { request: { url, body } } });
      const data = state.simulate ? await mockCall(mockName, body) : await realFetch(url, body, state.token);
      dispatch({ type: "SET_FIELD", key: "processId", value: data.processId });
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "success", response: data } });

      // Polling for prepare/prepare+send
      const tickRef = { pct: 0 } as any;
      dispatch({ type: "SET_STEP", step: "prepare", patch: { polling: { isActive: true, logs: [] } } });
      await poller.start(
        "prepare",
        data.processId,
        (payload) => {
          tickRef.pct = payload.progress;
          dispatch({ type: "SET_STEP", step: "prepare", patch: { polling: { isActive: true, logs: [ ...(state.steps.prepare.polling?.logs || []), payload ], last: payload } } });
        },
        () => state.simulate ? mockCall("poll", { __pct: tickRef.pct }) : realFetch(API.POLL_URL, { processId: data.processId }),
        (p) => p.status === "completed"
      );

      setSnack(state.actionChoice === "prepare_send" ? "Prepared and sent." : "Prepared.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "error", error: String(e) } });
    }
  }, [state.actionChoice, state.emails, state.steps.upload.response, state.simulate, state.token, state.steps.prepare.polling, poller]);

  const runSendOnly = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "running", error: undefined } });
      const body = { processId: state.processId };
      dispatch({ type: "SET_STEP", step: "send", patch: { request: { url: API.SEND_URL || "<SEND_URL>", body } } });
      const data = state.simulate ? await mockCall("send", body) : await realFetch(API.SEND_URL, body, state.token);
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "success", response: data } });

      // Polling for send
      const tickRef = { pct: 0 } as any;
      dispatch({ type: "SET_STEP", step: "send", patch: { polling: { isActive: true, logs: [] } } });
      await poller.start(
        "send",
        data.processId,
        (payload) => {
          tickRef.pct = payload.progress;
          dispatch({ type: "SET_STEP", step: "send", patch: { polling: { isActive: true, logs: [ ...(state.steps.send.polling?.logs || []), payload ], last: payload } } });
        },
        () => state.simulate ? mockCall("poll", { __pct: tickRef.pct }) : realFetch(API.POLL_URL, { processId: data.processId }),
        (p) => p.status === "completed"
      );

      setSnack("Contract sent via email.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "error", error: String(e) } });
    }
  }, [state.processId, state.simulate, state.token, state.steps.send.polling, poller]);

  // —— Automation ——
  const runAll = useCallback(async () => {
    try {
      dispatch({ type: "SET_FIELD", key: "autoRun", value: true });
      const d = state.autoDelayMs;
      // 1 → 2
      go("token");
      await wait(d);
      await runToken();
      // 3
      go("upload");
      await wait(d);
      await runUpload();
      // 4
      go("prepare");
      await wait(d);
      await runPrepareOrPrepareSend();
      // 5 (only if prepare-only)
      if (state.actionChoice === "prepare") {
        go("send");
        await wait(d);
        await runSendOnly();
      }
      // 6
      go("done");
      await wait(300);
      setSnack("All steps finished.");
    } finally {
      dispatch({ type: "SET_FIELD", key: "autoRun", value: false });
    }
  }, [runToken, runUpload, runPrepareOrPrepareSend, runSendOnly, state.autoDelayMs, state.actionChoice, wait]);

  // —— UI for left steps ——
  const Sidebar = (
    <Paper elevation={0} sx={{ p: 2, height: "100%", borderRight: 1, borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle1">Steps</Typography>
        <Tooltip title="Run all steps automatically with delays"><span>
          <Button size="small" variant="contained" startIcon={<PlayCircleIcon />} onClick={runAll} disabled={state.autoRun}>
            Execute All
          </Button>
        </span></Tooltip>
      </Stack>
      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={<Switch checked={state.simulate} onChange={(e) => dispatch({ type: "SET_FIELD", key: "simulate", value: e.target.checked })} />}
          label="Simulate API"
        />
      </Box>
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
          const ActiveIcon = s === "success" ? CheckCircleIcon : s === "running" ? PendingIcon : RadioButtonUncheckedIcon;
          return (
            <ListItem key={key} disablePadding>
              <ListItemButton selected={state.current === key} onClick={() => go(key)}>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText
                  primary={label}
                  secondary={<StepBadge s={s} />}
                  secondaryTypographyProps={{ component: "div" }}
                />
                <ActiveIcon fontSize="small" />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );

  // —— Per-step content ——
  const Main = (
    <Box sx={{ p: 3, flex: 1, overflow: "auto" }}>
      {state.current === "intro" && (
        <StepIntro state={state} dispatch={dispatch} onGetStarted={handleGetStarted} />
      )}
      {state.current === "token" && (
        <StepToken
          state={state}
          dispatch={dispatch}
          runToken={runToken}
          go={go}
        />
      )}
      {state.current === "upload" && (
        <StepUpload
          state={state}
          dispatch={dispatch}
          runUpload={runUpload}
          go={go}
          onStopPolling={() => {
            poller.stop("upload");
            const ps = state.steps.upload.polling!;
            dispatch({
              type: "SET_STEP",
              step: "upload",
              patch: { polling: { ...ps, isActive: false } },
            });
          }}
        />
      )}
      {state.current === "prepare" && (
        <StepPrepare
          state={state}
          dispatch={dispatch}
          runPrepareOrPrepareSend={runPrepareOrPrepareSend}
          go={go}
          onStopPolling={() => {
            poller.stop("prepare");
            const ps = state.steps.prepare.polling!;
            dispatch({
              type: "SET_STEP",
              step: "prepare",
              patch: { polling: { ...ps, isActive: false } },
            });
          }}
        />
      )}
      {state.current === "send" && (
        <StepSend
          state={state}
          runSendOnly={runSendOnly}
          go={go}
          onStopPolling={() => {
            poller.stop("send");
            const ps = state.steps.send.polling!;
            dispatch({
              type: "SET_STEP",
              step: "send",
              patch: { polling: { ...ps, isActive: false } },
            });
          }}
        />
      )}
      {state.current === "done" && <StepDone state={state} />}
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: "100vh", bgcolor: "background.default" }}>
        <Stack direction={{ xs: "column", md: "row" }} sx={{ height: "100%" }}>
          <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>{Sidebar}</Box>
          {Main}
        </Stack>
      </Box>
      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack(null)}>
        <Alert onClose={() => setSnack(null)} severity="info" sx={{ width: "100%" }}>
          {snack}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
