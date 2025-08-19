import React from "react";
import { Button, Stack } from "@mui/material";
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
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={onStop}
          sx={{ alignSelf: "flex-end" }}
        >
          Stop
        </Button>
      )}
      <JsonBox label="Polling Events" data={polling.logs} />
    </Stack>
  );
}
