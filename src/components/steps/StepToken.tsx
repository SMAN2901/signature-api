import React from "react";
import { Button, Chip, Stack, TextField, Typography } from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import JsonBox from "../JsonBox";
import { Action, StepKey, WizardState } from "../../types";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  runToken: () => void;
  go: (step: StepKey) => void;
  useLocalStorage: boolean;
}

export default function StepToken({ state, dispatch, runToken, go, useLocalStorage }: Props) {
  const s = state.steps.token;
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Step 2 — Get Token</Typography>
      <Typography variant="body2">Make an API call using the client credentials to obtain an access token.</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Client ID"
          value={state.clientId}
          onChange={(e) => {
            const v = e.target.value;
            dispatch({ type: "SET_FIELD", key: "clientId", value: v });
            if (typeof window !== "undefined") {
              const storage = useLocalStorage ? localStorage : sessionStorage;
              storage.setItem("clientId", v);
            }
          }}
          fullWidth
          sx={{ maxWidth: 400 }}
        />
        <TextField
          label="Client Secret"
          type="password"
          value={state.clientSecret}
          onChange={(e) => {
            const v = e.target.value;
            dispatch({ type: "SET_FIELD", key: "clientSecret", value: v });
            if (typeof window !== "undefined") {
              const storage = useLocalStorage ? localStorage : sessionStorage;
              storage.setItem("clientSecret", v);
            }
          }}
          fullWidth
          sx={{ maxWidth: 400 }}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={runToken} disabled={s.status === "running"} startIcon={<LockOpenIcon />}>Get Token</Button>
        {state.token && <Chip label="Token ready" color="success" />}
      </Stack>
      <JsonBox label="Request" data={state.steps.token.request} />
      <JsonBox label="Response" data={state.steps.token.response} />
      {!!s.error && <JsonBox label="Error" data={s.error} />}
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => go("uploadUrl")}>Next</Button>
      </Stack>
    </Stack>
  );
}
