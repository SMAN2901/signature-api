import React from "react";
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import JsonBox from "../JsonBox";
import PollingPanel from "../PollingPanel";
import { Action, StepKey, WizardState } from "../../types";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  runPrepareOrPrepareSend: () => void;
  go: (step: StepKey) => void;
  onStopPolling: () => void;
}

export default function StepPrepare({ state, dispatch, runPrepareOrPrepareSend, go, onStopPolling }: Props) {
  const s = state.steps.prepare;
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Step 4 — Prepare / Prepare and Send</Typography>
      <Typography variant="body2">
        Choose an action and provide a list of recipient emails (comma-separated). If you choose <em>Prepare and Send</em>,
        Step 5 will be skipped.
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="action-label">Action</InputLabel>
        <Select
          labelId="action-label"
          label="Action"
          value={state.actionChoice}
          onChange={(e) => dispatch({ type: "SET_FIELD", key: "actionChoice", value: e.target.value })}
        >
          <MenuItem value="prepare">Prepare Contract</MenuItem>
          <MenuItem value="prepare_send">Prepare and Send Contract</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Emails (comma-separated)"
        placeholder="a@x.com, b@y.com"
        value={state.emails}
        onChange={(e) => dispatch({ type: "SET_FIELD", key: "emails", value: e.target.value })}
        fullWidth
      />
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={runPrepareOrPrepareSend}
          disabled={s.status === "running" || !state.steps.upload.response}
        >
          Run
        </Button>
      </Stack>
      <JsonBox label="Request" data={state.steps.prepare.request} />
      <JsonBox label="Response" data={state.steps.prepare.response} />
      {state.steps.prepare.error && <JsonBox label="Error" data={state.steps.prepare.error} />}
      <PollingPanel polling={state.steps.prepare.polling} onStop={onStopPolling} />
      <Stack direction="row" spacing={2}>
        {state.actionChoice === "prepare" ? (
          <Button variant="outlined" onClick={() => go("send")}>Next</Button>
        ) : (
          <Button variant="outlined" onClick={() => go("done")}>Next</Button>
        )}
      </Stack>
    </Stack>
  );
}
