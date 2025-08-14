"use client";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
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
  IconButton,
  Switch,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
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
import StopIcon from "@mui/icons-material/Stop";

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

// —— Types ——

type StepKey =
  | "intro"
  | "token"
  | "upload"
  | "prepare"
  | "send"
  | "done";

interface StepState {
  status: "idle" | "running" | "success" | "error";
  request?: any;
  response?: any;
  error?: any;
  polling?: {
    isActive: boolean;
    logs: any[];
    last?: any;
  };
}

interface WizardState {
  current: StepKey;
  clientId: string;
  clientSecret: string;
  token?: string;
  file?: File | null;
  fileName?: string;
  processId?: string; // generic id returned by API to poll
  emails: string;
  actionChoice: "prepare" | "prepare_send";
  autoRun: boolean;
  autoDelayMs: number;
  simulate: boolean; // use mock APIs by default
  steps: Record<StepKey, StepState>;
}

const initialState: WizardState = {
  current: "intro",
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
    token: { status: "idle", polling: { isActive: false, logs: [] } },
    upload: { status: "idle", polling: { isActive: false, logs: [] } },
    prepare: { status: "idle", polling: { isActive: false, logs: [] } },
    send: { status: "idle", polling: { isActive: false, logs: [] } },
    done: { status: "idle" },
  },
};

// —— Reducer ——

type Action =
  | { type: "SET_FIELD"; key: keyof WizardState; value: any }
  | { type: "SET_STEP"; step: StepKey; patch: Partial<StepState> }
  | { type: "GOTO"; step: StepKey };

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
function JsonBox({ label, data }: { label: string; data: any }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
        {data ? JSON.stringify(data, null, 2) : "—"}
      </Box>
    </Paper>
  );
}

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
      dispatch({ type: "SET_STEP", step: "token", patch: { request: { url: API.TOKEN_URL || "<TOKEN_URL>", body } } });
      const data = state.simulate ? await mockCall("getToken", body) : await realFetch(API.TOKEN_URL, body);
      dispatch({ type: "SET_FIELD", key: "token", value: data.access_token });
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "success", response: data } });

      // Example polling after token (optional — included per requirements)
      const tickRef = { pct: 0 } as any;
      dispatch({ type: "SET_STEP", step: "token", patch: { polling: { isActive: true, logs: [] } } });
      await poller.start(
        "token",
        data.access_token,
        (payload) => {
          tickRef.pct = payload.progress;
          dispatch({ type: "SET_STEP", step: "token", patch: { polling: { isActive: true, logs: [ ...(state.steps.token.polling?.logs || []), payload ], last: payload } } });
        },
        () => state.simulate ? mockCall("poll", { __pct: tickRef.pct }) : realFetch(API.POLL_URL, { token: data.access_token }),
        (p) => p.status === "completed"
      );
      setSnack("Token acquired.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "error", error: String(e) } });
    }
  }, [state.clientId, state.clientSecret, state.simulate, state.steps.token.polling, poller]);

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
                <ListItemText primary={label} secondary={<StepBadge s={s} />} />
                <ActiveIcon fontSize="small" />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );

  // —— Per-step content ——
  function StepIntro() {
    return (
      <Stack spacing={2}>
        <Typography variant="h5">API Testing Wizard</Typography>
        <Typography variant="body1">
          Enter your client credentials to begin. Click <strong>Get Started</strong> to proceed. All data is kept in
          memory only; reloading the page will reset the wizard.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField label="Client ID" value={state.clientId} onChange={(e) => dispatch({ type: "SET_FIELD", key: "clientId", value: e.target.value })} fullWidth />
          <TextField label="Client Secret" type="password" value={state.clientSecret} onChange={(e) => dispatch({ type: "SET_FIELD", key: "clientSecret", value: e.target.value })} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleGetStarted} endIcon={<PlayCircleIcon />}>Get Started</Button>
        </Stack>
      </Stack>
    );
  }

  function PollingPanel({ step }: { step: StepKey }) {
    const ps = state.steps[step].polling;
    if (!ps) return null;
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2">Polling</Typography>
          {ps.last?.progress != null && (
            <Box sx={{ flex: 1 }}>
              <LinearProgress variant="determinate" value={Math.min(100, ps.last.progress)} />
            </Box>
          )}
          <Tooltip title="Stop polling for this step"><span>
            <IconButton size="small" onClick={() => poller.stop(step)}><StopIcon /></IconButton>
          </span></Tooltip>
        </Stack>
        <JsonBox label="Latest" data={ps.last} />
        <Box sx={{ maxHeight: 160, overflow: "auto", mt: 1 }}>
          <Typography variant="caption" sx={{ mb: 0.5, display: "block" }}>Logs</Typography>
          {(ps.logs || []).slice().reverse().map((row, i) => (
            <Box key={i} component="pre" sx={{ m: 0, p: 1, bgcolor: "grey.50", borderRadius: 1, fontSize: 12 }}>
              {JSON.stringify(row, null, 2)}
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  function StepToken() {
    const s = state.steps.token;
    return (
      <Stack spacing={2}>
        <Typography variant="h6">Step 2 — Get Token</Typography>
        <Typography variant="body2">Make an API call using the client credentials to obtain an access token.</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField label="Client ID" value={state.clientId} onChange={(e) => dispatch({ type: "SET_FIELD", key: "clientId", value: e.target.value })} fullWidth />
          <TextField label="Client Secret" type="password" value={state.clientSecret} onChange={(e) => dispatch({ type: "SET_FIELD", key: "clientSecret", value: e.target.value })} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={runToken} disabled={s.status === "running"} startIcon={<LockOpenIcon />}>Get Token</Button>
          {state.token && <Chip label="Token ready" color="success" />}
        </Stack>
        <JsonBox label="Request Payload" data={state.steps.token.request} />
        <JsonBox label="Response" data={state.steps.token.response} />
        <JsonBox label="Error" data={state.steps.token.error} />
        <PollingPanel step="token" />
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => go("upload")}>Next</Button>
        </Stack>
      </Stack>
    );
  }

  function StepUpload() {
    const s = state.steps.upload;
    return (
      <Stack spacing={2}>
        <Typography variant="h6">Step 3 — Upload File</Typography>
        <Typography variant="body2">Select a single PDF and upload it.</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button component="label" variant="contained" startIcon={<CloudUploadIcon />}>Choose PDF
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                dispatch({ type: "SET_FIELD", key: "file", value: f });
                dispatch({ type: "SET_FIELD", key: "fileName", value: f?.name || undefined });
              }}
            />
          </Button>
          <TextField label="Selected file" value={state.fileName || "(none)"} InputProps={{ readOnly: true }} fullWidth />
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={runUpload} disabled={s.status === "running" || !state.file}>Upload</Button>
        </Stack>
        <JsonBox label="Request Payload" data={state.steps.upload.request} />
        <JsonBox label="Response" data={state.steps.upload.response} />
        <JsonBox label="Error" data={state.steps.upload.error} />
        <PollingPanel step="upload" />
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => go("prepare")}>Next</Button>
        </Stack>
      </Stack>
    );
  }

  function StepPrepare() {
    const s = state.steps.prepare;
    return (
      <Stack spacing={2}>
        <Typography variant="h6">Step 4 — Prepare / Prepare and Send</Typography>
        <Typography variant="body2">Choose an action and provide a list of recipient emails (comma-separated). If you choose <em>Prepare and Send</em>, Step 5 will be skipped.</Typography>
        <FormControl fullWidth>
          <InputLabel id="action-label">Action</InputLabel>
          <Select
            labelId="action-label"
            label="Action"
            value={state.actionChoice}
            onChange={(e) => dispatch({ type: "SET_FIELD", key: "actionChoice", value: e.target.value })}
          >
            <MenuItem value="prepare">Prepare Contract</MenuItem>
            <MenuItem value="prepare_send">Prepare and Send Contract</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Emails (comma-separated)"
          placeholder="a@x.com, b@y.com"
          value={state.emails}
          onChange={(e) => dispatch({ type: "SET_FIELD", key: "emails", value: e.target.value })}
          fullWidth
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={runPrepareOrPrepareSend} disabled={s.status === "running" || !state.steps.upload.response}>Run</Button>
        </Stack>
        <JsonBox label="Request Payload" data={state.steps.prepare.request} />
        <JsonBox label="Response" data={state.steps.prepare.response} />
        <JsonBox label="Error" data={state.steps.prepare.error} />
        <PollingPanel step="prepare" />
        <Stack direction="row" spacing={2}>
          {state.actionChoice === "prepare" ? (
            <Button variant="outlined" onClick={() => go("send")}>Next</Button>
          ) : (
            <Button variant="outlined" onClick={() => go("done")}>Next</Button>
          )}
        </Stack>
      </Stack>
    );
  }

  function StepSend() {
    const s = state.steps.send;
    return (
      <Stack spacing={2}>
        <Typography variant="h6">Step 5 — Send Contract</Typography>
        <Typography variant="body2">If you prepared the contract in Step 4, send it now.</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={runSendOnly} disabled={s.status === "running" || !state.processId} startIcon={<SendIcon />}>Send Contract</Button>
        </Stack>
        <JsonBox label="Request Payload" data={state.steps.send.request} />
        <JsonBox label="Response" data={state.steps.send.response} />
        <JsonBox label="Error" data={state.steps.send.error} />
        <PollingPanel step="send" />
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => go("done")}>Next</Button>
        </Stack>
      </Stack>
    );
  }

  function StepDone() {
    const message = state.actionChoice === "prepare" ? "Contract is sent via email." : "Contract prepared and sent via email.";
    return (
      <Stack spacing={2}>
        <Typography variant="h5">Step 6 — Complete</Typography>
        <Alert severity="success">{message}</Alert>
        <Typography variant="body2">You can go back to any step on the left to review payloads and polling responses. Reloading the page will reset everything.</Typography>
      </Stack>
    );
  }

  const Main = (
    <Box sx={{ p: 3 }}>
      {state.current === "intro" && <StepIntro />}
      {state.current === "token" && <StepToken />}
      {state.current === "upload" && <StepUpload />}
      {state.current === "prepare" && <StepPrepare />}
      {state.current === "send" && <StepSend />}
      {state.current === "done" && <StepDone />}
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Paper elevation={2} sx={{ overflow: "hidden", borderRadius: 4 }}>
            <Stack direction={{ xs: "column", md: "row" }} sx={{ minHeight: 560 }}>
              <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0 }}>{Sidebar}</Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
              <Box sx={{ flex: 1 }}>{Main}</Box>
            </Stack>
          </Paper>
        </Container>
      </Box>
      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack(null)}>
        <Alert onClose={() => setSnack(null)} severity="info" sx={{ width: "100%" }}>{snack}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
