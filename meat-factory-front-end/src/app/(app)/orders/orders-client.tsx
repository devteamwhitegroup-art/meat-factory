"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/common/ListState";
import { PaginationFooter } from "@/components/common/PaginationFooter";
import type { Order_Status } from "@/lib/gql/graphql";
import { CheckOrderPaymentDoc, OrderListDoc, SetOrderStatusDoc } from "@/lib/queries/order";
import { ORDER_STATUS_COLOR, ORDER_STATUS_MN, tabsOf } from "@/lib/format/enum";
import { formatMNT } from "@/lib/format/money";
import { fmtDateTime } from "@/lib/format/date";
import { useDebounced } from "@/lib/hooks/useDebounced";
import { runMutation } from "@/lib/runMutation";
import { compact } from "@/lib/compact";

const PAGE_SIZE = 20;

export function OrdersClient() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim(), 250);
  const { data, loading, refetch } = useQuery(OrderListDoc, {
    variables: {
      status: (status || null) as Order_Status | null,
      search: q || null,
      limit: PAGE_SIZE,
      page,
    },
    fetchPolicy: "cache-and-network",
  });
  const [setOrderStatus] = useMutation(SetOrderStatusDoc);
  const [checkPayment] = useMutation(CheckOrderPaymentDoc);

  const orders = compact(data?.orders?.orders);

  function move(id: string, to: Order_Status, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    return runMutation(
      async () => (await setOrderStatus({ variables: { id, status: to } })).data?.setOrderStatus,
      { success: ORDER_STATUS_MN[to], onSuccess: refetch },
    );
  }

  function recheck(id: string) {
    return runMutation(
      async () => (await checkPayment({ variables: { id } })).data?.checkOrderPayment,
      {
        success: (d) =>
          d.payment?.status === "PAID" ? "Төлбөр орсон байна" : "Төлбөр хараахан ороогүй",
        onSuccess: refetch,
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Хайх (код, нэр, утас)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Tabs
          value={status}
          onValueChange={(v) => {
            setStatus(v as string);
            setPage(1);
          }}
        >
          <TabsList>
            {tabsOf(ORDER_STATUS_MN).map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading && orders.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : orders.length === 0 ? (
        <EmptyState>Захиалга алга</EmptyState>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код / огноо</TableHead>
                <TableHead>Захиалагч</TableHead>
                <TableHead>Хүргэлт</TableHead>
                <TableHead>Багц</TableHead>
                <TableHead className="text-right">Дүн</TableHead>
                <TableHead>Төлөв</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id!} className="align-top">
                  <TableCell>
                    <div className="font-medium">{o.code}</div>
                    <div className="text-xs text-muted-foreground">{fmtDateTime(o.createdAt)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{o.customerName}</div>
                    <a href={`tel:${o.phone}`} className="text-sm text-primary">
                      {o.phone}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    <div className="text-sm">{o.address}</div>
                    {o.note && <div className="text-xs text-muted-foreground">{o.note}</div>}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {compact(o.lines).map((l, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium">
                          {l.quantity}× {l.name}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {compact(l.items)
                            .map((it) => (it.kg ? `${it.name} ${it.kg}кг` : it.name))
                            .join(", ")}
                        </div>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatMNT(o.total)}</TableCell>
                  <TableCell>
                    <Badge className={ORDER_STATUS_COLOR[o.status ?? ""]}>
                      {ORDER_STATUS_MN[o.status ?? ""] ?? "—"}
                    </Badge>
                    {o.paidAt && (
                      <div className="mt-1 text-xs text-muted-foreground">{fmtDateTime(o.paidAt)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {o.status === "PENDING" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => recheck(o.id!)}>
                            Төлбөр шалгах
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => move(o.id!, "PAID", "QPay-ээс гадуур төлсөн гэж тэмдэглэх үү?")}
                          >
                            Төлсөн
                          </Button>
                        </>
                      )}
                      {o.status === "PAID" && (
                        <Button size="sm" onClick={() => move(o.id!, "DELIVERED")}>
                          Хүргэсэн
                        </Button>
                      )}
                      {(o.status === "PENDING" || o.status === "PAID") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            move(
                              o.id!,
                              "CANCELLED",
                              o.status === "PAID"
                                ? "Төлбөрийг гараар буцаан шилжүүлнэ. Цуцлах уу?"
                                : "Захиалгыг цуцлах уу?",
                            )
                          }
                        >
                          Цуцлах
                        </Button>
                      )}
                    </div>
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
        total={data?.orders?.count ?? 0}
        pageSize={PAGE_SIZE}
        count={orders.length}
      />
    </div>
  );
}
