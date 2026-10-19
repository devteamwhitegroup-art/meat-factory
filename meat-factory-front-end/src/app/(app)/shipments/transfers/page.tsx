import Link from "next/link";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClient } from "@/lib/apollo/server";
import { requireCap } from "@/lib/auth/server";
import { getFactories } from "@/lib/factory/server";
import { factoryName, isByproductSite } from "@/lib/factory/factories";
import { FactoryFilter } from "@/components/common/FactoryFilter";
import { FactoryTransfersDoc } from "@/lib/queries/factory-transfer";
import { unwrapList } from "@/lib/unwrap";
import { fmtDateTime } from "@/lib/format/date";
import { transferLineText } from "./_components/transfer-line";
import { TransferActions } from "./_components/TransferActions";

const STATUS_TABS = [
  { value: "IN_TRANSIT", label: "Замд" },
  { value: "RECEIVED", label: "Хүлээн авсан" },
  { value: "CANCELLED", label: "Цуцалсан" },
  { value: "ALL", label: "Бүгд" },
];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  IN_TRANSIT: { label: "Замд", cls: "border-0 bg-amber-100 text-amber-800" },
  RECEIVED: {
    label: "Хүлээн авсан",
    cls: "border-0 bg-emerald-100 text-emerald-800",
  },
  CANCELLED: { label: "Цуцалсан", cls: "border-0 bg-slate-200 text-slate-700" },
};

type Props = { searchParams: Promise<{ status?: string; factory?: string }> };

// Factory → factory shipments (no customer / invoice). The receiving factory
// confirms on arrival; the sender may cancel while it's in transit.
export default async function FactoryTransfersPage({ searchParams }: Props) {
  const session = await requireCap("SHIPMENT_VIEW");
  const factories = await getFactories();
  const sp = await searchParams;
  const status = STATUS_TABS.some((t) => t.value === sp.status)
    ? (sp.status as string)
    : "IN_TRANSIT";
  const factory =
    session.crossFactory && factories.some((f) => f.code === sp.factory)
      ? (sp.factory as string)
      : null;
  // Same tabs as /shipments (the byproduct site ships domestic only).
  const noExport =
    !session.crossFactory && isByproductSite(factories, session.factory);

  const { data } = await getClient().query({
    query: FactoryTransfersDoc,
    variables: {
      status: status === "ALL" ? null : (status as never),
      factory,
      page: 1,
      // ponytail: newest 50, no paging — add PaginationFooter if history grows.
      limit: 50,
    },
  });
  const { rows, count, error } = unwrapList(
    data?.factoryTransfers,
    data?.factoryTransfers?.transfers,
  );
  const canAct = session.can("SHIPMENT_MANAGE");
  // Staff act only for their own end; cross-factory roles for either.
  const mine = (code: string | null | undefined) =>
    session.crossFactory || code === session.factory;
  const statusHref = (s: string) => {
    const p = new URLSearchParams({ status: s });
    if (factory) p.set("factory", factory);
    return `/shipments/transfers?${p}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-2xl font-semibold">Ачилт</h1>
          <div className={SEGMENTED}>
            <Link href="/shipments?tab=domestic" className={segmentCls(false)}>
              Дотоод
            </Link>
            {noExport ? null : (
              <Link href="/shipments?tab=export" className={segmentCls(false)}>
                Экспорт
              </Link>
            )}
            <Link href="/shipments/transfers" className={segmentCls(true)}>
              Үйлдвэр хооронд
            </Link>
          </div>
        </div>
        {canAct ? (
          <Link href="/shipments/transfers/new" className={buttonVariants()}>
            Шинэ илгээлт
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {session.crossFactory ? <FactoryFilter /> : null}
        <div className={SEGMENTED}>
          {STATUS_TABS.map((t) => (
            <Link
              key={t.value}
              href={statusHref(t.value)}
              className={segmentCls(status === t.value)}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Илгээлт олдсонгүй
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Чиглэл</TableHead>
                <TableHead>Бараа</TableHead>
                <TableHead>Илгээсэн</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const badge = STATUS_BADGE[t.status ?? ""];
                const open = t.status === "IN_TRANSIT" && canAct;
                return (
                  <TableRow key={t.id!} className="align-top">
                    <TableCell className="font-mono text-xs">
                      {t.code}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {factoryName(factories, t.fromFactory)} →{" "}
                      {factoryName(factories, t.toFactory)}
                    </TableCell>
                    <TableCell>
                      <ul className="space-y-0.5 text-sm">
                        {(t.lines ?? []).map((l) =>
                          l ? <li key={l.id!}>{transferLineText(l)}</li> : null,
                        )}
                      </ul>
                      {t.notes ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {t.notes}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{fmtDateTime(t.createdAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.sentBy?.param}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <Badge className={badge?.cls ?? "border-0 bg-muted"}>
                        {badge?.label ?? t.status}
                      </Badge>
                      {t.closedAt ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {fmtDateTime(t.closedAt)} · {t.closedBy?.param}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {open ? (
                        <TransferActions
                          id={t.id!}
                          canReceive={mine(t.toFactory)}
                          canCancel={mine(t.fromFactory)}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="text-xs text-muted-foreground">Нийт: {count}</div>
    </div>
  );
}
