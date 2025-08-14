import React from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { Action, WizardState } from "../../types";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  onGetStarted: () => void;
}

export default function StepIntro({ state, dispatch, onGetStarted }: Props) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">API Testing Wizard</Typography>
      <Typography variant="body1">
        Enter your client credentials to begin. Click <strong>Get Started</strong> to proceed. All data is kept in
        memory only; reloading the page will reset the wizard.
      </Typography>
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
        <Button variant="contained" onClick={onGetStarted} endIcon={<PlayCircleIcon />}>Get Started</Button>
      </Stack>
    </Stack>
  );
}
