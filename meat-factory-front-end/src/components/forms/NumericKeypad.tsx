"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←"];

export function NumericKeypad({ value, onChange, onSubmit, disabled }: Props) {
  const root = useRef<HTMLDivElement>(null);

  // Physical keyboard works too: digits, . or ,, Backspace, Enter (submit).
  // Skipped while typing in a real input, and when another dialog is open on
  // top of this keypad, so it never steals other fields' keys. Re-subscribes
  // each render to read the current value.
  useEffect(() => {
    if (disabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      const dialogs = document.querySelectorAll('[role="dialog"]');
      if ([...dialogs].some((d) => !d.contains(root.current))) return;

      const key = /^\d$/.test(e.key)
        ? e.key
        : e.key === "." || e.key === ","
          ? "."
          : e.key === "Backspace"
            ? "←"
            : null;
      if (key) {
        e.preventDefault(); // not also "clicking" a focused keypad button
        press(key);
      } else if (e.key === "Enter" && value && Number(value) > 0) {
        e.preventDefault();
        onSubmit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function press(k: string) {
    if (disabled) return;
    if (k === "←") {
      onChange(value.length > 1 ? value.slice(0, -1) : "");
      return;
    }
    if (k === "." && value.includes(".")) return;
    if (k === "." && value === "") {
      onChange("0.");
      return;
    }
    if (value === "0" && k !== ".") {
      onChange(k);
      return;
    }
    onChange(value + k);
  }

  return (
    <div ref={root} className="space-y-3">
      <div className="rounded-lg bg-black p-6 text-center font-mono text-4xl text-emerald-400">
        {value || "0"}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <Button
            key={k}
            type="button"
            variant="outline"
            className="h-14 text-xl"
            onClick={() => press(k)}
            disabled={disabled}
          >
            {k}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-12"
          onClick={() => onChange("")}
          disabled={disabled}
        >
          Цэвэрлэх
        </Button>
        <Button
          type="button"
          className="h-12"
          onClick={onSubmit}
          disabled={disabled || !value || Number(value) <= 0}
        >
          Бүртгэх
        </Button>
      </div>
    </div>
  );
}
