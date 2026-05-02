"use client";

import { C } from "@/lib/tokens";
import type { CSSProperties, ReactNode } from "react";

interface BtnProps {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
  type?: "button" | "submit";
}

export default function Btn({ children, primary, onClick, disabled, style: sx = {}, type = "button" }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="hvr"
      style={{
        padding: "12px 28px",
        fontSize: "16px",
        borderRadius: "4px",
        fontFamily: "'Crimson Pro', Georgia, serif",
        fontWeight: 600,
        letterSpacing: "0.03em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.38 : 1,
        backgroundColor: primary ? C.accent : "transparent",
        color: primary ? "#F4ECD8" : C.text,
        border: primary ? "none" : `1px solid ${C.border}`,
        ...sx,
      }}
    >
      {children}
    </button>
  );
}
