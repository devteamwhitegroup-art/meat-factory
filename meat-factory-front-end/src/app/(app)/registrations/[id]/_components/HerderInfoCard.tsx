"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { UpdateHerderDoc } from "@/lib/queries/herder";
import {
  HerderFormFields,
  herderMutationVars,
  herderSchema,
  type HerderFormValues,
} from "@/components/herder/HerderForm";
import { runMutation } from "@/lib/runMutation";

type Herder = {
  id: string;
  name?: string | null;
  registrationNo?: string | null;
  phone?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  addressId?: string | null;
  address?: string | null;
};

function valuesFromHerder(h: Herder | null): HerderFormValues {
  return {
    name: h?.name ?? "",
    registrationNo: h?.registrationNo ?? "",
    phone: h?.phone ?? "",
    bankAccount: h?.bankAccount ?? "",
    bankName: h?.bankName ?? "",
    accountHolderName: h?.accountHolderName ?? "",
    addressId: h?.addressId ?? "",
    // When an address row is linked we leave the free-form field blank —
    // it's just a fallback for ad-hoc strings (matches herders-client.tsx).
    address: h?.addressId ? "" : (h?.address ?? ""),
  };
}

// Read-only by default; admin/store-manager (STOREKEEPER) get an edit toggle
// so herder details can be corrected right from the registration without
// detouring through the standalone /herders CRUD page. Reuses that page's
// shared form fields/schema/mutation (HerderForm.tsx).
export function HerderInfoCard({
  herder,
  canEdit,
}: {
  herder: Herder | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [updateHerder] = useMutation(UpdateHerderDoc);
  const form = useForm<HerderFormValues>({
    resolver: zodResolver(herderSchema),
    defaultValues: valuesFromHerder(herder),
  });

  function startEdit() {
    form.reset(valuesFromHerder(herder));
    setEditing(true);
  }

  async function onSubmit(values: HerderFormValues) {
    if (!herder?.id) return;
    await runMutation(
      async () =>
        (
          await updateHerder({
            variables: { id: herder.id, ...herderMutationVars(values) },
          })
        ).data?.updateHerder,
      {
        success: "Малчны мэдээлэл шинэчлэгдлээ",
        onSuccess: () => {
          setEditing(false);
          router.refresh();
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Малчны мэдээлэл</CardTitle>
        {canEdit && !editing ? (
          <Button size="sm" variant="outline" onClick={startEdit}>
            Засах
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {editing ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3"
            >
              <HerderFormFields form={form} />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "..." : "Хадгалах"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Болих
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Нэр</div>
            <div>{herder?.name ?? "—"}</div>
            <div className="text-muted-foreground">Регистрийн дугаар</div>
            <div>{herder?.registrationNo ?? "—"}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{herder?.phone ?? "—"}</div>
            <div className="text-muted-foreground">Дансны дугаар</div>
            <div>{herder?.bankAccount ?? "—"}</div>
            {herder?.bankName ? (
              <>
                <div className="text-muted-foreground">Банкны нэр</div>
                <div>{herder.bankName}</div>
              </>
            ) : null}
            {herder?.accountHolderName ? (
              <>
                <div className="text-muted-foreground">
                  Эзэмшигчийн нэр
                </div>
                <div>{herder.accountHolderName}</div>
              </>
            ) : null}
            <div className="text-muted-foreground">Хаяг</div>
            <div>{herder?.address ?? "—"}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
