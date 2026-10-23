import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Calculator,
  CircleCheckBig,
  ClipboardPlus,
  Package,
  Pencil,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
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
import { fmtDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/money";
import { getFactories } from "@/lib/factory/server";
import {
  factoryKind,
  factoryName,
  isPreButchered,
} from "@/lib/factory/factories";
import { compact } from "@/lib/compact";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorNotice } from "@/components/common/ListState";
import { cn } from "@/lib/utils";
import { canCreateRegistration } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/server";
import { MedicalNumbersCard } from "./_components/MedicalNumbersCard";
import { HerderInfoCard } from "./_components/HerderInfoCard";
import { RegistrationProgress } from "./_components/RegistrationProgress";

type Action = { label: string; href: string; icon: LucideIcon };

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
      <div className="space-y-6">
        <PageHeader back="/registrations" title="Бүртгэл" />
        <ErrorNotice message={wrap?.message ?? "Бүртгэл олдсонгүй"} />
      </div>
    );
  }
  const r = wrap.registration;
  const status = r.status ?? "REGISTERED";
  // FACTORY_2 (pre-butchered): no verify / byproduct steps — гэдэс is counted
  // on the weigh page and finance settles straight from WEIGHED.
  const [session, factories] = await Promise.all([
    getSession(),
    getFactories(),
  ]);
  const pre = isPreButchered(factories, r.factory);
  const bundles = compact(r.byproductBundles).filter((b) => b.id);

  // Only render next-step buttons the account can actually use. The
  // back-end + page gates would block navigation anyway, but hiding the
  // buttons keeps the UI honest.
  const canCreate = canCreateRegistration(
    session.perms,
    factoryKind(factories, session.factory),
  );

  const base = `/registrations/${r.id}`;
  const canSettle = session.can("SETTLEMENT_CREATE", "SETTLEMENT_PAY");
  const weighed = compact(r.weighingEntries).length > 0;
  const step = (label: string, path: string, icon: LucideIcon): Action => ({
    label,
    href: `${base}/${path}`,
    icon,
  });

  // The one thing to do next, worded as an instruction. `action` is null
  // when someone with other rights does it (the step still shows).
  let next: { title: string; hint: string; action: Action | null } | null =
    null;
  switch (status) {
    case "REGISTERED":
      // Хойд үйлдвэр weighs on the intake form → straight to verify.
      next =
        pre && weighed
          ? {
              title: "Жин баталгаажуулах",
              hint: "Оруулсан мах, жин, үнийг шалгаад баталгаажуулна.",
              action: session.can("REGISTRATION_WEIGH")
                ? step("Баталгаажуулах", "verify", ShieldCheck)
                : null,
            }
          : {
              title: "Жинлэх",
              hint: pre
                ? "Махыг жинлэж, кг тутмын үнийг оруулна."
                : "Малыг нэг нэгээр нь жинлүүрт жинлэнэ.",
              action: session.can("REGISTRATION_WEIGH")
                ? step("Жинлэх", "weigh", Scale)
                : null,
            };
      break;
    case "WEIGHED":
      next = pre
        ? {
            title: "Тооцоо хийх",
            hint: "Малчинд олгох мөнгөн дүнг тооцоолно.",
            action: canSettle ? step("Тооцоо хийх", "settlement", Calculator) : null,
          }
        : {
            title: "Баталгаажуулах",
            hint: "Жинг шалгаж, малчинд гарын үсэг зуруулна.",
            action: session.can("REGISTRATION_VERIFY")
              ? step("Баталгаажуулах", "verify", ShieldCheck)
              : null,
          };
      break;
    case "VERIFIED":
      next =
        bundles.length === 0 && session.can("REGISTRATION_WEIGH")
          ? {
              title: "Гэдэс тоолох",
              hint: "Малчинд өгөх болон үйлдвэрт үлдэх гэдсийг тоолно. Дараа нь тооцоо хийнэ.",
              action: step("Гэдэс тоолох", "byproduct", Package),
            }
          : {
              title: "Тооцоо хийх",
              hint: "Малчинд олгох мөнгөн дүнг тооцоолно.",
              action: canSettle
                ? step("Тооцоо хийх", "settlement", Calculator)
                : null,
            };
      break;
    case "PAYMENT_PENDING":
      next = {
        title: "Төлбөр олгох",
        hint: "Малчинд мөнгийг шилжүүлээд, «Төлсөн» гэж тэмдэглэнэ.",
        action: session.can("SETTLEMENT_PAY")
          ? step("Төлбөр олгох", "settlement", Calculator)
          : null,
      };
      break;
    case "PARTIALLY_SETTLED":
      next = {
        title: "Үлдэгдэл олгох",
        hint: "Эмнэлгийн дугаар баталгаажсаны дараа үлдэгдэл мөнгийг олгоно.",
        action: session.can("SETTLEMENT_PAY")
          ? step("Үлдэгдэл олгох", "settlement", Calculator)
          : null,
      };
      break;
  }

  // Everything else this account may open, as quieter buttons. Only what the
  // account can actually use — the back-end and page gates would block the
  // rest anyway.
  const more: Action[] = [];
  // Intake fix: direct the same day, a change request after.
  if (
    (status === "REGISTERED" || status === "WEIGHED" || status === "VERIFIED") &&
    session.can("REGISTRATION_CREATE")
  )
    more.push(
      step(r.editableByMe ? "Засах" : "Засварын хүсэлт", "edit", Pencil),
    );
  if (
    (status === "WEIGHED" ||
      status === "VERIFIED" ||
      status === "PAYMENT_PENDING") &&
    session.can("REGISTRATION_WEIGH_FIX")
  )
    more.push(step("Жин засах", "weigh", Scale));
  if (status === "VERIFIED" && !pre && session.can("REGISTRATION_WEIGH"))
    more.push(step("Гэдэс", "byproduct", Package));
  if (
    status !== "REGISTERED" &&
    status !== "CANCELLED" &&
    !pre &&
    session.can("REGISTRATION_VERIFY")
  )
    more.push(step("Баталгаажуулалт", "verify", ShieldCheck));
  if (
    (status === "VERIFIED" ||
      (pre && status === "WEIGHED") ||
      status === "PAYMENT_PENDING" ||
      status === "PARTIALLY_SETTLED" ||
      status === "SETTLED") &&
    canSettle
  )
    more.push(step("Тооцоо", "settlement", Calculator));
  const secondary = more.filter((a) => a.href !== next?.action?.href);

  return (
    <div className="space-y-6">
      <PageHeader
        back="/registrations"
        title={<span className="font-mono">{r.registrationCode ?? "—"}</span>}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            {r.factory ? (
              <Badge variant="outline">{factoryName(factories, r.factory)}</Badge>
            ) : null}
            <span>
              {r.herder?.name ?? "—"} · {fmtDateTime(r.createdAt ?? r.intakeDate)}
            </span>
          </div>
        }
        actions={
          <>
            {secondary.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={buttonVariants({ variant: "outline" })}
              >
                <a.icon />
                {a.label}
              </Link>
            ))}
            {/* Back-to-back intake: start the next registration from here. */}
            {canCreate ? (
              <Link
                href="/registrations/new"
                className={buttonVariants({ variant: "secondary" })}
              >
                <ClipboardPlus />
                Шинэ бүртгэл
              </Link>
            ) : null}
          </>
        }
      />

      {status === "CANCELLED" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/8 p-5 text-lg font-semibold text-rose-800 dark:text-rose-300">
          <Ban className="size-6 shrink-0" />
          Энэ бүртгэл цуцлагдсан.
        </div>
      ) : (
        <Card>
          <CardContent className="space-y-5">
            <RegistrationProgress status={status} pre={pre} />
            {next ? (
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 md:p-5",
                  next.action
                    ? "border-primary/30 bg-primary/5"
                    : "bg-muted/60",
                )}
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-primary">
                    Дараагийн алхам
                  </div>
                  <div className="text-xl font-bold">{next.title}</div>
                  <div className="text-base text-muted-foreground">
                    {next.action
                      ? next.hint
                      : `${next.hint} Энэ алхмыг өөр эрхтэй ажилтан хийнэ.`}
                  </div>
                </div>
                {next.action ? (
                  <Link
                    href={next.action.href}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-14 w-full px-8 text-lg sm:w-auto",
                    )}
                  >
                    <next.action.icon className="size-6" />
                    {next.action.label}
                    <ArrowRight className="size-5" />
                  </Link>
                ) : null}
              </div>
            ) : status === "SETTLED" ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 text-base font-semibold text-emerald-800 dark:text-emerald-300">
                <CircleCheckBig className="size-6 shrink-0" />
                Бүх алхам дууссан — малчинд төлбөр бүрэн олгогдсон.
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <HerderInfoCard
          herder={
            r.herder?.id
              ? {
                  id: r.herder.id,
                  name: r.herder.name,
                  registrationNo: r.herder.registrationNo,
                  tin: r.herder.tin,
                  phone: r.herder.phone,
                  bankAccount: r.herder.bankAccount,
                  bankName: r.herder.bankName,
                  accountHolderName: r.herder.accountHolderName,
                  addressId: r.herder.addressId,
                  address: r.herder.address,
                }
              : null
          }
          canEdit={session.can("HERDER_EDIT")}
        />

        <Card>
          <CardHeader>
            <CardTitle>Бүртгэлийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-6 gap-y-3 text-base">
            <div className="text-muted-foreground">Машины дугаар</div>
            <div>{r.vehicleNumber ?? "—"}</div>
            {!pre && (
              <>
                <div className="text-muted-foreground">Тамга</div>
                <div className="space-y-1">
                  <div>{r.stamp ?? "—"}</div>
                  {r.stampImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.stampImage.url}
                      alt="Тамга"
                      className="h-20 w-auto rounded border bg-white object-contain"
                    />
                  ) : null}
                </div>
              </>
            )}
            <div className="text-muted-foreground">Гарын үсэг</div>
            <div>
              {r.signature?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.signature.url}
                  alt="Гарын үсэг"
                  className="h-20 w-auto rounded border bg-white object-contain"
                />
              ) : (
                "—"
              )}
            </div>
            <div className="text-muted-foreground">Он сар</div>
            {/* Intake is always "now" — createdAt carries the real time. */}
            <div>{fmtDateTime(r.createdAt ?? r.intakeDate)}</div>
            <div className="text-muted-foreground">Харуул</div>
            <div>{r.guard?.param ?? "—"}</div>
            <div className="text-muted-foreground">Зураг</div>
            <div>
              {r.photo?.url ? (
                <ImagePreviewLink
                  url={r.photo.url}
                  title={`Бүртгэл ${r.registrationCode ?? ""} — Зураг`}
                />
              ) : (
                "—"
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <MedicalNumbersCard
        registrationId={r.id!}
        numbers={compact(r.medicalNumbers).map((n) => ({
          id: n.id!,
          number: n.number ?? "",
          status: n.status ?? "PENDING",
        }))}
        closed={status === "CANCELLED" || status === "SETTLED"}
        canEdit={session.can("MEDICAL_NUMBER_ENTER")}
        canCheck={session.can("MEDICAL_NUMBER_CHECK")}
      />

      <Card>
        <CardHeader>
          <CardTitle>Малын төрөл</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-base">
          {compact(r.animalLines).map((l) => (
            <div key={l.id!} className="rounded-lg border bg-muted/50 px-4 py-2">
              {l.animalType}
              {l.count ? (
                <>
                  : <b>{l.count}</b>
                </>
              ) : null}
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
                        <TableCell>{w.animalType}</TableCell>
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

      {bundles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{pre ? "Дайвар" : "Гэдэс"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Гэдэс</TableHead>
                  <TableHead>Мал</TableHead>
                  <TableHead>Тоо</TableHead>
                  {!pre && <TableHead>Малчин авсан</TableHead>}
                  <TableHead>Үнэ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundles.map((b) => (
                  <TableRow key={b.id!}>
                    <TableCell className="font-medium">
                      {b.name}
                    </TableCell>
                    <TableCell>{b.animalType}</TableCell>
                    <TableCell>{b.count}</TableCell>
                    {!pre && <TableCell>{b.herderCount}</TableCell>}
                    <TableCell>{formatNumber(b.unitPrice)}</TableCell>
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
                    <TableCell>{l.animalType}</TableCell>
                    <TableCell>{formatNumber(l.receivedWeightKg)}</TableCell>
                    <TableCell>{formatNumber(l.pricePerKg)}</TableCell>
                    <TableCell>{formatNumber(l.meatAmount)}</TableCell>
                    <TableCell>{formatNumber(l.byproductAmount)}</TableCell>
                    <TableCell>{formatNumber(l.slaughterCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Separator />
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="text-muted-foreground">Нийт мах</div>
              <div className="text-right">
                {formatNumber(r.settlement.totalMeatAmount)}
              </div>
              <div className="text-muted-foreground">Нийт дайвар (гэдэс)</div>
              <div className="text-right">
                {formatNumber(r.settlement.totalByproductAmount)}
              </div>
              <div className="text-muted-foreground">Нийт бой зардал</div>
              <div className="text-right">
                {formatNumber(r.settlement.totalSlaughterCost)}
              </div>
              <div className="font-medium">
                Нийт төлбөр (бой зардал хасахаас өмнө)
              </div>
              <div className="text-right font-medium">
                {formatNumber(r.settlement.grossAmount)}
              </div>
              <div className="text-base font-semibold">Малчинд өгөх дүн</div>
              <div className="text-right text-base font-semibold">
                {formatNumber(r.settlement.netPayable)}
              </div>
              {Number(r.settlement.heldAmount ?? 0) > 0 && (
                <>
                  <div className="text-muted-foreground">Олгосон дүн</div>
                  <div className="text-right">
                    {formatNumber(r.settlement.paidAmount)}
                  </div>
                  <div className="text-amber-700">Үлдэгдэл</div>
                  <div className="text-right text-amber-700">
                    {formatNumber(r.settlement.heldAmount)}
                  </div>
                </>
              )}
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
    </div>
  );
}
