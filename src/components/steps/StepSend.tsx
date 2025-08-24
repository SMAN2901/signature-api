import React from "react";
import { Button, Stack, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import JsonBox from "../JsonBox";
import PollingPanel from "../PollingPanel";
import { StepKey, WizardState } from "../../types";

interface Props {
  state: WizardState;
  runSendOnly: () => void;
  go: (step: StepKey) => void;
  onStopPolling: () => void;
}

export default function StepSend({ state, runSendOnly, go, onStopPolling }: Props) {
  const s = state.steps.send;
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Step 6 — Send Contract</Typography>
      <Typography variant="body2">If you prepared the contract in Step 5, send it now.</Typography>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={runSendOnly}
          disabled={s.status === "running" || !state.documentId}
          startIcon={<SendIcon />}
        >
          Send Contract
        </Button>
      </Stack>
      <JsonBox label="Request" data={state.steps.send.request} />
      <JsonBox label="Response" data={state.steps.send.response} />
      {state.steps.send.error && <JsonBox label="Error" data={state.steps.send.error} />}
      <PollingPanel
        polling={state.steps.send.polling}
        status={state.steps.send.status}
        onStop={onStopPolling}
      />
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => go("done")}>Next</Button>
      </Stack>
    </Stack>
  );
}
