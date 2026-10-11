"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon, PlusIcon } from "lucide-react";

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
  CreateFactoryDoc,
  FactoriesDoc,
  UpdateFactoryDoc,
} from "@/lib/queries/factory";
import type { Factory_Kind as FactoryKind } from "@/lib/gql/graphql";
import { FACTORY_KIND_HINT, FACTORY_KIND_MN } from "@/lib/factory/factories";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { cn } from "@/lib/utils";

const KINDS = Object.keys(FACTORY_KIND_MN) as FactoryKind[];

// editing = existing code (code + kind fixed); null code = new site.
type Draft = {
  editing: string | null;
  code: string;
  name: string;
  kind: FactoryKind;
  isActive: boolean;
};

const BLANK: Draft = {
  editing: null,
  code: "",
  name: "",
  kind: "LIVE_SLAUGHTER",
  isActive: true,
};

// Sites. Every factory rule branches on `kind`, so a new site is a row here,
// not a code change. Kind is fixed once records exist under it.
export function FactoriesSection() {
  const router = useRouter();
  const { data, loading, refetch } = useQuery(FactoriesDoc, {
    variables: { includeInactive: true },
    fetchPolicy: "cache-and-network",
  });
  const [create] = useMutation(CreateFactoryDoc);
  const [update] = useMutation(UpdateFactoryDoc);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  const factories = compact(data?.factories?.factories);
  const patch = (p: Partial<Draft>) =>
    setDraft((d) => (d ? { ...d, ...p } : d));

  async function onSave(d: Draft) {
    const name = d.name.trim();
    const code = d.code.trim().toUpperCase();
    if (!name) return void toast.error("Нэр оруулна уу");
    if (!d.editing && !/^[A-Z][A-Z0-9_]{1,31}$/.test(code))
      return void toast.error("Код: латин том үсэг, тоо, _ (ж: FACTORY_4)");
    setBusy(true);
    await runMutation(
      async () =>
        d.editing
          ? (
              await update({
                variables: { code: d.editing, name, isActive: d.isActive },
              })
            ).data?.updateFactory
          : (await create({ variables: { code, name, kind: d.kind } })).data
              ?.createFactory,
      {
        success: `${name}: хадгаллаа`,
        onSuccess: async () => {
          setDraft(null);
          await refetch();
          // Names/kinds are read server-side by the shell and pages.
          router.refresh();
        },
      },
    );
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Үйлдвэрийн төрөл нь бүртгэл, жинлэлт, баталгаажуулалтын урсгалыг
          тодорхойлно.
        </p>
        <Button className="gap-2" onClick={() => setDraft({ ...BLANK })}>
          <PlusIcon className="size-4" />
          Үйлдвэр нэмэх
        </Button>
      </div>

      {loading && factories.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Нэр</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {factories.map((f) => (
                <TableRow key={f.code}>
                  <TableCell className="font-mono text-xs">{f.code}</TableCell>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{FACTORY_KIND_MN[f.kind] ?? f.kind}</TableCell>
                  <TableCell>
                    {f.isActive ? (
                      <Badge className="border-0 bg-emerald-100 text-emerald-800">
                        Идэвхтэй
                      </Badge>
                    ) : (
                      <Badge variant="outline">Идэвхгүй</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Засах"
                      onClick={() =>
                        setDraft({
                          editing: f.code,
                          code: f.code,
                          name: f.name,
                          kind: f.kind,
                          isActive: f.isActive,
                        })
                      }
                    >
                      <PencilIcon className="size-4" />
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
              {draft?.editing ? "Үйлдвэр засах" : "Шинэ үйлдвэр"}
            </SheetTitle>
            <SheetDescription>
              Код болон төрлийг үүсгэсний дараа өөрчлөх боломжгүй.
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
                <Label htmlFor="factory-code">Код</Label>
                <Input
                  id="factory-code"
                  autoComplete="off"
                  placeholder="FACTORY_4"
                  value={draft.code}
                  disabled={!!draft.editing}
                  onChange={(e) =>
                    patch({ code: e.target.value.toUpperCase() })
                  }
                  className="h-11 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="factory-name">Нэр</Label>
                <Input
                  id="factory-name"
                  autoComplete="off"
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  className="h-11"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Төрөл</legend>
                {KINDS.map((k) => (
                  <label
                    key={k}
                    className={cn(
                      "flex items-start gap-3 rounded-md border p-3 transition-colors",
                      draft.kind === k
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                      draft.editing ? "opacity-70" : "cursor-pointer",
                    )}
                  >
                    <input
                      type="radio"
                      name="factory-kind"
                      checked={draft.kind === k}
                      disabled={!!draft.editing}
                      onChange={() => patch({ kind: k })}
                      className="mt-1 h-4 w-4"
                    />
                    <div className="space-y-0.5">
                      <div className="font-medium">{FACTORY_KIND_MN[k]}</div>
                      <div className="text-xs text-muted-foreground">
                        {FACTORY_KIND_HINT[k]}
                      </div>
                    </div>
                  </label>
                ))}
              </fieldset>

              {draft.editing ? (
                <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => patch({ isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <div>
                    <div className="font-medium">Идэвхтэй</div>
                    <div className="text-xs text-muted-foreground">
                      Идэвхгүй үйлдвэр сонголтод гарахгүй; түүх хэвээр үлдэнэ.
                    </div>
                  </div>
                </label>
              ) : null}

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
