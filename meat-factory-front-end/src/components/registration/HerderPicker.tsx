"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { CreateHerderDoc, HerderListDoc } from "@/lib/queries/herder";
import {
  HerderFormFields,
  herderFormDefaults,
  herderMutationVars,
  herderQuickSchema,
  herderSchema,
  type HerderFormValues,
} from "@/components/herder/HerderForm";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { useDebounced } from "@/lib/hooks/useDebounced";

export type PickedHerder = {
  id: string;
  name?: string | null;
  registrationNo?: string | null;
  phone?: string | null;
  address?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
};

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  onSelect?: (herder: PickedHerder | null) => void;
  // эмч: add dialog asks only name / register / phone (+ optional address).
  quick?: boolean;
  // Search box text for a preselected `value` (editing an intake).
  initialLabel?: string;
};

// Type-to-search (register number, name or phone — server-side iLike), no
// dropdown: matches list inline under the field, Enter picks the top one.
// Editing the text after a pick clears the selection.
export function HerderPicker({
  value,
  onChange,
  onSelect,
  quick,
  initialLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(initialLabel ?? "");
  const debounced = useDebounced(search.trim(), 250);

  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(HerderListDoc, {
    variables: { search: debounced, limit: 10, page: 1 },
    skip: !debounced,
  });
  const [createHerder] = useMutation(CreateHerderDoc);
  const form = useForm<HerderFormValues>({
    resolver: zodResolver(quick ? herderQuickSchema : herderSchema),
    defaultValues: herderFormDefaults,
  });

  // When dialog closes, reset.
  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const herders = compact(data?.herders?.herders);
  const showResults = !value && !!debounced;

  function pick(h: PickedHerder) {
    onChange(h.id);
    onSelect?.(h);
    setSearch(h.name || h.registrationNo || "");
  }

  function onType(text: string) {
    setSearch(text);
    if (value) {
      onChange(null);
      onSelect?.(null);
    }
  }

  async function onSubmit(values: HerderFormValues) {
    let created: PickedHerder | null = null;
    await runMutation(
      async () => {
        const env = (
          await createHerder({ variables: herderMutationVars(values) })
        ).data?.createHerder;
        if (env?.herder?.id) created = env.herder as PickedHerder;
        return env;
      },
      {
        success: (d) => `Малчин нэмэгдлээ: ${d.herder?.name ?? ""}`,
        onSuccess: () => {
          if (created) pick(created);
          setOpen(false);
          refetch();
        },
      },
    );
  }

  // Not found → the add dialog opens with the typed register number filled in.
  function openCreate() {
    form.reset({ ...herderFormDefaults, registrationNo: search.trim() });
    setOpen(true);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            // Inside the intake <form> — Enter must pick, not submit.
            e.preventDefault();
            if (showResults && herders[0]) pick(herders[0] as PickedHerder);
          }}
          placeholder="Регистрийн дугаар, нэр эсвэл утсаар хайх"
          autoComplete="off"
          className="h-12 min-w-0 flex-1 text-base"
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-12 text-base"
          onClick={openCreate}
        >
          Шинээр нэмэх
        </Button>
      </div>
      {showResults ? (
        <div className="rounded-md border">
          {herders.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              {fetching ? "Хайж байна…" : "Малчин олдсонгүй — «Шинээр нэмэх»"}
            </div>
          ) : (
            herders.map((h) => (
              <button
                key={h.id!}
                type="button"
                onClick={() => pick(h as PickedHerder)}
                className="flex w-full items-center justify-between gap-3 border-b px-3 py-3 text-left text-base last:border-b-0 hover:bg-muted"
              >
                <span className="truncate font-medium">{h.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {[h.registrationNo, h.phone].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ малчин</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <HerderFormFields form={form} quick={quick} />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Хадгалах
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
