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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function HerderPicker({ value, onChange, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(HerderListDoc, {
    variables: { limit: 50, page: 1 },
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
  const labelFor = (h: (typeof herders)[number]) =>
    `${h.name}${h.registrationNo ? ` — ${h.registrationNo}` : ""}`;
  const itemLabels = Object.fromEntries(
    herders.filter((h) => h.id).map((h) => [h.id as string, labelFor(h)]),
  );

  async function onSubmit(values: HerderFormValues) {
    try {
      const r = await createHerder({ variables: herderMutationVars(values) });
      const created = unwrap(r.data?.createHerder).herder;
      if (!created?.id) throw new Error("Хариу буцаасангүй");
      toast.success(`Малчин нэмэгдлээ: ${created.name}`);
      // Refresh the list first so the new herder is in the options before we
      // set it as the selected value (otherwise the trigger renders blank).
      await refetch();
      onChange(created.id);
      onSelect?.(created as PickedHerder);
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Select
          items={itemLabels}
          value={value ?? null}
          onValueChange={(v) => {
            const id = (v as string) || null;
            onChange(id);
            onSelect?.(
              (herders.find((h) => h.id === id) as PickedHerder | undefined) ??
                null,
            );
          }}
        >
          <SelectTrigger className="h-12 w-full text-base">
            <SelectValue
              placeholder={fetching ? "Уншиж байна…" : "Малчин сонгох"}
            />
          </SelectTrigger>
          <SelectContent>
            {herders.map((h) => (
              <SelectItem key={h.id!} value={h.id!}>
                {labelFor(h)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 text-base"
        onClick={() => setOpen(true)}
      >
        Шинээр нэмэх
      </Button>
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
