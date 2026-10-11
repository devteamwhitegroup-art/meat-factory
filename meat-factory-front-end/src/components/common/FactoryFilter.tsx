"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { useFactories } from "@/lib/factory/FactoriesProvider";

// Cross-factory list switch: writes `?factory=` (empty = every factory) so the
// server page refetches. Staff never see it — the BE scopes them already.
export function FactoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { active } = useFactories();
  const current = sp.get("factory") ?? "";
  const options: [string, string][] = [
    ["", "Бүх үйлдвэр"],
    ...active.map((f): [string, string] => [f.code, f.name]),
  ];

  function set(v: string) {
    const params = new URLSearchParams(sp.toString());
    if (v) params.set("factory", v);
    else params.delete("factory");
    params.delete("page");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className={SEGMENTED}>
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => set(v)}
          className={segmentCls(current === v)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// Controlled factory select for cross-factory create forms (the BE requires a
// factory from them; staff are stamped with their own and never see this).
export function FactoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { active, nameOf } = useFactories();
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger aria-label="Үйлдвэр" className="h-11 min-w-40">
        <SelectValue placeholder="Үйлдвэр сонгох">
          {value ? <span>{nameOf(value)}</span> : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {active.map((f) => (
          <SelectItem key={f.code} value={f.code}>
            {f.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
