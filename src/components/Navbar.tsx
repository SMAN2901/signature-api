"use client";
import React from "react";
import { AppBar, Toolbar, Box, IconButton } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import Image from "next/image";

interface NavbarProps {
  mode: "light" | "dark";
  toggleTheme: () => void;
}

export default function Navbar({ mode, toggleTheme }: NavbarProps) {
  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Image src="/file.svg" alt="Logo" width={32} height={32} />
        </Box>
        <IconButton onClick={toggleTheme}>
          {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
