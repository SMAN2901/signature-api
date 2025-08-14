import React from "react";
import { Paper, Typography } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function JsonBox({ label, data }: { label: string; data: any }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <SyntaxHighlighter
        language="json"
        style={coldarkDark}
        customStyle={{ margin: 0, fontSize: 12, wordBreak: "break-word" }}
        wrapLongLines
      >
        {data ? JSON.stringify(data, null, 2) : "—"}
      </SyntaxHighlighter>
    </Paper>
  );
}
