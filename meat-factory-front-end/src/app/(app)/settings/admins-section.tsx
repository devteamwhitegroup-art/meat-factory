"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { FactoryFilter } from "@/components/common/FactoryFilter";
import {
  AdminsDoc,
  CreateAdminDoc,
  DeleteAdminDoc,
  UpdateAdminDoc,
} from "@/lib/queries/admin";
import { FACTORY_MN, ROLE_MN } from "@/lib/format/enum";
import type { Admin_Role as AdminRole, Factory } from "@/lib/gql/graphql";
import { isCrossFactoryRole } from "@/lib/auth/roles";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { cn } from "@/lib/utils";

const ROLES = Object.keys(ROLE_MN) as AdminRole[];
const FACTORIES = Object.keys(FACTORY_MN) as Factory[];

// Shown on the role picker so the admin chooses by job, not by name.
const ROLE_DESC: Record<string, string> = {
  ADMIN: "Бүх эрх, бүх үйлдвэр. Ажилтан болон тохиргоог удирдана.",
  STOREKEEPER:
    "Бүртгэл, жинлэлт, үнэ тохиролцох, дайвар, нөөц, ачилт — бүх мэдээлэл оруулна.",
  ACCOUNTANT: "Малчны төлбөр, борлуулалт, харилцагч, тайлан.",
  DOCTOR: "Эмнэлгийн дугаар бүртгэж, баталгаажуулна.",
};

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "border-0 bg-slate-800 text-white",
  STOREKEEPER: "border-0 bg-blue-100 text-blue-800",
  ACCOUNTANT: "border-0 bg-emerald-100 text-emerald-800",
  DOCTOR: "border-0 bg-amber-100 text-amber-800",
};

// id null = new account. Blank password while editing = keep the current one.
type Draft = {
  id: string | null;
  param: string;
  role: AdminRole;
  factory: Factory | null;
  password: string;
};

const BLANK: Draft = {
  id: null,
  param: "",
  role: "STOREKEEPER",
  factory: null,
  password: "",
};

// Staff accounts: a table filtered by `?factory=`; create/edit in a side sheet.
// Only ADMIN reaches this page, and ADMIN assigns every other role to one
// factory.
export function AdminsSection() {
  const { data, loading, refetch } = useQuery(AdminsDoc, {
    fetchPolicy: "cache-and-network",
  });
  const [create] = useMutation(CreateAdminDoc);
  const [update] = useMutation(UpdateAdminDoc);
  const [remove] = useMutation(DeleteAdminDoc);
  const filter = (useSearchParams().get("factory") || null) as Factory | null;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const admins = compact(data?.admins?.admins).filter(
    (a) => !filter || a.factory === filter,
  );
  const patch = (p: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...p } : d));

  async function onSave(d: Draft) {
    const param = d.param.trim();
    const cross = isCrossFactoryRole(d.role);
    if (!param) return void toast.error("Нэвтрэх нэр оруулна уу");
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
                  role: d.role,
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
                  role: d.role,
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
          onClick={() => setDraft({ ...BLANK, factory: filter })}
        >
          <PlusIcon className="size-4" />
          Ажилтан нэмэх
        </Button>
      </div>

      {loading && admins.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : admins.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Ажилтан алга
        </div>
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
              {admins.map((a) => {
                const role = a.role ?? "STOREKEEPER";
                return (
                  <TableRow key={a.id!}>
                    <TableCell className="font-medium">{a.param}</TableCell>
                    <TableCell>
                      <Badge
                        className={ROLE_COLOR[role] ?? "border-0 bg-muted"}
                      >
                        {ROLE_MN[role] ?? role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isCrossFactoryRole(role) ? (
                        <span className="text-muted-foreground">
                          Бүх үйлдвэр
                        </span>
                      ) : a.factory ? (
                        FACTORY_MN[a.factory]
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
                            role,
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
                {ROLES.map((r) => (
                  <label
                    key={r}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
                      draft.role === r
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="staff-role"
                      checked={draft.role === r}
                      onChange={() => patch({ role: r })}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="space-y-0.5">
                      <div className="font-medium">{ROLE_MN[r]}</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLE_DESC[r]}
                      </div>
                    </div>
                  </label>
                ))}
              </fieldset>

              {!isCrossFactoryRole(draft.role) ? (
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-sm font-medium">Үйлдвэр</legend>
                  {FACTORIES.map((f) => (
                    <label
                      key={f}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                        draft.factory === f
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="radio"
                        name="staff-factory"
                        checked={draft.factory === f}
                        onChange={() => patch({ factory: f })}
                        className="h-4 w-4"
                      />
                      {FACTORY_MN[f]}
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
