"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  EMPTY_WEIGH_ROW,
  IntakeWeighRows,
  type IntakeWeighRow,
} from "@/components/registration/IntakeWeighRows";
import { SignatureField } from "@/components/common/SignatureField";
import { MedicalNumberAdder } from "@/components/registration/MedicalNumberAdder";
import { PhotoCaptureButton } from "@/components/common/PhotoCaptureButton";
import { useDraft } from "@/lib/hooks/useDraft";
import { CreateRegistrationDoc } from "@/lib/queries/registration";
import { unwrap } from "@/lib/unwrap";
import { useFactories } from "@/lib/factory/FactoriesProvider";
import { FACTORY_KIND_HINT } from "@/lib/factory/factories";

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
  // Хойд үйлдвэр: meat weighed on this form (type, kg, ₮/kg).
  weighings: z.array(
    z.object({
      animalType: z.string(),
      weightKg: z.string(),
      pricePerKg: z.string(),
    }),
  ),
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
      <div className="flex h-12 items-center rounded-lg border bg-muted/40 px-3 text-base">
        {value ? value : <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

// ponytail: horse matched by catalogue name. If admins rename it, add a
// `requiresStamp` flag on Animal instead.
export const STAMPED_ANIMAL = "Адуу";

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
      intakeDate: new Date().toISOString().slice(0, 10),
      signatureFileId: null,
      stampFileId: null,
      photoFileId: null,
      factory: factory ?? "",
      counts: {},
      weighings: [EMPTY_WEIGH_ROW],
    },
  });

  // Draft survives leaving the page; the date is always today's. Remounting
  // the picker (key) shows the restored herder's name in its search box.
  const [pickerKey, setPickerKey] = useState(0);
  const draft = useWatch({ control: form.control });
  const clearDraft = useDraft("intake", { values: draft, herder }, (d) => {
    form.reset({
      ...d.values,
      intakeDate: new Date().toISOString().slice(0, 10),
    } as Values);
    setHerder(d.herder);
    setPickerKey((k) => k + 1);
  });

  const picked = useWatch({ control: form.control, name: "factory" });
  const pre = isPreButchered(picked);
  const counts = useWatch({ control: form.control, name: "counts" });
  const stampRequired = !pre && (counts?.[STAMPED_ANIMAL] ?? 0) > 0;

  async function onSubmit(values: Values) {
    if (!values.factory) {
      toast.error("Үйлдвэр сонгоно уу");
      return;
    }
    // Хойд үйлдвэр: the weighed rows decide the meat types (no head count).
    const weighRows = pre
      ? values.weighings.filter(
          (w: IntakeWeighRow) => w.animalType || w.weightKg || w.pricePerKg,
        )
      : [];
    if (pre) {
      if (weighRows.length === 0) {
        toast.error("Мах, жин, үнээ оруулна уу");
        return;
      }
      for (const w of weighRows) {
        if (!w.animalType) return void toast.error("Мах сонгоно уу");
        if (!(Number(w.weightKg) > 0))
          return void toast.error(`${w.animalType}: жин оруулна уу`);
        if (!(Number(w.pricePerKg) > 0))
          return void toast.error(`${w.animalType}: үнэ оруулна уу`);
      }
    }
    const animalLines = pre
      ? [...new Set(weighRows.map((w) => w.animalType))].map((animalType) => ({
          animalType,
          count: 0,
        }))
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
      toast.error("Адуунд таних тэмдэг шаардлагатай");
      return;
    }
    if (stampRequired && !values.stampFileId) {
      toast.error("Адуунд тамга зурна уу");
      return;
    }
    if (!values.signatureFileId) {
      toast.error("Гарын үсэг зурна уу");
      return;
    }
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
          intakeDate: values.intakeDate ?? null,
          factory: values.factory,
          animalLines,
          weighings: pre
            ? weighRows.map((w) => ({
                animalType: w.animalType,
                weightKg: Number(w.weightKg),
                pricePerKg: Number(w.pricePerKg),
              }))
            : null,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-6 p-6">
            {/* Машины дугаар + Мал эмнэлгийн дугаар. The registration code is
                assigned by the server on create. */}
            <div className="grid items-start gap-6 sm:grid-cols-2 mb-0">
              <FormField
                control={form.control}
                name="vehicleNumber"
                render={({ field }) => (
                  <FormItem>
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
                name="medicalNumbers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Мал эмнэлгийн дугаар (7 оронтой, заавал биш)
                    </FormLabel>
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
                            className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1 font-mono text-sm tabular-nums"
                          >
                            {n}
                            <button
                              type="button"
                              aria-label={`${n} хасах`}
                              onClick={() =>
                                field.onChange(
                                  field.value.filter((x) => x !== n),
                                )
                              }
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <XIcon className="size-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Эмчтэй ярьсны дараа бүртгэлийн хуудаснаас нэмж болно.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Owner/admin choose the receiving factory; staff are fixed to
                theirs (no banner). FACTORY_2 (pre-butchered) drops stamp +
                бой зардал. */}
            {factory ? null : (
              <Controller
                control={form.control}
                name="factory"
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {intake.map((f) => (
                      <label
                        key={f.code}
                        className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/30 p-3"
                      >
                        <input
                          type="radio"
                          name="factory"
                          checked={field.value === f.code}
                          onChange={() => field.onChange(f.code)}
                          className="mt-1 h-5 w-5"
                        />
                        <div className="space-y-0.5">
                          <div className="text-base font-medium">
                            {f.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {FACTORY_KIND_HINT[f.kind]}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
            )}

            <Separator />

            {/* Малчны мэдээлэл */}
            <div className="text-lg font-semibold">Малчны мэдээлэл</div>
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
              <ReadOnlyField label="Утасны дугаар" value={herder?.phone} />
              <ReadOnlyField label="Хаяг" value={herder?.address} />
              <ReadOnlyField
                label="Регистрийн дугаар"
                value={herder?.registrationNo}
              />
              <ReadOnlyField label="Малчны нэр" value={herder?.name} />
            </div>

            <Separator />

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
              <ReadOnlyField
                label="Он сар"
                value={form.getValues("intakeDate")}
              />
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            {/* Хойд үйлдвэр: weigh the meat here; live animals: head count. */}
            <div className="text-lg font-semibold">
              {pre ? "Мах ба жин" : "Малын тоо"}
            </div>
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
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="h-14 w-full text-lg"
          disabled={submitting}
        >
          {submitting ? "Бүртгэж байна…" : "Бүртгэх"}
        </Button>
      </form>
    </Form>
  );
}
