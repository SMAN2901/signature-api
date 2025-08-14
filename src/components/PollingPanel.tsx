import React from "react";
import { Box, Button, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import JsonBox from "./JsonBox";
import { StepState } from "../types";

interface Props {
  polling?: StepState["polling"];
  onStop?: () => void;
}

export default function PollingPanel({ polling, onStop }: Props) {
  if (!polling) return null;
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">Polling</Typography>
        <Box sx={{ flexGrow: 1 }} />
        {polling.isActive && onStop && (
          <Button size="small" variant="text" color="error" onClick={onStop}>
            Stop
          </Button>
        )}
      </Stack>
      <JsonBox label="Logs" data={polling.logs} />
      {polling.last && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">Last Poll:</Typography>
          <LinearProgress
            variant="determinate"
            value={polling.last.progress || 0}
            sx={{ mt: 1 }}
          />
        </Box>
      )}
    </Paper>
  );
}
