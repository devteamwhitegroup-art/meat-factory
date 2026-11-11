"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  HerderPicker,
  type PickedHerder,
} from "@/components/registration/HerderPicker";
import { AnimalCountGrid } from "@/components/registration/AnimalCountGrid";
import { useAnimalCatalog } from "@/lib/hooks/useAnimalCatalog";
import {
  EMPTY_WEIGH_ROW,
  IntakeWeighRows,
  type IntakeWeighRow,
} from "@/components/registration/IntakeWeighRows";
import { ymd } from "@/lib/date/range";
import { SignatureField } from "@/components/common/SignatureField";
import { MedicalNumberAdder } from "@/components/registration/MedicalNumberAdder";
import { PhotoCaptureButton } from "@/components/common/PhotoCaptureButton";
import { useDraft } from "@/lib/hooks/useDraft";
import { Textarea } from "@/components/ui/textarea";
import { EbarimtToggle } from "../[id]/_components/EbarimtCheckCard";
import { CreateRegistrationDoc } from "@/lib/queries/registration";
import { FactoryByproductsDoc } from "@/lib/queries/factory";
import { unwrap } from "@/lib/unwrap";
import { compact } from "@/lib/compact";
import { useFactories } from "@/lib/factory/FactoriesProvider";
import { FACTORY_KIND_HINT } from "@/lib/factory/factories";
import {
  ByproductIntakeEditor,
  intakeInputs,
} from "../[id]/weigh/_components/ByproductIntakeEditor";

// 4 digits + 2–3 Cyrillic letters ("8901 ДОУ"); BE normalises the spacing.
// Shared with the edit form.
export const PLATE_RE = /^\d{4}\s*[А-ЯЁӨҮ]{2,3}$/i;
export const PLATE_HINT = "4 тоо + 2-3 үсэг (ж: 8901 ДОУ)";

const schema = z.object({
  herderId: z.string().uuid("Малчин сонгоно уу"),
  vehicleNumber: z.string().trim().regex(PLATE_RE, PLATE_HINT),
  // Required only when horses are in the intake (checked on submit) — only
  // horses carry a stamp; FACTORY_2 pre-butchered meat never does.
  stamp: z.string().optional(),
  // Each exactly 7 digits (validated as they're added).
  medicalNumbers: z.array(z.string()),
  intakeDate: z.string().optional(),
  signatureFileId: z.string().nullable().optional(),
  stampFileId: z.string().nullable().optional(),
  photoFileId: z.string().nullable().optional(),
  factory: z.string().optional(),
  counts: z.record(z.string(), z.number()),
  // Хойд үйлдвэр: meat weighed on this form (type, pieces, kg, ₮/kg).
  weighings: z.array(
    z.object({
      animalType: z.string(),
      count: z.string().optional(),
      weightKg: z.string(),
      pricePerKg: z.string(),
    }),
  ),
  // Хойд үйлдвэр: byproduct count / price edits keyed by price-list item
  // (IntakeEdits).
  byproducts: z.record(
    z.string(),
    z.object({ count: z.string().optional(), price: z.string().optional() }),
  ),
  // Хойд үйлдвэр: manual eBarimt check (live sites record it at verify).
  // Optional: drafts saved before these fields existed restore without them.
  ebarimtTaken: z.boolean().optional(),
  ebarimtImageFileId: z.string().nullable().optional(),
  ebarimtNote: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-base text-muted-foreground">{label}</Label>
      <div className="flex h-12 items-center rounded-lg border border-dashed bg-muted/50 px-3.5 text-base">
        {value ? value : <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

// One numbered block of the intake form: «1 Машин ба малчин» + a plain
// one-line instruction, so a new user knows the order to fill things in.
function FormSection({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            {n}
          </span>
          <div className="space-y-0.5">
            <div className="text-xl font-semibold">{title}</div>
            {hint ? (
              <div className="text-sm text-muted-foreground">{hint}</div>
            ) : null}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// `factory` = the staff member's own factory (their form is fixed); null for
// cross-factory roles, who pick it here. Live sites take animals (stamp for
// horses, бой зардал); pre-butchered sites take meat (neither).
export function IntakeForm({
  factory,
  quickHerder,
}: {
  factory: string | null;
  // эмч adds herders with name / register / phone only.
  quickHerder: boolean;
}) {
  const router = useRouter();
  const { intake, isPreButchered } = useFactories();
  const { stampAnimal } = useAnimalCatalog();
  const [createRegistration] = useMutation(CreateRegistrationDoc);
  const [submitting, setSubmitting] = useState(false);
  const [herder, setHerder] = useState<PickedHerder | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      herderId: "",
      vehicleNumber: "",
      stamp: "",
      medicalNumbers: [],
      intakeDate: ymd(new Date()),
      signatureFileId: null,
      stampFileId: null,
      photoFileId: null,
      factory: factory ?? "",
      counts: {},
      weighings: [EMPTY_WEIGH_ROW],
      byproducts: {},
      ebarimtTaken: false,
      ebarimtImageFileId: null,
      ebarimtNote: "",
    },
  });

  // Draft survives leaving the page; the date is always today's. Remounting
  // the picker (key) shows the restored herder's name in its search box.
  const [pickerKey, setPickerKey] = useState(0);
  const draft = useWatch({ control: form.control });
  const clearDraft = useDraft("intake", { values: draft, herder }, (d) => {
    form.reset({
      ...d.values,
      intakeDate: ymd(new Date()),
    } as Values);
    setHerder(d.herder);
    setPickerKey((k) => k + 1);
  });

  const picked = useWatch({ control: form.control, name: "factory" });
  const pre = isPreButchered(picked);
  // The site's byproduct price list (Систем тохиргоо › Үйлдвэр) → count rows.
  const { data: priceList } = useQuery(FactoryByproductsDoc, {
    variables: { factory: picked ?? "" },
    skip: !pre,
  });
  const byproductRows = pre
    ? compact(priceList?.factoryByproducts?.factoryByproducts).map((p) => ({
        wrapperId: p.wrapperId,
        constantId: p.constantId,
        name: p.name,
        animalType: p.animalType,
        count: 0,
        unitPrice: p.price,
      }))
    : [];
  const counts = useWatch({ control: form.control, name: "counts" });
  // Live intake of a stamp-requiring animal (catalogue flag).
  const stamped = pre ? null : stampAnimal(counts);
  const stampRequired = !!stamped;

  async function onSubmit(values: Values) {
    if (!values.factory) {
      toast.error("Үйлдвэр сонгоно уу");
      return;
    }
    // Хойд үйлдвэр: the weighed rows decide the meat types; their pieces sum
    // into each type's count.
    const weighRows = pre
      ? values.weighings.filter(
          (w: IntakeWeighRow) =>
            w.animalType || w.count || w.weightKg || w.pricePerKg,
        )
      : [];
    if (pre) {
      if (weighRows.length === 0) {
        toast.error("Мах, жин, үнээ оруулна уу");
        return;
      }
      for (const w of weighRows) {
        if (!w.animalType) return void toast.error("Мах сонгоно уу");
        if (!(Number(w.count) > 0))
          return void toast.error(`${w.animalType}: тоо оруулна уу`);
        if (!(Number(w.weightKg) > 0))
          return void toast.error(`${w.animalType}: жин оруулна уу`);
        if (!(Number(w.pricePerKg) > 0))
          return void toast.error(`${w.animalType}: үнэ оруулна уу`);
      }
    }
    const animalLines = pre
      ? Object.entries(
          weighRows.reduce<Record<string, number>>((acc, w) => {
            acc[w.animalType] = (acc[w.animalType] ?? 0) + Number(w.count);
            return acc;
          }, {}),
        ).map(([animalType, count]) => ({ animalType, count }))
      : Object.entries(values.counts)
          .filter(([, c]) => Number(c) > 0)
          .map(([animalType, count]) => ({
            animalType,
            count: Number(count),
          }));

    if (animalLines.length === 0) {
      toast.error("Дор хаяж нэг малын төрөл оруулна уу");
      return;
    }
    if (stampRequired && !values.stamp?.trim()) {
      toast.error(`${stamped}: таних тэмдэг шаардлагатай`);
      return;
    }
    if (stampRequired && !values.stampFileId) {
      toast.error(`${stamped}: тамга зурна уу`);
      return;
    }
    if (!values.signatureFileId) {
      toast.error("Гарын үсэг зурна уу");
      return;
    }
    // Every row is sent so the record keeps the full list; all-zero = none.
    const bundles = intakeInputs(byproductRows, values.byproducts ?? {});
    setSubmitting(true);
    try {
      const r = await createRegistration({
        variables: {
          herderId: values.herderId,
          vehicleNumber: values.vehicleNumber.trim(),
          stamp: pre ? null : values.stamp?.trim() || null,
          medicalNumbers: values.medicalNumbers,
          signatureFileId: values.signatureFileId || null,
          stampFileId: pre ? null : values.stampFileId || null,
          photoFileId: values.photoFileId || null,
          // No intakeDate: the BE stamps the real intake moment.
          factory: values.factory,
          animalLines,
          weighings: pre
            ? weighRows.map((w) => ({
                animalType: w.animalType,
                weightKg: Number(w.weightKg),
                pricePerKg: Number(w.pricePerKg),
              }))
            : null,
          byproducts:
            pre && bundles.some((b) => b.count > 0) ? bundles : null,
          ...(pre && {
            ebarimtTaken: !!values.ebarimtTaken,
            ebarimtImageFileId: values.ebarimtImageFileId || null,
            ebarimtNote: values.ebarimtNote?.trim() || null,
          }),
        },
      });
      const reg = unwrap(r.data?.createRegistration).registration;
      if (!reg?.id) throw new Error("Хариу буцаасангүй");
      clearDraft();
      toast.success(`Бүртгэл ${reg.registrationCode ?? ""} үүсгэгдлээ`);
      router.push(`/registrations/${reg.id}`);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Numbered in the order the gate actually works; the factory step only
  // exists for cross-factory accounts.
  let step = 0;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Owner/admin choose the receiving factory; staff are fixed to
            theirs (no banner). FACTORY_2 (pre-butchered) drops stamp +
            бой зардал. */}
        {factory ? null : (
          <FormSection
            n={++step}
            title="Үйлдвэр"
            hint="Аль үйлдвэрт хүлээн авч байгааг сонгоно."
          >
            <Controller
              control={form.control}
              name="factory"
              render={({ field }) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  {intake.map((f) => (
                    <label
                      key={f.code}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-colors has-checked:border-primary has-checked:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="factory"
                        checked={field.value === f.code}
                        onChange={() => field.onChange(f.code)}
                        className="mt-1 size-5 accent-primary"
                      />
                      <div className="space-y-0.5">
                        <div className="text-base font-semibold">{f.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {FACTORY_KIND_HINT[f.kind]}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            />
          </FormSection>
        )}

        <FormSection
          n={++step}
          title="Машин ба малчин"
          hint="Машины дугаарыг бичээд, малчныг нэрээр нь хайж сонгоно."
        >
          {/* The registration code is assigned by the server on create. */}
          <FormField
            control={form.control}
            name="vehicleNumber"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <FormLabel className="text-base">Машины дугаар</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="8901 ДОУ"
                    className="h-12 text-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="herderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Малчин сонгох</FormLabel>
                <FormControl>
                  <HerderPicker
                    key={pickerKey}
                    initialLabel={herder?.name ?? undefined}
                    value={field.value || null}
                    onChange={(id) => field.onChange(id ?? "")}
                    onSelect={setHerder}
                    quick={quickHerder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Малчны нэр" value={herder?.name} />
            <ReadOnlyField
              label="Регистрийн дугаар"
              value={herder?.registrationNo}
            />
            <ReadOnlyField label="Утасны дугаар" value={herder?.phone} />
            <ReadOnlyField label="Хаяг" value={herder?.address} />
          </div>
        </FormSection>

        <FormSection
          n={++step}
          title={pre ? "Мах ба жин" : "Малын тоо"}
          hint={
            pre
              ? "Ирсэн мах бүрийн жин, кг тутмын үнийг оруулна."
              : "Төрөл бүрээс хэдэн толгой ирснийг − / + товчоор оруулна."
          }
        >
          {/* Хойд үйлдвэр: weigh the meat here; live animals: head count. */}
          {pre ? (
            <Controller
              control={form.control}
              name="weighings"
              render={({ field }) => (
                <IntakeWeighRows
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />
          ) : (
            <Controller
              control={form.control}
              name="counts"
              render={({ field }) => (
                <AnimalCountGrid
                  value={(field.value as Record<string, number>) ?? {}}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />
          )}
        </FormSection>

        {/* Хойд үйлдвэр: byproducts delivered with (or without matching)
            meat; rows come from the site's price list. */}
        {pre ? (
          <Controller
            control={form.control}
            name="byproducts"
            render={({ field }) => (
              <ByproductIntakeEditor
                bundles={byproductRows}
                edits={field.value ?? {}}
                editable
                busy={submitting}
                onChange={(v) => field.onChange(v)}
              />
            )}
          />
        ) : null}

        <FormSection
          n={++step}
          title="Мал эмнэлгийн дугаар"
          hint="Заавал биш. Эмчтэй ярьсны дараа бүртгэлийн хуудаснаас нэмж болно."
        >
          <FormField
            control={form.control}
            name="medicalNumbers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Дугаар (7 оронтой)</FormLabel>
                <MedicalNumberAdder
                  onAdd={(list) =>
                    field.onChange([...new Set([...field.value, ...list])])
                  }
                />
                {field.value.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {field.value.map((n) => (
                      <span
                        key={n}
                        className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/50 px-3 py-1.5 font-mono text-base tabular-nums"
                      >
                        {n}
                        <button
                          type="button"
                          aria-label={`${n} хасах`}
                          onClick={() =>
                            field.onChange(field.value.filter((x) => x !== n))
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          n={++step}
          title={pre ? "Гарын үсэг, зураг" : "Тамга, гарын үсэг, зураг"}
          hint="Малчинд гарын үсэг зуруулж, зураг дарна."
        >
          {/* Таних тэмдэг + Он сар */}
          <div className="grid gap-6 sm:grid-cols-2">
            {pre ? null : (
              <FormField
                control={form.control}
                name="stamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Таних тэмдэг
                      {stampRequired ? "" : " (заавал биш)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Малын тамганы тайлбар"
                        className="h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <ReadOnlyField label="Он сар" value={form.getValues("intakeDate")} />
          </div>

          {/* Тамга зурах + Гарын үсэг зурах */}
          <div className="grid gap-6 sm:grid-cols-2">
            {pre ? null : (
              <Controller
                control={form.control}
                name="stampFileId"
                render={({ field }) => (
                  <SignatureField
                    value={field.value ?? null}
                    onChange={(id) => field.onChange(id)}
                    label={
                      stampRequired
                        ? "Тамга (зурах)"
                        : "Тамга (зурах, заавал биш)"
                    }
                    type="register"
                  />
                )}
              />
            )}
            <Controller
              control={form.control}
              name="signatureFileId"
              render={({ field }) => (
                <SignatureField
                  value={field.value ?? null}
                  onChange={(id) => field.onChange(id)}
                  label="Гарын үсэг (зурах)"
                  type="register"
                />
              )}
            />
          </div>
          <Controller
            control={form.control}
            name="photoFileId"
            render={({ field }) => (
              <PhotoCaptureButton
                value={field.value ?? null}
                onChange={(id) => field.onChange(id)}
                label="Зураг дарах"
                type="register"
              />
            )}
          />
        </FormSection>

        {/* Хойд үйлдвэр has no verify step — the eBarimt check is here. */}
        {pre ? (
          <FormSection
            n={++step}
            title="И-баримт (заавал биш)"
            hint="Малчин зөвшөөрвөл түүний утаснаас И-баримт шивээд, зургийг нь хавсаргана."
          >
            <Controller
              control={form.control}
              name="ebarimtTaken"
              render={({ field }) => (
                <EbarimtToggle checked={!!field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={form.control}
              name="ebarimtImageFileId"
              render={({ field }) => (
                <PhotoCaptureButton
                  value={field.value ?? null}
                  onChange={(id) => field.onChange(id)}
                  label="И-баримтын зураг (заавал биш)"
                  type="verify"
                />
              )}
            />
            <Controller
              control={form.control}
              name="ebarimtNote"
              render={({ field }) => (
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Тэмдэглэл (заавал биш)"
                  rows={2}
                />
              )}
            />
          </FormSection>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-16 w-full text-xl"
          disabled={submitting}
        >
          <CheckIcon className="size-6" />
          {submitting ? "Бүртгэж байна…" : "Бүртгэх"}
        </Button>
      </form>
    </Form>
  );
}
