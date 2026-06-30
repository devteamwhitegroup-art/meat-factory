"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NumericKeypad } from "./NumericKeypad";

type Props = {
  value: string;
  onChange: (v: string) => void;
  label: string; // shown above the keypad inside the sheet
  placeholder?: string;
  className?: string;
};

// Tablet-friendly numeric field: read-only inline display that opens a
// full-size keypad sheet on tap. Sales/cargo flows can drop this in wherever
// the storekeeper enters a number on a touchscreen instead of a keyboard.
export function KeypadField({
  value,
  onChange,
  label,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  function openSheet() {
    setDraft(value);
    setOpen(true);
  }

  function onSubmit() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <>
      <Input
        readOnly
        value={value}
        onClick={openSheet}
        placeholder={placeholder}
        className={className}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-md rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <NumericKeypad
              value={draft}
              onChange={setDraft}
              onSubmit={onSubmit}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
