"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddSalesExpenseDoc, RemoveSalesExpenseDoc } from "@/lib/queries/sales";
import { unwrap } from "@/lib/unwrap";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { fmtDate } from "@/lib/format/date";

export type ExpenseRow = {
  id: string;
  name: string;
  amountMnt: number;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
};

// Suggestions only (native datalist) — any name can be typed.
const PRESETS = ["Шатахуун", "Зогсоол", "Замын хураамж", "Ачигчийн хөлс"];

// Costs paid to complete this sale (fuel, parking…). They don't touch what
// the customer owes — the page shows net = amount − Σ expenses.
export function ExpensesCard({
  txId,
  expenses,
}: {
  txId: string;
  expenses: ExpenseRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addExpense, { loading: adding }] = useMutation(AddSalesExpenseDoc);
  const [removeExpense] = useMutation(RemoveSalesExpenseDoc);
  const [name, setName] = useState("");
  const [amt, setAmt] = useState("");
  const [notes, setNotes] = useState("");

  const total = expenses.reduce((s, r) => s + r.amountMnt, 0);

  async function onAdd() {
    const n = Number(amt);
    if (!name.trim()) return void toast.error("Зардлын нэр оруулна уу");
    if (!Number.isFinite(n) || n <= 0)
      return void toast.error("Дүн эерэг тоо байх ёстой");
    try {
      const r = await addExpense({
        variables: {
          salesTransactionId: txId,
          name: name.trim(),
          amountMnt: n,
          notes: notes.trim() || null,
        },
      });
      unwrap(r.data?.addSalesExpense);
      toast.success("Хадгалагдлаа");
      setName("");
      setAmt("");
      setNotes("");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onRemove(id: string) {
    if (!confirm("Энэ зардлыг устгах уу?")) return;
    try {
      const r = await removeExpense({ variables: { id } });
      unwrap(r.data?.removeSalesExpense);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Бусад зардал</CardTitle>
        <Badge className="border-0 bg-rose-100 text-rose-800 tabular-nums">
          Нийт: {formatMNT(total)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <div className="space-y-1.5">
            <Label className="text-xs">Зардал</Label>
            <Input
              list="sales-expense-presets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Шатахуун, зогсоол…"
              className="h-11"
            />
            <datalist id="sales-expense-presets">
              {PRESETS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Дүн (₮)</Label>
            <Input
              inputMode="numeric"
              value={amt ? formatNumber(amt) : ""}
              onChange={(e) => setAmt(e.target.value.replace(/\D/g, ""))}
              className="h-11 text-right tabular-nums"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Тэмдэглэл</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="заавал биш"
              className="h-11"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={onAdd} disabled={adding || pending} className="h-11">
              {adding ? "..." : "Нэмэх"}
            </Button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Зардал алга
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Зардал</TableHead>
                <TableHead className="text-right">Дүн</TableHead>
                <TableHead>Тэмдэглэл</TableHead>
                <TableHead>Бүртгэсэн</TableHead>
                <TableHead className="text-right">Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMNT(r.amountMnt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.notes ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.createdBy ?? "—"} · {fmtDate(r.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemove(r.id)}
                    >
                      Устгах
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
