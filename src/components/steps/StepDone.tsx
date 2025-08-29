import React from "react";
import { Alert, Stack, Typography } from "@mui/material";
import { WizardState } from "../../types";

interface Props {
  state: WizardState;
}

export default function StepDone({ state }: Props) {
  const message = state.actionChoice === "prepare" ? "Contract is sent via email." : "Contract prepared and sent via email.";
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Step 7 — Complete</Typography>
      <Alert severity="success">{message}</Alert>
      <Typography variant="body2">
        You can revisit each step on the left to review payloads and polling responses. Reloading the page will reset
        everything.
      </Typography>
    </Stack>
  );
}
