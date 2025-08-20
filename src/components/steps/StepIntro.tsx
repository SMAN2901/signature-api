import React from "react";
import { Button, Stack, Typography, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
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
        Choose an environment and click <strong>Get Started</strong> to proceed. Client credentials will be entered in
        the next step. All data is kept in memory only; reloading the page will reset the wizard.
      </Typography>
      <FormControl fullWidth sx={{ maxWidth: 400 }}>
        <InputLabel id="env-label">Environment</InputLabel>
        <Select
          labelId="env-label"
          label="Environment"
          value={state.environment}
          onChange={(e) => {
            const env = e.target.value as typeof state.environment;
            dispatch({ type: "SET_FIELD", key: "environment", value: env });
            if (typeof window !== "undefined") {
              localStorage.setItem("environment", env);
            }
          }}
        >
          <MenuItem value="development">Development</MenuItem>
          <MenuItem value="staging">Staging</MenuItem>
          <MenuItem value="production">Production</MenuItem>
        </Select>
      </FormControl>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={onGetStarted} endIcon={<PlayCircleIcon />}>Get Started</Button>
      </Stack>
    </Stack>
  );
}
