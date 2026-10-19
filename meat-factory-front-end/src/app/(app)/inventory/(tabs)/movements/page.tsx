import Link from "next/link";
import { SEGMENTED, segmentCls } from "@/components/ui/segmented";
import { EmptyState, ErrorNotice } from "@/components/common/ListState";
import { LinkPaginationFooter } from "@/components/common/PaginationFooter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getClient } from "@/lib/apollo/server";
import { InventoryMovementsDoc } from "@/lib/queries/inventory";
import { unwrapList } from "@/lib/unwrap";
import { MOVEMENT_SOURCE_MN } from "@/lib/format/enum";
import { getFactories } from "@/lib/factory/server";
import { factoryName, isByproductSite } from "@/lib/factory/factories";
import { DateRangeFilter } from "@/components/common/DateRangeFilter";
import { formatNumber } from "@/lib/format/money";
import { fmtDateTime } from "@/lib/format/date";
import { parseRange } from "@/lib/date/range";
import { requireCap } from "@/lib/auth/server";

type Props = {
  searchParams: Promise<{
    factory?: string;
    product?: string;
    page?: string;
    from?: string;
    to?: string;
  }>;
};

const PAGE_SIZE = 50;

const PRODUCT_TABS = [
  { value: "meat", label: "Мах", type: "MEAT" },
  { value: "byproduct", label: "Дайвар", type: "BYPRODUCT" },
] as const;

// Stock ledger: every IN / OUT with what it did to the balance (before →
// after) and the registration / shipment behind it. Meat first; F1/F2 нярав
// see byproducts as piece counts.
export default async function InventoryMovementsPage({ searchParams }: Props) {
  const session = await requireCap("INVENTORY_VIEW");
  const factories = await getFactories();
  const crossFactory = session.crossFactory;
  // Intake-site staff: byproducts as piece counts only (no kg).
  const countOnly =
    !crossFactory && !isByproductSite(factories, session.factory);
  const sp = await searchParams;
  const factory = factories.some((f) => f.code === sp.factory)
    ? (sp.factory as string)
    : null;
  const tab =
    PRODUCT_TABS.find((t) => t.value === sp.product) ?? PRODUCT_TABS[0];
  const page = Math.max(1, Number(sp.page) || 1);

  const href = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams();
    const merged = {
      factory: sp.factory ?? null,
      product: sp.product ?? null,
      from: sp.from ?? null,
      to: sp.to ?? null,
      page: null,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/inventory/movements?${qs}` : "/inventory/movements";
  };

  const { data } = await getClient().query({
    query: InventoryMovementsDoc,
    variables: {
      factory,
      productType: tab.type,
      inventoryItemId: null,
      movementType: null,
      source: null,
      dateRange: parseRange(sp.from, sp.to),
      limit: PAGE_SIZE,
      page,
    },
  });
  const { rows, count, error } = unwrapList(
    data?.inventoryMovements,
    data?.inventoryMovements?.movements,
  );
  const meat = tab.type === "MEAT";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className={SEGMENTED}>
            {PRODUCT_TABS.map((t) => (
              <Link
                key={t.value}
                href={href({ product: t.value === "meat" ? null : t.value })}
                className={segmentCls(t.value === tab.value)}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
        <DateRangeFilter />
      </div>
      <div className="text-sm text-muted-foreground">
        Нөөц рүү орсон / гарсан хөдөлгөөн бүр, үлдэгдэл хэрхэн өөрчлөгдсөн.
      </div>
      <ErrorNotice message={error} />
      {rows.length === 0 ? (
        <EmptyState>Хөдөлгөөн алга</EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Цаг</TableHead>
                {crossFactory ? <TableHead>Үйлдвэр</TableHead> : null}
                <TableHead>Бараа</TableHead>
                <TableHead>Шалтгаан</TableHead>
                <TableHead className="text-right">Өөрчлөлт</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => {
                const out = m.movementType === "OUT";
                // Meat moves kg; byproducts move pieces (гэдэс) or kg.
                const pieces =
                  !meat && (countOnly || Number(m.quantityCount ?? 0) > 0);
                const qty = pieces
                  ? Number(m.quantityCount ?? 0)
                  : Number(m.quantityKg ?? 0);
                const after = pieces
                  ? Number(m.balanceAfterCount ?? 0)
                  : Number(m.balanceAfterKg ?? 0);
                const before = out ? after + qty : after - qty;
                const unit = pieces ? "ш" : "кг";
                const item = m.item;
                const label =
                  item?.productType === "MEAT"
                    ? (item.animal?.name ?? "Мах")
                    : [item?.animal?.name, item?.byproductName]
                        .filter(Boolean)
                        .join(" · ");
                const source = MOVEMENT_SOURCE_MN[m.source ?? ""] ?? m.source;
                return (
                  <TableRow key={m.id!}>
                    <TableCell className="whitespace-nowrap">
                      {fmtDateTime(m.createdAt)}
                    </TableCell>
                    {crossFactory ? (
                      <TableCell>
                        {factoryName(factories, item?.factory)}
                      </TableCell>
                    ) : null}
                    <TableCell className="font-medium">{label}</TableCell>
                    <TableCell>
                      {source}
                      {m.registrationCode && m.sourceRegistrationId ? (
                        <>
                          {" · "}
                          <Link
                            href={`/registrations/${m.sourceRegistrationId}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {m.registrationCode}
                          </Link>
                        </>
                      ) : null}
                      {m.shipmentCode && m.sourceShipmentId ? (
                        <>
                          {" · "}
                          <Link
                            href={`/shipments/${m.sourceShipmentId}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {m.shipmentCode}
                          </Link>
                        </>
                      ) : null}
                      {m.notes && m.source === "MANUAL" ? (
                        <div className="text-xs text-muted-foreground">
                          {m.notes}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell
                      className={
                        "text-right font-medium tabular-nums " +
                        (out
                          ? "text-red-700 dark:text-red-400"
                          : "text-emerald-700 dark:text-emerald-400")
                      }
                    >
                      {out ? "−" : "+"}
                      {formatNumber(qty)} {unit}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      <span className="text-muted-foreground">
                        {formatNumber(before)} →{" "}
                      </span>
                      {formatNumber(after)} {unit}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <LinkPaginationFooter
        page={page}
        total={count}
        prevHref={page > 1 ? href({ page: String(page - 1) }) : null}
        nextHref={
          page * PAGE_SIZE < count ? href({ page: String(page + 1) }) : null
        }
      />
    </div>
  );
}
