import React from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function JsonBox({ label, data }: { label: string; data: any }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
      <Typography variant="subtitle2" gutterBottom>
        {label}
      </Typography>
      <Box
        component="pre"
        sx={{ m: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}
      >
        {data ? JSON.stringify(data, null, 2) : "—"}
      </Box>
    </Paper>
  );
}
