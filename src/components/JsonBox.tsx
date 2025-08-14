import React from "react";
import { IconButton, Paper, Stack, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WrapTextIcon from "@mui/icons-material/WrapText";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function JsonBox({ label, data }: { label: string; data: any }) {
  const [wrap, setWrap] = React.useState(true);
  const json = data ? JSON.stringify(data, null, 2) : "";

  const handleCopy = () => {
    if (json && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(json).catch(() => {});
    }
  };

  return (
    <Paper variant="elevation" elevation={0} style={{ backgroundColor: "transparent" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
        <Stack direction="row">
          <IconButton size="small" onClick={handleCopy} aria-label="copy">
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
          <IconButton size="small" onClick={() => setWrap((w) => !w)} aria-label="toggle wrap">
            <WrapTextIcon fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>
      <SyntaxHighlighter
        language="json"
        style={coldarkDark}
        customStyle={{
          margin: 0,
          fontSize: 16,
          borderRadius: 16,
          wordBreak: "break-word",
          whiteSpace: wrap ? "pre-wrap" : "pre",
        }}
        wrapLongLines={wrap}
      >
        {json || "—"}
      </SyntaxHighlighter>
    </Paper>
  );
}
