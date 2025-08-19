"use client";
import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SendIcon from "@mui/icons-material/Send";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsEthernetIcon from "@mui/icons-material/SettingsEthernet";
import LinkIcon from "@mui/icons-material/Link";
import { getToken, buildTokenRequest } from "../services/token";
import {
  pollProcess,
  prepareAndSendContract,
  prepareContract,
  sendContract,
  buildPrepareContractRequest,
  buildPrepareAndSendContractRequest,
  buildSendContractRequest,
} from "../services/contract";
import { getUploadUrl, uploadFile, pollUploadStatus, buildGetUploadUrlRequest } from "../services/storage";
import Navbar from "../components/Navbar";
import Sidenav from "../components/Sidenav";
import { v4 as uuidv4 } from 'uuid';

import { StepKey, WizardState, Action } from "../types";
import StepIntro from "../components/steps/StepIntro";
import StepToken from "../components/steps/StepToken";
import StepUploadUrl from "../components/steps/StepUploadUrl";
import StepUpload from "../components/steps/StepUpload";
import StepPrepare from "../components/steps/StepPrepare";
import StepSend from "../components/steps/StepSend";
import StepDone from "../components/steps/StepDone";

const initialState: WizardState = {
  current: "intro",
  environment: "development",
  clientId: "",
  clientSecret: "",
  token: undefined,
  file: null,
  fileName: undefined,
  uploadUrl: undefined,
  fileId: undefined,
  processId: undefined,
  emails: "",
  actionChoice: "prepare",
  autoRun: false,
  autoDelayMs: 900,
  steps: {
    intro: { status: "idle" },
    token: { status: "idle" },
    uploadUrl: { status: "idle" },
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

// —— Page ——
export default function Page() {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const env = (localStorage.getItem("environment") as any) || "development";
      const cid = sessionStorage.getItem("clientId") || "";
      const cs = sessionStorage.getItem("clientSecret") || "";
      dispatch({ type: "SET_FIELD", key: "environment", value: env });
      dispatch({ type: "SET_FIELD", key: "clientId", value: cid });
      dispatch({ type: "SET_FIELD", key: "clientSecret", value: cs });
    }
  }, []);
  const wait = useDelay();
  const poller = usePoller();
  const [snack, setSnack] = useState<string | null>(null);

  const stepsOrder: { key: StepKey; label: string; icon: React.ReactNode }[] = [
    { key: "intro", label: "Intro", icon: <SettingsEthernetIcon /> },
    { key: "token", label: "Get Token", icon: <LockOpenIcon /> },
    { key: "uploadUrl", label: "Get Upload Url", icon: <LinkIcon /> },
    { key: "upload", label: "Upload File", icon: <CloudUploadIcon /> },
    { key: "prepare", label: "Prepare / Prepare+Send", icon: <DescriptionIcon /> },
    { key: "send", label: "Send Contract", icon: <SendIcon /> },
    { key: "done", label: "Complete", icon: <CheckCircleIcon /> },
  ];

  const go = (step: StepKey) => dispatch({ type: "GOTO", step });

  // —— Handlers per step ——
  const handleGetStarted = async () => {
    dispatch({ type: "SET_STEP", step: "intro", patch: { status: "success" } });
    go("token");
  };

  const runToken = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "running", error: undefined } });
      const body = { client_id: state.clientId, client_secret: state.clientSecret, grant_type: "client_credentials" };
      const { url } = buildTokenRequest(state.clientId, state.clientSecret);
      dispatch({ type: "SET_STEP", step: "token", patch: { request: { url, body } } });
      const data = await getToken(state.clientId, state.clientSecret);
      dispatch({ type: "SET_FIELD", key: "token", value: data.access_token });
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "success", response: data } });
      setSnack("Token acquired.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "token", patch: { status: "error", error: String(e) } });
    }
  }, [state.clientId, state.clientSecret]);

  const runGetUploadUrl = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "uploadUrl", patch: { status: "running", error: undefined } });
      const itemId = state.fileId || uuidv4();
      const { url, body } = buildGetUploadUrlRequest(itemId, state.fileName || "file.pdf");
      dispatch({ type: "SET_STEP", step: "uploadUrl", patch: { request: { url, body } } });
      const data = await getUploadUrl(itemId, state.fileName || "file.pdf", state.token);
      dispatch({ type: "SET_FIELD", key: "uploadUrl", value: data.url || data.uploadUrl });
      dispatch({ type: "SET_FIELD", key: "fileId", value: data.fileId || data.itemId || itemId });
      dispatch({ type: "SET_STEP", step: "uploadUrl", patch: { status: "success", response: data } });
      setSnack("Upload URL acquired.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "uploadUrl", patch: { status: "error", error: String(e) } });
    }
  }, [state.fileName, state.fileId, state.token]);

  const runUpload = useCallback(async () => {
    if (!state.file) {
      setSnack("Please choose a PDF first.");
      return;
    }
    if (!state.uploadUrl) {
      setSnack("Please get the upload URL first.");
      return;
    }
    try {
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "running", error: undefined } });
      dispatch({ type: "SET_STEP", step: "upload", patch: { request: { url: state.uploadUrl } } });
      const data = await uploadFile(state.uploadUrl, state.file);
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "success", response: data } });

      // Polling for upload processing
      dispatch({ type: "SET_STEP", step: "upload", patch: { polling: { isActive: true, logs: [] } } });
      await poller.start(
        "upload",
        state.fileId!,
        (payload) => {
          dispatch({
            type: "SET_STEP",
            step: "upload",
            patch: {
              polling: {
                isActive: true,
                logs: [ ...(state.steps.upload.polling?.logs || []), payload ],
                last: payload,
              },
            },
          });
        },
        () => pollUploadStatus(state.fileId!),
        (p) => p.status === "completed"
      );
      setSnack("File uploaded.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "error", error: String(e) } });
    }
  }, [state.file, state.uploadUrl, state.fileId, state.steps.upload.polling, poller]);

  const runPrepareOrPrepareSend = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "running", error: undefined } });
      const emails = state.emails.split(",").map((e) => e.trim()).filter(Boolean);
      const body = { emails, fileId: state.fileId };
      const { url } =
        state.actionChoice === "prepare_send"
          ? buildPrepareAndSendContractRequest(body)
          : buildPrepareContractRequest(body);
      dispatch({ type: "SET_STEP", step: "prepare", patch: { request: { url, body } } });
      const data =
        state.actionChoice === "prepare_send"
          ? await prepareAndSendContract(body, state.token)
          : await prepareContract(body, state.token);
      dispatch({ type: "SET_FIELD", key: "processId", value: data.processId });
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "success", response: data } });

      // Polling for prepare/prepare+send
      dispatch({ type: "SET_STEP", step: "prepare", patch: { polling: { isActive: true, logs: [] } } });
      await poller.start(
        "prepare",
        data.processId,
        (payload) => {
          dispatch({ type: "SET_STEP", step: "prepare", patch: { polling: { isActive: true, logs: [ ...(state.steps.prepare.polling?.logs || []), payload ], last: payload } } });
        },
        () => pollProcess({ processId: data.processId }, state.token),
        (p) => p.status === "completed"
      );

      setSnack(state.actionChoice === "prepare_send" ? "Prepared and sent." : "Prepared.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "error", error: String(e) } });
    }
  }, [state.actionChoice, state.emails, state.fileId, state.token, state.steps.prepare.polling, poller]);

  const runSendOnly = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "running", error: undefined } });
      const body = { processId: state.processId };
      const { url } = buildSendContractRequest(body);
      dispatch({ type: "SET_STEP", step: "send", patch: { request: { url, body } } });
      const data = await sendContract(body, state.token);
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "success", response: data } });

      // Polling for send
      dispatch({ type: "SET_STEP", step: "send", patch: { polling: { isActive: true, logs: [] } } });
      await poller.start(
        "send",
        data.processId,
        (payload) => {
          dispatch({ type: "SET_STEP", step: "send", patch: { polling: { isActive: true, logs: [ ...(state.steps.send.polling?.logs || []), payload ], last: payload } } });
        },
        () => pollProcess({ processId: data.processId }, state.token),
        (p) => p.status === "completed"
      );

      setSnack("Contract sent via email.");
    } catch (e: any) {
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "error", error: String(e) } });
    }
  }, [state.processId, state.token, state.steps.send.polling, poller]);

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
      go("uploadUrl");
      await wait(d);
      await runGetUploadUrl();
      // 4
      go("upload");
      await wait(d);
      await runUpload();
      // 5
      go("prepare");
      await wait(d);
      await runPrepareOrPrepareSend();
      // 6 (only if prepare-only)
      if (state.actionChoice === "prepare") {
        go("send");
        await wait(d);
        await runSendOnly();
      }
      // 7
      go("done");
      await wait(300);
      setSnack("All steps finished.");
    } finally {
      dispatch({ type: "SET_FIELD", key: "autoRun", value: false });
    }
  }, [runToken, runGetUploadUrl, runUpload, runPrepareOrPrepareSend, runSendOnly, state.autoDelayMs, state.actionChoice, wait]);

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
      {state.current === "uploadUrl" && (
        <StepUploadUrl
          state={state}
          dispatch={dispatch}
          runGetUploadUrl={runGetUploadUrl}
          go={go}
        />
      )}
      {state.current === "upload" && (
        <StepUpload
          state={state}
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
    <>
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
        <Navbar />
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Box sx={{ width: { xs: "100%", md: 320 }, flexShrink: 0, overflow: "auto" }}>
            <Sidenav state={state} dispatch={dispatch} stepsOrder={stepsOrder} runAll={runAll} go={go} />
          </Box>
          {Main}
        </Box>
      </Box>
      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack(null)}>
        <Alert onClose={() => setSnack(null)} severity="info" sx={{ width: "100%" }}>
          {snack}
        </Alert>
      </Snackbar>
    </>
  );
}
