"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateHerderDoc,
  DeleteHerderDoc,
  HerderListDoc,
  UpdateHerderDoc,
} from "@/lib/queries/herder";
import {
  HerderFormFields,
  herderFormDefaults,
  herderMutationVars,
  herderSchema,
  type HerderFormValues,
} from "@/components/herder/HerderForm";
import { PaginationFooter } from "@/components/common/PaginationFooter";
import { runMutation } from "@/lib/runMutation";
import { fmtDate } from "@/lib/format/date";

const PAGE_SIZE = 20;

type EditTarget = {
  id?: string | null;
  name?: string | null;
  registrationNo?: string | null;
  phone?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  addressId?: string | null;
  address?: string | null;
  addressEntry?: { id?: string | null; name?: string | null } | null;
} | null;

export function HerdersClient() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const {
    data,
    loading: fetching,
    refetch,
  } = useQuery(HerderListDoc, {
    variables: { search: search || null, limit: PAGE_SIZE, page },
    fetchPolicy: "cache-and-network",
  });
  const [createHerder] = useMutation(CreateHerderDoc);
  const [updateHerder] = useMutation(UpdateHerderDoc);
  const [deleteHerder] = useMutation(DeleteHerderDoc);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
  const form = useForm<HerderFormValues>({
    resolver: zodResolver(herderSchema),
    defaultValues: herderFormDefaults,
  });

  function openCreate() {
    setEditing(null);
    form.reset(herderFormDefaults);
    setSheetOpen(true);
  }

  function openEdit(h: NonNullable<EditTarget>) {
    setEditing(h);
    form.reset({
      name: h.name ?? "",
      registrationNo: h.registrationNo ?? "",
      phone: h.phone ?? "",
      bankAccount: h.bankAccount ?? "",
      bankName: h.bankName ?? "",
      accountHolderName: h.accountHolderName ?? "",
      addressId: h.addressId ?? "",
      // When an address row is linked we leave the free-form field blank
      // — it's just a fallback for ad-hoc strings.
      address: h.addressId ? "" : (h.address ?? ""),
    });
    setSheetOpen(true);
  }

  async function onSubmit(values: HerderFormValues) {
    const sharedVars = herderMutationVars(values);
    await runMutation(
      async () => {
        if (editing?.id) {
          const r = await updateHerder({
            variables: { id: editing.id, ...sharedVars },
          });
          return r.data?.updateHerder;
        }
        const r = await createHerder({ variables: sharedVars });
        return r.data?.createHerder;
      },
      {
        success: editing?.id ? "Шинэчлэгдлээ" : "Малчин нэмэгдлээ",
        onSuccess: () => {
          setSheetOpen(false);
          refetch();
        },
      },
    );
  }

  async function onDelete(id: string) {
    if (!confirm("Устгах уу?")) return;
    await runMutation(
      async () =>
        (await deleteHerder({ variables: { id } })).data?.deleteHerder,
      { success: "Устгагдлаа", onSuccess: refetch },
    );
  }

  const herders = (data?.herders?.herders ?? []).filter(
    (h): h is NonNullable<typeof h> => !!h,
  );
  const total = data?.herders?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Хайх (нэр/регистр/утас)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Шинэ малчин</Button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>
                {editing ? "Малчин засах" : "Шинэ малчин"}
              </SheetTitle>
            </SheetHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 p-4"
              >
                <HerderFormFields form={form} />
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  >
                    Хадгалах
                  </Button>
                </div>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {fetching && herders.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : herders.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Малчин олдсонгүй
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Регистр</TableHead>
                <TableHead>Утас</TableHead>
                <TableHead>Хаяг</TableHead>
                <TableHead>Банк</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {herders.map((h) => (
                <TableRow key={h.id!}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.registrationNo}</TableCell>
                  <TableCell>{h.phone ?? "—"}</TableCell>
                  <TableCell>{h.address ?? "—"}</TableCell>
                  <TableCell className="text-xs">
                    {h.bankName || h.bankAccount ? (
                      <div className="space-y-0.5">
                        {h.bankName ? <div>{h.bankName}</div> : null}
                        {h.bankAccount ? (
                          <div className="font-mono">{h.bankAccount}</div>
                        ) : null}
                        {h.accountHolderName ? (
                          <div className="text-muted-foreground">
                            {h.accountHolderName}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{fmtDate(h.createdAt)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(h)}
                    >
                      Засах
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(h.id!)}
                    >
                      Устгах
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PaginationFooter
        page={page}
        onPageChange={setPage}
        total={total}
        pageSize={PAGE_SIZE}
        count={herders.length}
      />
    </div>
  );
}
