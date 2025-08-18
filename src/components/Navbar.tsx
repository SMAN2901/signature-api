"use client";
import React from "react";
import { AppBar, Toolbar, Box } from "@mui/material";
import Image from "next/image";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Navbar() {
  return (
    <AppBar position="sticky" color="default" elevation={1}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Image
            src="https://az-cdn.selise.biz/selisecdn/cdn/signature/Selise%20signature%20new%20logo.svg"
            alt="Logo"
            width={120}
            height={32}
          />
        </Box>
        <ThemeSwitcher />
      </Toolbar>
    </AppBar>
  );
}
