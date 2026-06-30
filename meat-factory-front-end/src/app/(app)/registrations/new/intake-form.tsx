"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useForm, Controller, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
import { PhotoCaptureButton } from "@/components/common/PhotoCaptureButton";
import { CreateRegistrationDoc } from "@/lib/queries/registration";
import { unwrap } from "@/lib/unwrap";

const schema = z.object({
  herderId: z.string().uuid("Малчин сонгоно уу"),
  vehicleNumber: z.string().min(1, "Машины дугаар шаардлагатай"),
  stamp: z.string().min(1, "Таних тэмдэг шаардлагатай"),
  medicalNumber: z.string().optional(),
  intakeDate: z.string().optional(),
  signatureFileId: z.string().nullable().optional(),
  stampFileId: z.string().nullable().optional(),
  photoFileId: z.string().nullable().optional(),
  isPreButchered: z.boolean().optional(),
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
  const isPre = useWatch({ control, name: "isPreButchered" });
  return (
    <SlaughterCostPreview
      counts={(counts as Record<string, number>) ?? {}}
      isPreButchered={!!isPre}
    />
  );
}

export function IntakeForm() {
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
      medicalNumber: "",
      intakeDate: new Date().toISOString().slice(0, 10),
      signatureFileId: null,
      stampFileId: null,
      photoFileId: null,
      isPreButchered: false,
      counts: {},
    },
  });

  async function onSubmit(values: Values) {
    const animalLines = Object.entries(values.counts)
      .filter(([, c]) => Number(c) > 0)
      .map(([animalType, count]) => ({
        animalType: animalType as never,
        count: Number(count),
      }));

    if (animalLines.length === 0) {
      toast.error("Дор хаяж нэг малын төрөл оруулна уу");
      return;
    }
    if (!values.stampFileId) {
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
          stamp: values.stamp.trim(),
          medicalNumber: values.medicalNumber?.trim() || null,
          signatureFileId: values.signatureFileId || null,
          stampFileId: values.stampFileId || null,
          photoFileId: values.photoFileId || null,
          intakeDate: values.intakeDate ?? null,
          isPreButchered: !!values.isPreButchered,
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
            {/* Машины дугаар + Эмнэлгийн дугаар. The registration code is
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
                name="medicalNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      Эмнэлгийн дугаар (заавал биш)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Эмчтэй ярьсны дараа бөглөж болно"
                        className="h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Урьдчилан төхөөрсөн — herder delivers ready-cut meat. When set,
                settlement zero's out slaughter cost on the BE. */}
            <Controller
              control={form.control}
              name="isPreButchered"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-muted/30 p-3">
                  <input
                    type="checkbox"
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="mt-1 h-5 w-5"
                  />
                  <div className="space-y-0.5">
                    <div className="text-base font-medium">
                      Урьдчилан төхөөрсөн мах
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Малчин нь бэлэн махаар авчирсан тохиолдолд тэмдэглэнэ.
                      Тооцоонд бойлох (нядалгааны) зардал орохгүй.
                    </div>
                  </div>
                </label>
              )}
            />

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
              <FormField
                control={form.control}
                name="stamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Таних тэмдэг</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Малын тамганы тайлбар"
                        className="h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <ReadOnlyField
                label="Он сар"
                value={form.getValues("intakeDate")}
              />
            </div>

            {/* Тамга зурах + Гарын үсэг зурах */}
            <div className="grid gap-6 sm:grid-cols-2">
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
            <SlaughterCostPreviewWatched control={form.control} />
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
