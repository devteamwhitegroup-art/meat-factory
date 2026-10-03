"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdminsDoc,
  CreateAdminDoc,
  DeleteAdminDoc,
  UpdateAdminDoc,
} from "@/lib/queries/admin";
import { ROLE_MN } from "@/lib/format/enum";
import type { Admin_Role as AdminRole } from "@/lib/gql/graphql";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

// Blank password on an existing row = keep the current one.
type Row = { param: string; role: AdminRole; password: string };

const EMPTY: Row = { param: "", role: "ADMIN", password: "" };

// Staff accounts. One row per admin, saved individually; the trailing row
// creates. Only a SUPER_ADMIN may grant or edit SUPER_ADMIN (BE enforces).
export function AdminsSection({
  canDelete,
  canGrantSuper,
}: {
  canDelete: boolean;
  canGrantSuper: boolean;
}) {
  const { data, loading, refetch } = useQuery(AdminsDoc, {
    fetchPolicy: "cache-and-network",
  });
  const [create] = useMutation(CreateAdminDoc);
  const [update] = useMutation(UpdateAdminDoc);
  const [remove] = useMutation(DeleteAdminDoc);
  const [edits, setEdits] = useState<Record<string, Row>>({});
  const [newRow, setNewRow] = useState<Row>(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);

  const admins = compact(data?.admins?.admins);
  const roles = (Object.keys(ROLE_MN) as AdminRole[]).filter(
    (r) => canGrantSuper || r !== "SUPER_ADMIN",
  );

  function clearEdit(id: string) {
    setEdits((s) => {
      const n = { ...s };
      delete n[id];
      return n;
    });
  }

  async function save(id: string | null, r: Row) {
    const param = r.param.trim();
    if (!param) {
      toast.error("Нэвтрэх нэр оруулна уу");
      return;
    }
    if (!id && !r.password.trim()) {
      toast.error("Нууц үг оруулна уу");
      return;
    }
    setBusy(id ?? "new");
    await runMutation(
      async () =>
        id
          ? (
              await update({
                variables: {
                  id,
                  param,
                  role: r.role,
                  password: r.password.trim() || null,
                },
              })
            ).data?.updateAdmin
          : (
              await create({
                variables: { param, password: r.password, role: r.role },
              })
            ).data?.createAdmin,
      {
        success: `${param}: хадгаллаа`,
        onSuccess: async () => {
          if (id) clearEdit(id);
          else setNewRow(EMPTY);
          await refetch();
        },
      },
    );
    setBusy(null);
  }

  async function onDelete(id: string, param: string) {
    if (!confirm(`${param} — устгах уу?`)) return;
    setBusy(id);
    await runMutation(
      async () => (await remove({ variables: { id } })).data?.deleteAdmin,
      { success: "Устгалаа", onSuccess: () => refetch() },
    );
    setBusy(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ажилтны эрх</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && admins.length === 0 ? (
          <Skeleton className="h-24 w-full" />
        ) : null}
        {admins.map((a) => {
          const id = a.id!;
          const r = edits[id] ?? {
            param: a.param ?? "",
            role: a.role ?? "ADMIN",
            password: "",
          };
          return (
            <AdminRow
              key={id}
              row={r}
              roles={roles}
              locked={!canGrantSuper && a.role === "SUPER_ADMIN"}
              busy={busy === id}
              onChange={(p) =>
                setEdits((s) => ({ ...s, [id]: { ...r, ...p } }))
              }
              onSave={() => save(id, r)}
              onDelete={
                canDelete ? () => onDelete(id, a.param ?? "") : undefined
              }
            />
          );
        })}
        <AdminRow
          row={newRow}
          roles={roles}
          isNew
          busy={busy === "new"}
          onChange={(p) => setNewRow((s) => ({ ...s, ...p }))}
          onSave={() => save(null, newRow)}
        />
        <p className="text-xs text-muted-foreground">
          Нууц үгийг хоосон орхивол хуучнаараа үлдэнэ.
        </p>
      </CardContent>
    </Card>
  );
}

function AdminRow({
  row,
  roles,
  isNew,
  locked,
  busy,
  onChange,
  onSave,
  onDelete,
}: {
  row: Row;
  roles: AdminRole[];
  isNew?: boolean;
  locked?: boolean;
  busy: boolean;
  onChange: (patch: Partial<Row>) => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Input
        aria-label="Нэвтрэх нэр"
        placeholder={isNew ? "Шинэ ажилтан — нэвтрэх нэр" : "Нэвтрэх нэр"}
        value={row.param}
        disabled={locked}
        onChange={(e) => onChange({ param: e.target.value })}
        className="h-11 min-w-48 flex-1"
      />
      <Select
        value={row.role}
        disabled={locked}
        onValueChange={(v) => v && onChange({ role: v as AdminRole })}
      >
        <SelectTrigger aria-label="Эрх" className="h-11 min-w-40">
          <SelectValue>
            <span>{ROLE_MN[row.role] ?? row.role}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {roles.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_MN[r]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        aria-label="Нууц үг"
        type="password"
        autoComplete="new-password"
        placeholder={isNew ? "Нууц үг" : "Шинэ нууц үг"}
        value={row.password}
        disabled={locked}
        onChange={(e) => onChange({ password: e.target.value })}
        className="h-11 min-w-40 flex-1"
      />
      <Button
        variant={isNew ? "default" : "outline"}
        className="h-11 gap-2"
        disabled={busy || locked}
        onClick={onSave}
      >
        {isNew ? <PlusIcon className="size-4" /> : null}
        {busy ? "..." : isNew ? "Нэмэх" : "Хадгалах"}
      </Button>
      {onDelete ? (
        <Button
          variant="ghost"
          className="h-11"
          aria-label="Устгах"
          disabled={busy}
          onClick={onDelete}
        >
          <Trash2Icon className="text-destructive" />
        </Button>
      ) : null}
    </div>
  );
}
