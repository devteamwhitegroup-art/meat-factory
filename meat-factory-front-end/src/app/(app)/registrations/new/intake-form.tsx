'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'urql';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { HerderPicker } from '@/components/registration/HerderPicker';
import { AnimalCountGrid } from '@/components/registration/AnimalCountGrid';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { CreateRegistrationDoc } from '@/lib/queries/registration';
import { unwrap } from '@/lib/urql/unwrap';

const schema = z.object({
  herderId: z.string().uuid('Малчин сонгоно уу'),
  vehicleNumber: z.string().min(1, 'Машины дугаар шаардлагатай'),
  stamp: z.string().optional(),
  intakeDate: z.string().optional(),
  photoFileId: z.string().nullable().optional(),
  counts: z.record(z.string(), z.number()),
});
type Values = z.infer<typeof schema>;

export function IntakeForm() {
  const router = useRouter();
  const [, createRegistration] = useMutation(CreateRegistrationDoc);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      herderId: '',
      vehicleNumber: '',
      stamp: '',
      intakeDate: new Date().toISOString().slice(0, 10),
      photoFileId: null,
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
      toast.error('Дор хаяж нэг малын төрөл сонгоно уу');
      return;
    }

    setSubmitting(true);
    try {
      const r = await createRegistration({
        herderId: values.herderId,
        vehicleNumber: values.vehicleNumber.trim(),
        stamp: values.stamp?.trim() || null,
        photoFileId: values.photoFileId || null,
        intakeDate: values.intakeDate ?? null,
        animalLines,
      });
      const reg = unwrap(r.data?.createRegistration).registration;
      if (!reg?.id) throw new Error('Хариу буцаасангүй');
      toast.success(`Бүртгэл #${reg.registrationNumber} үүсгэгдлээ`);
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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-4 lg:grid-cols-[2fr_3fr]"
      >
        <Card>
          <CardContent className="space-y-4 p-4">
            <FormField
              control={form.control}
              name="herderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Малчин</FormLabel>
                  <FormControl>
                    <HerderPicker
                      value={field.value || null}
                      onChange={(id) => field.onChange(id ?? '')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Машины дугаар</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="1234УБА" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тамга тэмдэг</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="intakeDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Он сар</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="photoFileId"
              render={({ field }) => (
                <FormItem>
                  <PhotoUpload
                    value={field.value ?? null}
                    onChange={(id) => field.onChange(id)}
                    label="Гэрийн зураг"
                    type="register"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="text-sm font-medium">Малын тоо</div>
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
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Бүртгэж байна…' : 'Бүртгэх'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
