"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { CustomerListDoc, CreateCustomerDoc } from "@/lib/queries/customer";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";
import { CUSTOMER_KIND_MN, CUSTOMER_KIND_COLOR } from "@/lib/format/enum";
import { cn } from "@/lib/utils";

type CustomerLite = {
  id: string;
  name: string;
  kind?: string | null;
  contactPhone?: string | null;
};

const KIND_VALUES = ["LOCAL_BROKER", "ULAANBAATAR_BROKER", "FACTORY"] as const;

function KindBadge({ kind }: { kind?: string | null }) {
  if (!kind) return null;
  return (
    <Badge
      className={cn(
        "text-[10px]",
        CUSTOMER_KIND_COLOR[kind] ?? "border-0 bg-muted",
      )}
    >
      {CUSTOMER_KIND_MN[kind] ?? kind}
    </Badge>
  );
}

// Required, searchable customer picker for the shipment form. Search is
// debounced and runs server-side via customers(search:, isActive:true). The
// list footer offers an inline "+ New customer" that creates one and auto-
// selects it without leaving the form.
export function CustomerCombobox({
  value,
  onChange,
  invalid,
  kind,
}: {
  value: string;
  onChange: (id: string) => void;
  invalid?: boolean;
  // Scopes the picker to one customer kind, set by the shipment context:
  // export → FACTORY, domestic LOCAL → LOCAL_BROKER, domestic UB →
  // ULAANBAATAR_BROKER. When set it both filters the search list AND locks the
  // kind of any customer created inline.
  kind?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  // Remember the chosen customer so the trigger can show it even when it's not
  // part of the current (filtered) result page.
  const [selectedCache, setSelectedCache] = useState<CustomerLite | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const { data, refetch } = useQuery(CustomerListDoc, {
    variables: {
      search: debounced || null,
      isActive: true,
      kind: (kind ?? null) as never,
      limit: 20,
      page: 1,
    },
    fetchPolicy: "cache-and-network",
  });
  const customers = compact(data?.customers?.customers);

  const selected =
    customers.find((c) => c.id === value) ??
    (selectedCache?.id === value ? selectedCache : null);

  function pick(c: CustomerLite) {
    setSelectedCache(c);
    onChange(c.id);
    setOpen(false);
  }

  function handleCreated(c: CustomerLite) {
    setSelectedCache(c);
    onChange(c.id);
    setDialogOpen(false);
    setOpen(false);
    refetch();
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            invalid ? "border-destructive" : "border-input",
            !selected && "text-muted-foreground",
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span className="truncate">{selected.name}</span>
              <KindBadge kind={selected.kind} />
            </span>
          ) : (
            "Харилцагч сонгоно уу"
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--anchor-width) min-w-72 gap-0 p-0"
        >
          <div className="border-b p-2">
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Нэр эсвэл утсаар хайх…"
              className="h-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {customers.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                Харилцагч олдсонгүй
              </div>
            ) : (
              customers.map((c) => (
                <button
                  key={c.id!}
                  type="button"
                  onClick={() =>
                    pick({
                      id: c.id!,
                      name: c.name ?? "",
                      kind: c.kind,
                      contactPhone: c.contactPhone,
                    })
                  }
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        value === c.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{c.name}</span>
                      {c.contactPhone ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {c.contactPhone}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <KindBadge kind={c.kind} />
                </button>
              ))
            )}
          </div>
          <div className="border-t p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setDialogOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-medium text-primary hover:bg-muted"
            >
              <Plus className="size-4" />
              Шинэ харилцагч
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <NewCustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
        lockedKind={kind}
      />
    </>
  );
}

// ── Inline create-customer dialog ──
// The form state lives in a child that mounts inside the popup, so Base UI's
// close-unmount resets every field on reopen (no reset-on-open effect needed).
function NewCustomerDialog({
  open,
  onOpenChange,
  onCreated,
  lockedKind,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (c: CustomerLite) => void;
  lockedKind?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Шинэ харилцагч</DialogTitle>
        </DialogHeader>
        <NewCustomerForm
          onCancel={() => onOpenChange(false)}
          onCreated={onCreated}
          lockedKind={lockedKind}
        />
      </DialogContent>
    </Dialog>
  );
}

function NewCustomerForm({
  onCancel,
  onCreated,
  lockedKind,
}: {
  onCancel: () => void;
  onCreated: (c: CustomerLite) => void;
  lockedKind?: string;
}) {
  const [createCustomer, { loading }] = useMutation(CreateCustomerDoc);
  const [name, setName] = useState("");
  // When the kind is locked by the shipment context it can't be changed here.
  const [kind, setKind] = useState<string>(lockedKind ?? "LOCAL_BROKER");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");

  async function onSubmit() {
    if (!name.trim()) {
      // Pre-submit validation toast stays inline (project convention).
      toast.error("Нэр оруулна уу");
      return;
    }
    let created: CustomerLite | null = null;
    await runMutation(
      async () => {
        const r = await createCustomer({
          variables: {
            name: name.trim(),
            kind: kind as never,
            contactPhone: contactPhone.trim() || null,
            address: address.trim() || null,
            bankAccount: bankAccount.trim() || null,
            registrationNumber: registrationNumber.trim() || null,
            taxId: taxId.trim() || null,
          },
        });
        const env = r.data?.createCustomer;
        if (env?.customer?.id) {
          created = {
            id: env.customer.id,
            name: env.customer.name ?? name.trim(),
            kind: env.customer.kind,
          };
        }
        return env;
      },
      {
        success: (d) => `Харилцагч ${d.customer?.name ?? ""} нэмэгдлээ`,
      },
    );
    if (created) onCreated(created);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Нэр *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Харилцагчийн нэр"
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Төрөл</Label>
        {lockedKind ? (
          <div className="flex h-10 items-center">
            <KindBadge kind={lockedKind} />
          </div>
        ) : (
          <Select
            value={kind}
            onValueChange={(v) => setKind(v ?? "LOCAL_BROKER")}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_VALUES.map((k) => (
                <SelectItem key={k} value={k}>
                  {CUSTOMER_KIND_MN[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Утас</Label>
          <Input
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Дансны дугаар</Label>
          <Input
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="h-10"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Хаяг</Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Улсын бүртгэлийн дугаар</Label>
          <Input
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            className="h-10"
          />
        </div>
        <div className="space-y-1.5">
          <Label>ТТД</Label>
          <Input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="h-10"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" onClick={onCancel}>
          Болих
        </Button>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? "..." : "Нэмэх"}
        </Button>
      </div>
    </div>
  );
}
