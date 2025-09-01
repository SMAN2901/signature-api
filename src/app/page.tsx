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
  getEvents,
  prepareAndSendContract,
  prepareContract,
  sendContract,
  buildPrepareContractRequest,
  buildPrepareAndSendContractRequest,
  buildSendContractRequest,
  SendBody,
} from "../services/contract";
import { getUploadUrl, uploadFile, buildGetUploadUrlRequest } from "../services/storage";
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

interface PollingEvent {
  Status?: string;
  Success?: boolean;
  status?: string;
  [key: string]: unknown;
}

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
  documentId: undefined,
  title: "",
  signatureClass: 0,
  emails: "",
  actionChoice: "prepare",
  autoRun: false,
  autoDelayMs: 900,
  steps: {
    intro: { status: "idle" },
    token: { status: "idle" },
    uploadUrl: { status: "idle" },
    upload: { status: "idle" },
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
      const patch = action.patch.polling
        ? { ...action.patch, polling: { ...prev.polling, ...action.patch.polling } }
        : action.patch;
      return { ...state, steps: { ...state.steps, [action.step]: { ...prev, ...patch } } };
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
    const timerRef = useRef<
      Record<string, { timer: ReturnType<typeof setInterval>; resolve?: () => void }>
    >({});

  useEffect(() => {
    const timers = timerRef.current;
      return () => {
        // cleanup intervals on unmount
        Object.values(timers).forEach(({ timer }) => clearInterval(timer));
      };
  }, []);

    const start = useCallback(
      <T,>(
        key: StepKey,
        onTick: (payload: T) => void,
        fetcher: () => Promise<T>,
        isDone: (payload: T) => boolean,
        intervalMs = 5000
      ) => {
        return new Promise<T>((resolve, reject) => {
        const exec = async () => {
          try {
            // Kick an immediate tick, then interval
            const first = await fetcher();
            onTick(first);
            if (isDone(first)) {
              resolve(first);
              return;
            }
            const t = setInterval(async () => {
              try {
                const data = await fetcher();
                onTick(data);
                if (isDone(data)) {
                  clearInterval(t);
                  delete timerRef.current[key];
                  resolve(data);
                }
              } catch (err) {
                clearInterval(t);
                delete timerRef.current[key];
                reject(err);
              }
            }, intervalMs);
            timerRef.current[key] = { timer: t, resolve: () => resolve(undefined as T) };
          } catch (err) {
            reject(err);
          }
        };
        exec();
      });
    },
    []
  );

  const stop = useCallback((key: StepKey) => {
    const ref = timerRef.current[key];
    if (ref) {
      clearInterval(ref.timer);
      ref.resolve?.();
      delete timerRef.current[key];
    }
  }, []);

  return { start, stop };
}

// —— Page ——
export default function Page() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const [settings, setSettings] = useState({ enableAutomation: false, useLocalStorage: false });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const enableAutomation = localStorage.getItem("enableAutomation") === "true";
      const useLocal = localStorage.getItem("useLocalStorage") === "true";
      setSettings({ enableAutomation, useLocalStorage: useLocal });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storage = settings.useLocalStorage ? localStorage : sessionStorage;
      const env =
        (localStorage.getItem("environment") as WizardState["environment"] | null) ||
        "development";
      const cid = storage.getItem("clientId") || "";
      const cs = storage.getItem("clientSecret") || "";
      dispatch({ type: "SET_FIELD", key: "environment", value: env });
      dispatch({ type: "SET_FIELD", key: "clientId", value: cid });
      dispatch({ type: "SET_FIELD", key: "clientSecret", value: cs });
    }
  }, [settings.useLocalStorage]);


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
    } catch (e: unknown) {
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
      dispatch({ type: "SET_FIELD", key: "uploadUrl", value: data.UploadUrl });
      dispatch({ type: "SET_FIELD", key: "fileId", value: itemId });
      dispatch({ type: "SET_STEP", step: "uploadUrl", patch: { status: "success", response: data } });
      setSnack("Upload URL acquired.");
    } catch (e: unknown) {
      dispatch({ type: "SET_STEP", step: "uploadUrl", patch: { status: "error", error: String(e) } });
    }
  }, [state.fileName, state.fileId, state.token]);

  const runUpload = useCallback(async () => {
    if (!state.file) {
      setSnack("Please choose a PDF first.");
      return;
    }
    const uploadRes = state.steps.uploadUrl.response as {
      url?: string;
      uploadUrl?: string;
    } | undefined;
    const uploadUrl = state.uploadUrl || uploadRes?.url || uploadRes?.uploadUrl;
    if (!uploadUrl) {
      setSnack("Please get the upload URL first.");
      return;
    }
    try {
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "running", error: undefined } });
      dispatch({ type: "SET_STEP", step: "upload", patch: { request: { url: uploadUrl } } });
      const data = await uploadFile(uploadUrl, state.file);
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "success", response: data } });
      setSnack("File uploaded.");
    } catch (e: unknown) {
      dispatch({ type: "SET_STEP", step: "upload", patch: { status: "error", error: String(e) } });
    }
  }, [state.file, state.uploadUrl, state.steps.uploadUrl]);

  const runPrepareOrPrepareSend = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "running", error: undefined } });
      const emails = state.emails.split(",").map((e) => e.trim()).filter(Boolean);
      const body = { emails, fileId: state.fileId!, title: state.title, signatureClass: state.signatureClass };
      const { url, body: payload } =
        state.actionChoice === "prepare_send"
          ? buildPrepareAndSendContractRequest(body)
          : buildPrepareContractRequest(body);
      dispatch({ type: "SET_STEP", step: "prepare", patch: { request: { url, body: payload } } });
      const data =
        state.actionChoice === "prepare_send"
          ? await prepareAndSendContract(body, state.token)
          : await prepareContract(body, state.token);
      const documentId = data.Result?.DocumentId || data.documentId || data.DocumentId;
      if (!documentId) {
        throw new Error("DocumentId missing from response");
      }
      dispatch({ type: "SET_FIELD", key: "documentId", value: documentId });
      dispatch({ type: "SET_STEP", step: "prepare", patch: { response: data } });

      // Polling for prepare/prepare+send
      dispatch({ type: "SET_STEP", step: "prepare", patch: { polling: { isActive: true, logs: [] } } });
      const finalEvents = await poller.start<PollingEvent[]>(
        "prepare",
        (payload) => {
          dispatch({
            type: "SET_STEP",
            step: "prepare",
            patch: {
              polling: {
                isActive: true,
                logs: payload,
              },
            },
          });
        },
        () => getEvents<PollingEvent[]>({ DocumentId: documentId }, state.token),
        (events) =>
          events.some(
            (e) =>
              (e.Status === "preparation_success" && e.Success === true) ||
              e.Status === "preperation_failed"
          )
      );
      dispatch({
        type: "SET_STEP",
        step: "prepare",
        patch: {
          polling: {
            isActive: false,
            logs: finalEvents,
          },
        },
      });

      const failed = finalEvents.some((e) => e.Status === "preperation_failed");
      if (failed) {
        dispatch({
          type: "SET_STEP",
          step: "prepare",
          patch: { status: "error", error: "Preparation failed." },
        });
      } else {
        dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "success" } });
        setSnack(state.actionChoice === "prepare_send" ? "Prepared and sent." : "Prepared.");
      }
    } catch (e: unknown) {
      dispatch({ type: "SET_STEP", step: "prepare", patch: { status: "error", error: String(e) } });
    }
  }, [state.actionChoice, state.emails, state.fileId, state.title, state.signatureClass, state.token, poller]);

  const runSendOnly = useCallback(async () => {
    try {
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "running", error: undefined } });

      const emails = state.emails
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      const stampYStart = 100;
      const offsetY = 150;

      const body: SendBody = {
        DocumentId: state.documentId!,
        StampCoordinates: emails.map((email, idx) => ({
          FileId: state.fileId!,
          Width: 150,
          Height: 100,
          PageNumber: 0,
          X: 100,
          Y: stampYStart + idx * offsetY,
          SignatoryEmail: email,
        })),
        TextFieldCoordinates: emails.map((email, idx) => ({
          FileId: state.fileId!,
          Width: 127.7043269230769,
          Height: 27.043269230769226,
          PageNumber: 0,
          X: 300,
          Y: stampYStart + idx * offsetY,
          SignatoryEmail: email,
          Value: "Hello World!",
        })),
        StampPostInfoCoordinates: emails.map((email, idx) => ({
          FileId: state.fileId!,
          Width: 127.7043269230769,
          Height: 27.043269230769226,
          PageNumber: 0,
          X: 500,
          Y: stampYStart + idx * offsetY,
          EntityName: "AuditLog",
          PropertyName: "{StampTime}",
          SignatoryEmail: email,
        })),
      };
      const { url } = buildSendContractRequest(body);
      dispatch({ type: "SET_STEP", step: "send", patch: { request: { url, body } } });
      const data = await sendContract(body, state.token);
      dispatch({ type: "SET_STEP", step: "send", patch: { response: data } });

      // Polling for send
      dispatch({ type: "SET_STEP", step: "send", patch: { polling: { isActive: true, logs: [] } } });
      const finalEvents = await poller.start<PollingEvent[]>(
        "send",
        (payload) => {
          dispatch({
            type: "SET_STEP",
            step: "send",
            patch: {
              polling: {
                isActive: true,
                logs: payload,
              },
            },
          });
        },
        () => getEvents<PollingEvent[]>({ DocumentId: state.documentId! }, state.token),
        (events) =>
          events.some(
            (e) =>
              e.Status === "rollout_success" ||
              e.Status === "rollout_failed"
          )
      );
      dispatch({
        type: "SET_STEP",
        step: "send",
        patch: {
          polling: {
            isActive: false,
            logs: finalEvents,
          },
        },
      });

      const failed = finalEvents.some((e) => e.Status === "rolled_out_failed");
      if (failed) {
        dispatch({
          type: "SET_STEP",
          step: "send",
          patch: { status: "error", error: "Rollout failed." },
        });
      } else {
        dispatch({ type: "SET_STEP", step: "send", patch: { status: "success" } });
        setSnack("Contract sent via email.");
      }
    } catch (e: unknown) {
      dispatch({ type: "SET_STEP", step: "send", patch: { status: "error", error: String(e) } });
    }
  }, [state.documentId, state.token, state.emails, state.fileId, poller]);

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
          useLocalStorage={settings.useLocalStorage}
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
            <Sidenav
              state={state}
              dispatch={dispatch}
              stepsOrder={stepsOrder}
              runAll={runAll}
              go={go}
              settings={settings}
              setSettings={setSettings}
            />
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
