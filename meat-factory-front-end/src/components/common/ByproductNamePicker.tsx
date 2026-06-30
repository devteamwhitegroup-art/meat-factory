"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ByproductWrapperListDoc } from "@/lib/queries/byproduct-wrapper";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import { compact } from "@/lib/compact";

// Cascading byproduct picker (animal → wrapper → constant) that yields the
// chosen constant's free-form NAME (byproductType enum is gone). Animal/wrapper
// are internal navigation; only the final name is reported via onChange.
// Values are kept defined (`|| null`) so the Selects stay controlled from the
// first render (no uncontrolled→controlled switch).
export function ByproductNamePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (name: string) => void;
  disabled?: boolean;
}) {
  const { animalTypes } = useAnimalCatalog();
  const [animal, setAnimal] = useState("");
  const [wrapperId, setWrapperId] = useState("");

  const { data } = useQuery(ByproductWrapperListDoc, {
    variables: { animalType: animal, isActive: true },
    skip: !animal,
    fetchPolicy: "cache-and-network",
  });
  const wrappers = compact(data?.byproductWrappers?.byproductWrappers);
  const selectedWrapper = wrappers.find((w) => w.id === wrapperId) ?? null;
  const constants = compact(selectedWrapper?.items).filter((i) => i.isActive);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select
        value={animal || null}
        onValueChange={(v) => {
          setAnimal(v ?? "");
          setWrapperId("");
          onChange("");
        }}
        disabled={disabled}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Мал">
            {animal ? animal : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {animalTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={wrapperId || null}
        onValueChange={(v) => {
          setWrapperId(v ?? "");
          onChange("");
        }}
        disabled={disabled || !animal || wrappers.length === 0}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Багц">
            {selectedWrapper?.name ?? undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {wrappers.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Багц алга
            </div>
          ) : (
            wrappers.map((w) => (
              <SelectItem key={w.id!} value={w.id!}>
                {w.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      <Select
        value={value || null}
        onValueChange={(v) => onChange(v ?? "")}
        disabled={disabled || !wrapperId || constants.length === 0}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Дайвар" />
        </SelectTrigger>
        <SelectContent>
          {constants.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Дайвар алга
            </div>
          ) : (
            constants.map((c) => (
              <SelectItem key={c.id!} value={c.name!}>
                {c.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
