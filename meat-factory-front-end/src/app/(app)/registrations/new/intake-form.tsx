"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useForm, Controller, useWatch, type Control } from "react-hook-form";
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
import { SlaughterCostPreview } from "@/components/registration/SlaughterCostPreview";
import { SignatureField } from "@/components/common/SignatureField";
import { MedicalNumberAdder } from "@/components/registration/MedicalNumberAdder";
import { PhotoCaptureButton } from "@/components/common/PhotoCaptureButton";
import { CreateRegistrationDoc } from "@/lib/queries/registration";
import { unwrap } from "@/lib/unwrap";
import {
  FACTORY_MN,
  INTAKE_FACTORIES,
  isPreButchered,
} from "@/lib/format/enum";
import type { Factory } from "@/lib/gql/graphql";

const schema = z.object({
  herderId: z.string().uuid("Малчин сонгоно уу"),
  vehicleNumber: z.string().min(1, "Машины дугаар шаардлагатай"),
  // Required for live animals only (checked on submit) — FACTORY_2 takes
  // pre-butchered meat, which carries no stamp.
  stamp: z.string().optional(),
  // Each exactly 7 digits (validated as they're added).
  medicalNumbers: z.array(z.string()),
  intakeDate: z.string().optional(),
  signatureFileId: z.string().nullable().optional(),
  stampFileId: z.string().nullable().optional(),
  photoFileId: z.string().nullable().optional(),
  factory: z.string().optional(),
  counts: z.record(z.string(), z.number()),
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

// Isolated watcher so react-hook-form's `watch` stays out of the main render
// (keeps the React Compiler happy and re-renders only the preview).
function SlaughterCostPreviewWatched({
  control,
}: {
  control: Control<Values>;
}) {
  const counts = useWatch({ control, name: "counts" });
  return (
    <SlaughterCostPreview counts={(counts as Record<string, number>) ?? {}} />
  );
}

// `factory` = the staff member's own factory (their form is fixed); null for
// owner/admin, who pick it here. FACTORY_1 = live animals (stamp + бой
// зардал); FACTORY_2 = pre-butchered meat (neither).
export function IntakeForm({ factory }: { factory: string | null }) {
  const router = useRouter();
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
    },
  });

  const picked = useWatch({ control: form.control, name: "factory" });
  const pre = isPreButchered(picked);

  async function onSubmit(values: Values) {
    if (!values.factory) {
      toast.error("Үйлдвэр сонгоно уу");
      return;
    }
    const animalLines = Object.entries(values.counts)
      .filter(([, c]) => Number(c) > 0)
      .map(([animalType, count]) => ({
        animalType: animalType,
        count: Number(count),
      }));

    if (animalLines.length === 0) {
      toast.error("Дор хаяж нэг малын төрөл оруулна уу");
      return;
    }
    if (!pre && !values.stamp?.trim()) {
      toast.error("Таних тэмдэг шаардлагатай");
      return;
    }
    if (!pre && !values.stampFileId) {
      toast.error("Тамга зурна уу");
      return;
    }
    if (!values.signatureFileId) {
      toast.error("Гарын үсэг зурна уу");
      return;
    }
    if (!values.photoFileId) {
      toast.error("Малыг хүлээж авсан зургийг авна уу");
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
          factory: values.factory as Factory,
          animalLines,
        },
      });
      const reg = unwrap(r.data?.createRegistration).registration;
      if (!reg?.id) throw new Error("Хариу буцаасангүй");
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
            <div className="grid items-start gap-6 sm:grid-cols-2">
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
                theirs. FACTORY_2 (pre-butchered) drops stamp + бой зардал. */}
            {factory ? (
              <div className="rounded-md border bg-muted/30 p-3 text-base font-medium">
                {FACTORY_MN[factory] ?? factory}
                {pre ? " — урьдчилан төхөөрсөн мах" : " — амьд мал"}
              </div>
            ) : (
              <Controller
                control={form.control}
                name="factory"
                render={({ field }) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {INTAKE_FACTORIES.map((f) => (
                      <label
                        key={f}
                        className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/30 p-3"
                      >
                        <input
                          type="radio"
                          name="factory"
                          checked={field.value === f}
                          onChange={() => field.onChange(f)}
                          className="mt-1 h-5 w-5"
                        />
                        <div className="space-y-0.5">
                          <div className="text-base font-medium">
                            {FACTORY_MN[f]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isPreButchered(f)
                              ? "Урьдчилан төхөөрсөн мах — тамга, бой зардалгүй"
                              : "Амьд мал — тамга, бой зардалтай"}
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
                      value={field.value || null}
                      onChange={(id) => field.onChange(id ?? "")}
                      onSelect={setHerder}
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
                      <FormLabel className="text-base">Таних тэмдэг</FormLabel>
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
                      label="Тамга (зурах)"
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
            <div className="text-lg font-semibold">Малын тоо</div>
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
            {pre ? null : (
              <SlaughterCostPreviewWatched control={form.control} />
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
