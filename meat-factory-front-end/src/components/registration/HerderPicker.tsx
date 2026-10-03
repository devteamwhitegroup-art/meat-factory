"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
  herderSchema,
  type HerderFormValues,
} from "@/components/herder/HerderForm";
import { unwrap } from "@/lib/unwrap";
import { compact } from "@/lib/compact";

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
};

// Type-to-search (register number, name or phone — server-side iLike), no
// dropdown: matches list inline under the field, Enter picks the top one.
// Editing the text after a pick clears the selection.
export function HerderPicker({ value, onChange, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

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
    resolver: zodResolver(herderSchema),
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
    setSearch(h.registrationNo || h.name || "");
  }

  function onType(text: string) {
    setSearch(text);
    if (value) {
      onChange(null);
      onSelect?.(null);
    }
  }

  async function onSubmit(values: HerderFormValues) {
    try {
      const r = await createHerder({ variables: herderMutationVars(values) });
      const created = unwrap(r.data?.createHerder).herder;
      if (!created?.id) throw new Error("Хариу буцаасангүй");
      toast.success(`Малчин нэмэгдлээ: ${created.name}`);
      pick(created as PickedHerder);
      setOpen(false);
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
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
              <HerderFormFields form={form} />
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
