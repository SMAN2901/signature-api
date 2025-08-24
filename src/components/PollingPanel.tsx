import React from "react";
import { Button, Stack, CircularProgress } from "@mui/material";
import JsonBox from "./JsonBox";
import { StepState } from "../types";

interface Props {
  polling?: StepState["polling"];
  onStop?: () => void;
}

export default function PollingPanel({ polling, onStop }: Props) {
  if (!polling) return null;
  return (
    <Stack spacing={1}>
      {polling.isActive && onStop && (
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
      <JsonBox label="Polling Events" data={polling.logs} />
    </Stack>
  );
}
