import React from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import JsonBox from "../JsonBox";
import PollingPanel from "../PollingPanel";
import { StepKey, WizardState } from "../../types";

interface Props {
  state: WizardState;
  runUpload: () => void;
  go: (step: StepKey) => void;
  onStopPolling: () => void;
}

export default function StepUpload({ state, runUpload, go, onStopPolling }: Props) {
  const s = state.steps.upload;
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Step 4 — Upload File</Typography>
      <Typography variant="body2">Upload the selected PDF using the pre-signed URL.</Typography>
      <TextField label="Selected file" value={state.fileName || "(none)"} InputProps={{ readOnly: true }} fullWidth />
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={runUpload}
          disabled={s.status === "running" || !state.file || !state.uploadUrl}
        >
          Upload
        </Button>
      </Stack>
      <JsonBox label="Request" data={state.steps.upload.request} />
      <JsonBox label="Response" data={state.steps.upload.response} />
      {state.steps.upload.error && <JsonBox label="Error" data={state.steps.upload.error} />}
      <PollingPanel polling={state.steps.upload.polling} onStop={onStopPolling} />
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => go("prepare")}>Next</Button>
      </Stack>
    </Stack>
  );
}
