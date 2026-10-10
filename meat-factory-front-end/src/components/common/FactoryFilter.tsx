"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FACTORY_MN } from "@/lib/format/enum";

const OPTIONS: [string, string][] = [
  ["", "Бүх үйлдвэр"],
  ...Object.entries(FACTORY_MN),
];

// Owner/admin list switch: writes `?factory=` (empty = both factories) so the
// server page refetches. Staff never see it — the BE scopes them already.
export function FactoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const current = sp.get("factory") ?? "";

  function set(v: string) {
    const params = new URLSearchParams(sp.toString());
    if (v) params.set("factory", v);
    else params.delete("factory");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="inline-flex h-9 items-center rounded-lg bg-muted p-1">
      {OPTIONS.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => set(v)}
          className={cn(
            "inline-flex h-7 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all",
            current === v
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground/60 hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Controlled factory select for owner/admin create forms (the BE requires a
// factory from them; staff are stamped with their own and never see this).
export function FactoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger aria-label="Үйлдвэр" className="h-11 min-w-40">
        <SelectValue placeholder="Үйлдвэр сонгох">
          {value ? <span>{FACTORY_MN[value]}</span> : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(FACTORY_MN).map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
