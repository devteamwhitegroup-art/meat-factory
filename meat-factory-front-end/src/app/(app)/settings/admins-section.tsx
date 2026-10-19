"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/ListState";
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
import { FactoryFilter } from "@/components/common/FactoryFilter";
import {
  AdminsDoc,
  CreateAdminDoc,
  DeleteAdminDoc,
  RolesDoc,
  UpdateAdminDoc,
} from "@/lib/queries/admin";
import { useFactories } from "@/lib/factory/FactoriesProvider";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { cn } from "@/lib/utils";

// id null = new account. Blank password while editing = keep the current one.
type Draft = {
  id: string | null;
  param: string;
  roleId: string;
  factory: string | null;
  password: string;
};

// Staff accounts: a table filtered by `?factory=`; create/edit in a side sheet.
// Each account gets one role (Систем тохиргоо › Эрх) and, unless the role
// spans every factory, one site.
export function AdminsSection() {
  const { data, loading, refetch } = useQuery(AdminsDoc, {
    fetchPolicy: "cache-and-network",
  });
  const { data: rolesData } = useQuery(RolesDoc);
  const [create] = useMutation(CreateAdminDoc);
  const [update] = useMutation(UpdateAdminDoc);
  const [remove] = useMutation(DeleteAdminDoc);
  const { active: factories, nameOf } = useFactories();
  const filter = useSearchParams().get("factory") || null;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const roles = compact(rolesData?.roles?.roles);
  const roleById = new Map(roles.map((r) => [r.id ?? "", r]));
  const admins = compact(data?.admins?.admins).filter(
    (a) => !filter || a.factory === filter,
  );
  const patch = (p: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...p } : d));
  const crossFactory = (roleId: string) => !!roleById.get(roleId)?.crossFactory;

  async function onSave(d: Draft) {
    const param = d.param.trim();
    const cross = crossFactory(d.roleId);
    if (!param) return void toast.error("Нэвтрэх нэр оруулна уу");
    if (!d.roleId) return void toast.error("Эрх сонгоно уу");
    if (!d.id && !d.password.trim())
      return void toast.error("Нууц үг оруулна уу");
    if (!cross && !d.factory) return void toast.error("Үйлдвэр сонгоно уу");
    const factory = cross ? null : d.factory;
    setBusy(true);
    await runMutation(
      async () =>
        d.id
          ? (
              await update({
                variables: {
                  id: d.id,
                  param,
                  roleId: d.roleId,
                  factory,
                  password: d.password.trim() || null,
                },
              })
            ).data?.updateAdmin
          : (
              await create({
                variables: {
                  param,
                  password: d.password,
                  roleId: d.roleId,
                  factory,
                },
              })
            ).data?.createAdmin,
      {
        success: `${param}: хадгаллаа`,
        onSuccess: async () => {
          setDraft(null);
          await refetch();
        },
      },
    );
    setBusy(false);
  }

  async function onDelete(id: string, param: string) {
    if (!confirm(`${param} — устгах уу?`)) return;
    await runMutation(
      async () => (await remove({ variables: { id } })).data?.deleteAdmin,
      { success: "Устгалаа", onSuccess: () => refetch() },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FactoryFilter />
        <Button
          className="gap-2"
          onClick={() =>
            setDraft({
              id: null,
              param: "",
              roleId: roles.find((r) => !r.isSystem)?.id ?? "",
              factory: filter,
              password: "",
            })
          }
        >
          <PlusIcon className="size-4" />
          Ажилтан нэмэх
        </Button>
      </div>

      {loading && admins.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : admins.length === 0 ? (
        <EmptyState>Ажилтан алга</EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэвтрэх нэр</TableHead>
                <TableHead>Эрх</TableHead>
                <TableHead>Үйлдвэр</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((a) => (
                <TableRow key={a.id!}>
                  <TableCell className="font-medium">{a.param}</TableCell>
                  <TableCell>
                    {a.role ? (
                      <Badge className="border-0 bg-blue-100 text-blue-800">
                        {a.role.name}
                      </Badge>
                    ) : (
                      <span className="text-destructive">Оноогоогүй</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {a.role?.crossFactory ? (
                      <span className="text-muted-foreground">Бүх үйлдвэр</span>
                    ) : a.factory ? (
                      nameOf(a.factory)
                    ) : (
                      <span className="text-destructive">Оноогоогүй</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Засах"
                      onClick={() =>
                        setDraft({
                          id: a.id!,
                          param: a.param ?? "",
                          roleId: a.role?.id ?? "",
                          factory: a.factory ?? null,
                          password: "",
                        })
                      }
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Устгах"
                      onClick={() => onDelete(a.id!, a.param ?? "")}
                    >
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {draft?.id ? "Ажилтан засах" : "Шинэ ажилтан"}
            </SheetTitle>
            <SheetDescription>
              Ажилтан нэвтрэх нэр, нууц үгээрээ системд нэвтэрнэ.
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
                <Label htmlFor="staff-param">Нэвтрэх нэр</Label>
                <Input
                  id="staff-param"
                  autoComplete="off"
                  value={draft.param}
                  onChange={(e) => patch({ param: e.target.value })}
                  className="h-11"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Эрх</legend>
                {roles.map((r) => (
                  <label
                    key={r.id!}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                      draft.roleId === r.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="staff-role"
                      checked={draft.roleId === r.id}
                      onChange={() => patch({ roleId: r.id! })}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="space-y-0.5">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.crossFactory ? "Бүх үйлдвэр · " : ""}
                        {compact(r.permissions).length} зөвшөөрөл
                      </div>
                    </div>
                  </label>
                ))}
              </fieldset>

              {draft.roleId && !crossFactory(draft.roleId) ? (
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">Үйлдвэр</legend>
                  {factories.map((f) => (
                    <label
                      key={f.code}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                        draft.factory === f.code
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="radio"
                        name="staff-factory"
                        checked={draft.factory === f.code}
                        onChange={() => patch({ factory: f.code })}
                        className="h-4 w-4"
                      />
                      {f.name}
                    </label>
                  ))}
                </fieldset>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="staff-password">
                  {draft.id ? "Шинэ нууц үг" : "Нууц үг"}
                </Label>
                <Input
                  id="staff-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder={draft.id ? "Хоосон бол хуучнаараа үлдэнэ" : ""}
                  value={draft.password}
                  onChange={(e) => patch({ password: e.target.value })}
                  className="h-11"
                />
              </div>

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
