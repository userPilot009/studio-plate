"use client";

import { C } from "@/lib/tokens";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function Chip({ label, selected, onClick, disabled }: ChipProps) {
  return (
    <button
      type="button"
      className="chip"
      onClick={onClick}
      style={{
        padding: "8px 18px",
        borderRadius: "24px",
        fontSize: "15px",
        fontFamily: "'Crimson Pro', Georgia, serif",
        backgroundColor: selected ? C.accent : C.surface,
        color: selected ? "#F4ECD8" : disabled ? "#2A2520" : C.muted,
        border: `1px solid ${selected ? C.accent : disabled ? "#1A1816" : C.border}`,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {label}
    </button>
  );
}
