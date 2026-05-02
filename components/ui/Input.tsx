"use client";

import { C } from "@/lib/tokens";

interface InputProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}

export default function Input({ placeholder, value, onChange, type = "text" }: InputProps) {
  return (
    <input
      type={type}
      className="inp cp"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        backgroundColor: C.surface,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: "4px",
        padding: "11px 14px",
        fontSize: "16px",
        fontFamily: "'Crimson Pro', Georgia, serif",
      }}
    />
  );
}
