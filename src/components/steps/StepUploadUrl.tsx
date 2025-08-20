import React from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import JsonBox from "../JsonBox";
import { Action, StepKey, WizardState } from "../../types";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<Action>;
  runGetUploadUrl: () => void;
  go: (step: StepKey) => void;
}

export default function StepUploadUrl({ state, dispatch, runGetUploadUrl, go }: Props) {
  const s = state.steps.uploadUrl;
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Step 3 — Get Upload Url</Typography>
      <Typography variant="body2">Choose a PDF and request a pre-signed URL for upload.</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          sx={{ whiteSpace: "nowrap" }}
        >
          Choose PDF
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              dispatch({ type: "SET_FIELD", key: "file", value: f });
              dispatch({ type: "SET_FIELD", key: "fileName", value: f?.name || undefined });
            }}
          />
        </Button>
        <TextField
          label="Selected file"
          value={state.fileName || "(none)"}
          InputProps={{ readOnly: true }}
          fullWidth
          sx={{ maxWidth: 400 }}
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={runGetUploadUrl}
          disabled={s.status === "running" || !state.file}
          startIcon={<LinkIcon />}
        >
          Get Upload Url
        </Button>
      </Stack>
      <JsonBox label="Request" data={state.steps.uploadUrl.request} />
      <JsonBox label="Response" data={state.steps.uploadUrl.response} />
      {s.error && <JsonBox label="Error" data={s.error} />}
      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={() => go("upload")}>Next</Button>
      </Stack>
    </Stack>
  );
}
