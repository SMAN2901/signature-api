"use client";
import React from "react";
import { Dialog, DialogTitle, DialogContent, FormControlLabel, Switch, Stack } from "@mui/material";

interface Settings {
  enableAutomation: boolean;
  useLocalStorage: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
}

export default function HiddenSettings({ open, onClose, settings, setSettings }: Props) {
  const handleToggle = (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, String(value));
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Stack>
          <FormControlLabel
            control={<Switch checked={settings.enableAutomation} onChange={handleToggle("enableAutomation")} />}
            label="Enable Automation"
          />
          <FormControlLabel
            control={<Switch checked={settings.useLocalStorage} onChange={handleToggle("useLocalStorage")} />}
            label="Use local storage"
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
