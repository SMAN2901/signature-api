import React from "react";
import { Paper, Typography } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function JsonBox({ label, data }: { label: string; data: any }) {
  return (
    <Paper variant="elevation" elevation={0}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <SyntaxHighlighter
        language="json"
        style={coldarkDark}
        customStyle={{ margin: 0, fontSize: 16, wordBreak: "break-word", borderRadius: 16 }}
        wrapLongLines
      >
        {data ? JSON.stringify(data, null, 2) : "—"}
      </SyntaxHighlighter>
    </Paper>
  );
}
