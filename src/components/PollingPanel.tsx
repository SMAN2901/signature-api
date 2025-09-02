import React from "react";
import { Button, Stack, CircularProgress } from "@mui/material";
import JsonBox from "./JsonBox";
import { StepKey, StepState } from "../types";

interface Props {
  polling?: StepState["polling"];
  onStop?: () => void;
  step?: StepKey;
}

function filterLogs(logs: unknown[], step?: StepKey) {
  if (!step) return logs;
  return logs.filter((e) => {
    const obj = e as Record<string, unknown>;
    const status = String(obj["Status"] ?? "").toLowerCase();
    if (step === "prepare") {
      return status.startsWith("preparation");
    }
    if (step === "send") {
      return status.startsWith("rollout");
    }
    return true;
  });
}

export default function PollingPanel({ polling, onStop, step }: Props) {
  if (!polling) return null;
  const showSpinner = polling.isActive && !!onStop;
  const logs = filterLogs(polling.logs, step);
  return (
    <Stack spacing={1}>
      {showSpinner && (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ alignSelf: "flex-end" }}
        >
          <CircularProgress size={16} />
          <Button
            size="small"
            variant="text"
            color="error"
            onClick={onStop}
          >
            Stop
          </Button>
        </Stack>
      )}
      <JsonBox label="Polling Events" data={logs} />
    </Stack>
  );
}
