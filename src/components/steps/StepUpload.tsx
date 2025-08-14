import React from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import JsonBox from "../JsonBox";
import PollingPanel from "../PollingPanel";
import { Action, StepKey, WizardState } from "../../types";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  runUpload: () => void;
  go: (step: StepKey) => void;
  onStopPolling: () => void;
}

export default function StepUpload({ state, dispatch, runUpload, go, onStopPolling }: Props) {
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
      {state.steps.upload.error && <JsonBox label="Error" data={state.steps.upload.error} />}
      <PollingPanel polling={state.steps.upload.polling} onStop={onStopPolling} />
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => go("prepare")}>Next</Button>
      </Stack>
    </Stack>
  );
}
