"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Мал эмнэлгийн гэрчилгээний дугаар — exactly 7 digits. Mirrors BE.
const MEDICAL_NUMBER_RE = /^\d{7}$/;

// Input + "Нэмэх" for medical numbers. Several may be typed or pasted at once
// (space / comma separated) — a bulk intake often carries many certificates.
// Every token must be 7 digits or nothing is added. Blur adds too, so a number
// typed but not "added" isn't lost when the form is submitted.
export function MedicalNumberAdder({
  onAdd,
  disabled,
}: {
  onAdd: (numbers: string[]) => void | Promise<unknown>;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  async function add() {
    const tokens = draft.split(/[\s,;]+/).filter(Boolean);
    if (tokens.length === 0) return;
    const bad = tokens.filter((t) => !MEDICAL_NUMBER_RE.test(t));
    if (bad.length > 0) {
      toast.error(`7 оронтой тоо байх ёстой: ${bad.join(", ")}`);
      return;
    }
    setDraft("");
    await onAdd([...new Set(tokens)]);
  }

  return (
    <div className="flex gap-2">
      <Input
        value={draft}
        inputMode="numeric"
        placeholder="1234567"
        aria-label="Мал эмнэлгийн дугаар"
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d\s,;]/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        className="h-12 font-mono text-lg tabular-nums"
      />
      <Button
        type="button"
        variant="outline"
        className="h-12 gap-2"
        disabled={disabled}
        onClick={add}
      >
        <PlusIcon className="size-4" />
        Нэмэх
      </Button>
    </div>
  );
}
