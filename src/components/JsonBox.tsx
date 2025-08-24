"use client";

import React from "react";
import dynamic from "next/dynamic";
import { IconButton, Paper, Stack, Typography } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WrapTextIcon from "@mui/icons-material/WrapText";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((m) => m.Prism),
  { ssr: false }
);

export default function JsonBox({ label, data }: { label: string; data: any }) {
  const [wrap, setWrap] = React.useState(false);
  const json = data ? JSON.stringify(data, null, 2) : "";
  const containerRef = React.useRef<HTMLDivElement>(null);
  const prevJson = React.useRef("");

  React.useEffect(() => {
    if (json && json !== prevJson.current && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevJson.current = json;
  }, [json]);

  const handleCopy = () => {
    if (!json) return;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(() => {});
    } else if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = json;
      textarea.style.position = "fixed";
      textarea.style.top = "0";
      textarea.style.left = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(textarea);
    }
  };

  return (
    <Paper
      ref={containerRef}
      variant="elevation"
      elevation={0}
      style={{ backgroundColor: "transparent" }}
    >
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
        wrapLines={wrap}
        wrapLongLines={wrap}
        lineProps={{ style: { whiteSpace: wrap ? "pre-wrap" : "pre", wordBreak: wrap ? "break-word" : "normal" } }}
        customStyle={{ margin: 0, fontSize: 16, borderRadius: 16, maxHeight: 400, overflow: "auto" }}
      >
        {json || "—"}
      </SyntaxHighlighter>
  </Paper>
);
}
