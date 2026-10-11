"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CreateRoleDoc,
  DeleteRoleDoc,
  PermissionCatalogDoc,
  RolesDoc,
  UpdateRoleDoc,
} from "@/lib/queries/admin";
import type { Permission } from "@/lib/gql/graphql";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { cn } from "@/lib/utils";

// id null = new role. crossFactory is fixed once created (BE rule).
type Draft = {
  id: string | null;
  name: string;
  permissions: Permission[];
  crossFactory: boolean;
  isSystem: boolean;
};

const BLANK: Draft = {
  id: null,
  name: "",
  permissions: [],
  crossFactory: false,
  isSystem: false,
};

// Roles = named permission sets. Admin assembles them here from the
// back-end's permission catalogue; staff accounts then pick a role.
export function RolesSection() {
  const { data, loading, refetch } = useQuery(RolesDoc, {
    fetchPolicy: "cache-and-network",
  });
  const { data: cat } = useQuery(PermissionCatalogDoc);
  const [create] = useMutation(CreateRoleDoc);
  const [update] = useMutation(UpdateRoleDoc);
  const [remove] = useMutation(DeleteRoleDoc);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const roles = compact(data?.roles?.roles);
  const groups = compact(cat?.permissionCatalog?.groups);
  const patch = (p: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...p } : d));

  function toggle(key: Permission) {
    setDraft((d) => {
      if (!d) return d;
      const has = d.permissions.includes(key);
      return {
        ...d,
        permissions: has
          ? d.permissions.filter((p) => p !== key)
          : [...d.permissions, key],
      };
    });
  }

  function toggleGroup(keys: Permission[]) {
    setDraft((d) => {
      if (!d) return d;
      const all = keys.every((k) => d.permissions.includes(k));
      const rest = d.permissions.filter((p) => !keys.includes(p));
      return { ...d, permissions: all ? rest : [...rest, ...keys] };
    });
  }

  async function onSave(d: Draft) {
    const name = d.name.trim();
    if (!name) return void toast.error("Эрхийн нэр оруулна уу");
    if (!d.isSystem && d.permissions.length === 0)
      return void toast.error("Дор хаяж нэг зөвшөөрөл сонгоно уу");
    setBusy(true);
    await runMutation(
      async () =>
        d.id
          ? (
              await update({
                variables: {
                  id: d.id,
                  name,
                  // The system role's permissions are fixed — send name only.
                  permissions: d.isSystem ? null : d.permissions,
                },
              })
            ).data?.updateRole
          : (
              await create({
                variables: {
                  name,
                  permissions: d.permissions,
                  crossFactory: d.crossFactory,
                },
              })
            ).data?.createRole,
      {
        success: `${name}: хадгаллаа`,
        onSuccess: async () => {
          setDraft(null);
          await refetch();
        },
      },
    );
    setBusy(false);
  }

  async function onDelete(id: string, name: string) {
    if (!confirm(`${name} — устгах уу?`)) return;
    await runMutation(
      async () => (await remove({ variables: { id } })).data?.deleteRole,
      { success: "Устгалаа", onSuccess: () => refetch() },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Эрх = зөвшөөрлийн багц. Ажилтан бүрт нэг эрх оноогдоно.
        </p>
        <Button className="gap-2" onClick={() => setDraft({ ...BLANK })}>
          <PlusIcon className="size-4" />
          Эрх нэмэх
        </Button>
      </div>

      {loading && roles.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : roles.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Эрх алга
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Хамрах хүрээ</TableHead>
                <TableHead>Зөвшөөрөл</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => {
                const perms = compact(r.permissions);
                return (
                  <TableRow key={r.id!}>
                    <TableCell className="font-medium">
                      {r.name}
                      {r.isSystem ? (
                        <Badge className="ml-2 border-0 bg-slate-800 text-white">
                          Систем
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.crossFactory ? "Бүх үйлдвэр" : "Нэг үйлдвэр"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {perms.length}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Засах"
                        onClick={() =>
                          setDraft({
                            id: r.id!,
                            name: r.name ?? "",
                            permissions: perms,
                            crossFactory: !!r.crossFactory,
                            isSystem: !!r.isSystem,
                          })
                        }
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      {r.isSystem ? null : (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Устгах"
                          onClick={() => onDelete(r.id!, r.name ?? "")}
                        >
                          <Trash2Icon className="size-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet
        open={draft !== null}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{draft?.id ? "Эрх засах" : "Шинэ эрх"}</SheetTitle>
            <SheetDescription>
              Энэ эрхтэй ажилтан юу хийж чадахыг сонгоно.
            </SheetDescription>
          </SheetHeader>
          {draft ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSave(draft);
              }}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Нэр</Label>
                <Input
                  id="role-name"
                  autoComplete="off"
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  className="h-11"
                />
              </div>

              <label
                className={cn(
                  "flex items-start gap-3 rounded-md border p-3",
                  draft.id ? "opacity-70" : "cursor-pointer",
                )}
              >
                <input
                  type="checkbox"
                  checked={draft.crossFactory}
                  disabled={!!draft.id}
                  onChange={(e) => patch({ crossFactory: e.target.checked })}
                  className="mt-1 h-4 w-4"
                />
                <div className="space-y-0.5">
                  <div className="font-medium">Бүх үйлдвэр</div>
                  <div className="text-xs text-muted-foreground">
                    Үйлдвэрт хамаарахгүй, бүх үйлдвэрийн мэдээллийг харна.
                    {draft.id ? " Үүсгэсний дараа өөрчлөх боломжгүй." : ""}
                  </div>
                </div>
              </label>

              {draft.isSystem ? (
                <p className="text-sm text-muted-foreground">
                  Системийн админ эрх бүх зөвшөөрлийг агуулна — нэрийг л
                  өөрчилж болно.
                </p>
              ) : (
                groups.map((g) => {
                  const keys = compact(g.items).map((i) => i.key);
                  const all = keys.every((k) => draft.permissions.includes(k));
                  return (
                    <fieldset key={g.group} className="space-y-1">
                      <legend className="mb-1 flex w-full items-center justify-between text-sm font-medium">
                        {g.group}
                        <button
                          type="button"
                          onClick={() => toggleGroup(keys)}
                          className="text-xs font-normal text-muted-foreground hover:text-foreground"
                        >
                          {all ? "Бүгдийг болих" : "Бүгдийг сонгох"}
                        </button>
                      </legend>
                      {compact(g.items).map((i) => (
                        <label
                          key={i.key}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={draft.permissions.includes(i.key)}
                            onChange={() => toggle(i.key)}
                            className="h-4 w-4"
                          />
                          {i.label}
                        </label>
                      ))}
                    </fieldset>
                  );
                })
              )}

              <Button type="submit" className="h-11 w-full" disabled={busy}>
                {busy ? "Хадгалж байна…" : "Хадгалах"}
              </Button>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
