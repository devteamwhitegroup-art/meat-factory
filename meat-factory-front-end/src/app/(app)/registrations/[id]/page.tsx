import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { ImagePreviewLink } from "@/components/common/ImagePreviewLink";
import { getClient } from "@/lib/apollo/server";
import { RegistrationDetailDoc } from "@/lib/queries/registration";
import { ANIMAL_MN } from "@/lib/format/enum";
import { fmtDate, fmtDateTime } from "@/lib/format/date";
import { formatMNT, formatNumber } from "@/lib/format/money";
import { compact } from "@/lib/compact";
import { BackButton } from "@/components/common/BackButton";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { can } from "@/lib/auth/roles";

type Props = { params: Promise<{ id: string }> };

export default async function RegistrationDetailPage({ params }: Props) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: RegistrationDetailDoc,
    variables: { id },
  });
  const wrap = data?.registration;
  if (!wrap?.success || !wrap.registration) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        {wrap?.message ?? "Бүртгэл олдсонгүй"}
      </div>
    );
  }
  const r = wrap.registration;
  const status = r.status ?? "REGISTERED";
  const isOpen = status === "REGISTERED";

  // Only render next-step buttons the current role can actually use. The
  // back-end + page gates would block navigation anyway, but hiding the
  // buttons keeps the UI honest (e.g. a Guard never sees "Хэмжүүр").
  const role = (await cookies()).get(env.ROLE_COOKIE_NAME)?.value ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <BackButton href="/registrations" />
          <div>
            <div className="text-sm text-muted-foreground">
              Бүртгэлийн дугаар
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold">
                #{r.registrationNumber}
              </h1>
              <StatusBadge status={status} />
            </div>
            {r.registrationCode ? (
              <div className="font-mono text-xs text-muted-foreground">
                {r.registrationCode}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "REGISTERED" && can(role, "weigh") && (
            <Link
              href={`/registrations/${r.id}/weigh`}
              className={buttonVariants()}
            >
              Хэмжүүр
            </Link>
          )}
          {status === "WEIGHED" && (
            <>
              {can(role, "byproduct") && (
                <Link
                  href={`/registrations/${r.id}/byproduct`}
                  className={buttonVariants()}
                >
                  Дайвар
                </Link>
              )}
              {can(role, "verify") && (
                <Link
                  href={`/registrations/${r.id}/verify`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Баталгаажуулалт
                </Link>
              )}
            </>
          )}
          {(status === "VERIFIED" ||
            status === "PAYMENT_PENDING" ||
            status === "SETTLED") &&
            can(role, "settle") && (
              <Link
                href={`/registrations/${r.id}/settlement`}
                className={buttonVariants()}
              >
                Тооцоо
              </Link>
            )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Малчны мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Нэр</div>
            <div>{r.herder?.name ?? "—"}</div>
            <div className="text-muted-foreground">Регистрийн дугаар</div>
            <div>{r.herder?.registrationNo ?? "—"}</div>
            <div className="text-muted-foreground">Утас</div>
            <div>{r.herder?.phone ?? "—"}</div>
            <div className="text-muted-foreground">Дансны дугаар</div>
            <div>{r.herder?.bankAccount ?? "—"}</div>
            {r.herder?.bankName ? (
              <>
                <div className="text-muted-foreground">Банкны нэр</div>
                <div>{r.herder.bankName}</div>
              </>
            ) : null}
            {r.herder?.accountHolderName ? (
              <>
                <div className="text-muted-foreground">Эзэмшигчийн нэр</div>
                <div>{r.herder.accountHolderName}</div>
              </>
            ) : null}
            <div className="text-muted-foreground">Хаяг</div>
            <div>{r.herder?.address ?? "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Бүртгэлийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Машины дугаар</div>
            <div>{r.vehicleNumber ?? "—"}</div>
            <div className="text-muted-foreground">Тамга</div>
            <div>{r.stamp ?? "—"}</div>
            <div className="text-muted-foreground">Эмнэлгийн дугаар</div>
            <div className="flex items-center gap-2">
              <span>{r.medicalNumber ?? "—"}</span>
              <Badge
                className={
                  r.medicalNumberApproved
                    ? "border-0 bg-emerald-100 text-emerald-800"
                    : "border-0 bg-amber-100 text-amber-800"
                }
              >
                {r.medicalNumberApproved ? "Батлагдсан" : "Батлагдаагүй"}
              </Badge>
            </div>
            <div className="text-muted-foreground">Он сар</div>
            <div>{fmtDate(r.intakeDate)}</div>
            <div className="text-muted-foreground">Харуул</div>
            <div>{r.guard?.param ?? "—"}</div>
            <div className="text-muted-foreground">Зураг</div>
            <div>
              {r.photo?.url ? (
                <ImagePreviewLink
                  url={r.photo.url}
                  title={`Бүртгэл #${r.registrationNumber} — Зураг`}
                />
              ) : (
                "—"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Малын төрөл</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          {compact(r.animalLines).map((l) => (
            <div key={l.id!} className="rounded-md border px-3 py-1.5">
              {ANIMAL_MN[l.animalType ?? ""] ?? l.animalType}: <b>{l.count}</b>
            </div>
          ))}
        </CardContent>
      </Card>

      {compact(r.weighingEntries).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Жингийн түүх</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Жин (кг)</TableHead>
                  <TableHead>Үнэ/кг</TableHead>
                  <TableHead>Жинч</TableHead>
                  <TableHead>Цаг</TableHead>
                  <TableHead>Зураг</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Per animal-type ordinal (1..N) so numbering restarts at 1
                  // for each type and stays gap-free.
                  const ordinal: Record<string, number> = {};
                  const perType: Record<string, number> = {};
                  for (const w of [...compact(r.weighingEntries)].sort(
                    (a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0),
                  )) {
                    const t = w.animalType ?? "";
                    perType[t] = (perType[t] ?? 0) + 1;
                    if (w.id) ordinal[w.id] = perType[t];
                  }
                  return [...compact(r.weighingEntries)]
                    .sort((a, b) => (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0))
                    .map((w) => (
                      <TableRow key={w.id!}>
                        <TableCell>{ordinal[w.id!] ?? w.sequenceNo}</TableCell>
                        <TableCell>
                          {ANIMAL_MN[w.animalType ?? ""] ?? w.animalType}
                        </TableCell>
                        <TableCell>{formatNumber(w.weightKg)}</TableCell>
                        <TableCell>
                          {w.pricePerKg != null
                            ? formatNumber(w.pricePerKg)
                            : "—"}
                        </TableCell>
                        <TableCell>{w.scaleOperator?.param ?? "—"}</TableCell>
                        <TableCell>{fmtDateTime(w.createdAt)}</TableCell>
                        <TableCell>
                          {w.photo?.url ? (
                            <ImagePreviewLink
                              url={w.photo.url}
                              title={`Жинлэлт #${ordinal[w.id!] ?? w.sequenceNo} — Зураг`}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ));
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {compact(r.byproductLogs).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Дайвар бүтээгдэхүүн</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дайвар</TableHead>
                  <TableHead>Мал</TableHead>
                  <TableHead>Тоо</TableHead>
                  <TableHead>Нийт жин</TableHead>
                  <TableHead>Нярав</TableHead>
                  <TableHead>Зураг</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compact(r.byproductLogs).map((b) => (
                  <TableRow key={b.id!}>
                    <TableCell className="font-medium">
                      {b.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {b.animalType
                        ? (ANIMAL_MN[b.animalType] ?? b.animalType)
                        : "—"}
                    </TableCell>
                    <TableCell>{b.count}</TableCell>
                    <TableCell>
                      {b.totalWeightKg != null
                        ? formatNumber(b.totalWeightKg)
                        : "—"}
                    </TableCell>
                    <TableCell>{b.loggedBy?.param ?? "—"}</TableCell>
                    <TableCell>
                      {b.photo?.url ? (
                        <ImagePreviewLink
                          url={b.photo.url}
                          title={`Дайвар — ${b.name ?? "Зураг"}`}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {r.verification && (
        <Card>
          <CardHeader>
            <CardTitle>Баталгаажуулалт</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div>
              <div className="text-muted-foreground">Баталгаажуулсан</div>
              <div>
                {r.verification.firstVerifier?.param ?? "—"}{" "}
                {r.verification.firstVerifiedAt
                  ? `(${fmtDateTime(r.verification.firstVerifiedAt)})`
                  : ""}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {r.settlement && (
        <Card>
          <CardHeader>
            <CardTitle>Тооцоо</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Төрөл</TableHead>
                  <TableHead>Хүлээн авсан</TableHead>
                  <TableHead>Үнэ/кг</TableHead>
                  <TableHead>Мах</TableHead>
                  <TableHead>Дайвар</TableHead>
                  <TableHead>Бой зардал</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compact(r.settlement.lines).map((l) => (
                  <TableRow key={l.id!}>
                    <TableCell>
                      {ANIMAL_MN[l.animalType ?? ""] ?? l.animalType}
                    </TableCell>
                    <TableCell>{formatNumber(l.receivedWeightKg)}</TableCell>
                    <TableCell>{formatMNT(l.pricePerKg)}</TableCell>
                    <TableCell>{formatMNT(l.meatAmount)}</TableCell>
                    <TableCell>{formatMNT(l.byproductAmount)}</TableCell>
                    <TableCell>{formatMNT(l.slaughterCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="text-muted-foreground">Нийт мах</div>
              <div className="text-right">
                {formatMNT(r.settlement.totalMeatAmount)}
              </div>
              <div className="text-muted-foreground">Нийт дайвар</div>
              <div className="text-right">
                {formatMNT(r.settlement.totalByproductAmount)}
              </div>
              <div className="text-muted-foreground">Нийт бой зардал</div>
              <div className="text-right">
                {formatMNT(r.settlement.totalSlaughterCost)}
              </div>
              <div className="font-medium">
                Нийт төлбөр (бой зардал хасахаас өмнө)
              </div>
              <div className="text-right font-medium">
                {formatMNT(r.settlement.grossAmount)}
              </div>
              <div className="text-base font-semibold">Малчинд өгөх дүн</div>
              <div className="text-right text-base font-semibold">
                {formatMNT(r.settlement.netPayable)}
              </div>
              <div className="text-muted-foreground">Төлсөн эсэх</div>
              <div className="text-right">
                {r.settlement.isPaid
                  ? `Тийм (${fmtDateTime(r.settlement.paidAt)})`
                  : "Үгүй"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isOpen && (
        <div className="text-xs text-muted-foreground">
          Цуцлах болон бусад үйлдлийг тус тусын дэлгэцээс хий.
        </div>
      )}
    </div>
  );
}
