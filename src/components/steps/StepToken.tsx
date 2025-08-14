import React from "react";
import { Button, Chip, Stack, TextField, Typography } from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import JsonBox from "../JsonBox";
import PollingPanel from "../PollingPanel";
import { Action, StepKey, WizardState } from "../../types";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  runToken: () => void;
  go: (step: StepKey) => void;
  onStopPolling: () => void;
}

export default function StepToken({ state, dispatch, runToken, go, onStopPolling }: Props) {
  const s = state.steps.token;
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Step 2 — Get Token</Typography>
      <Typography variant="body2">Make an API call using the client credentials to obtain an access token.</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Client ID"
          value={state.clientId}
          onChange={(e) => dispatch({ type: "SET_FIELD", key: "clientId", value: e.target.value })}
          fullWidth
        />
        <TextField
          label="Client Secret"
          type="password"
          value={state.clientSecret}
          onChange={(e) => dispatch({ type: "SET_FIELD", key: "clientSecret", value: e.target.value })}
          fullWidth
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={runToken} disabled={s.status === "running"} startIcon={<LockOpenIcon />}>Get Token</Button>
        {state.token && <Chip label="Token ready" color="success" />}
      </Stack>
      <JsonBox label="Request Payload" data={state.steps.token.request} />
      <JsonBox label="Response" data={state.steps.token.response} />
      <JsonBox label="Error" data={state.steps.token.error} />
      <PollingPanel polling={state.steps.token.polling} onStop={onStopPolling} />
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => go("upload")}>Next</Button>
      </Stack>
    </Stack>
  );
}
