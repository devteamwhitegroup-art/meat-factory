'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CreateHerderDoc, HerderListDoc } from '@/lib/queries/herder';
import { unwrap } from '@/lib/urql/unwrap';
import { compact } from '@/lib/compact';

const schema = z.object({
  name: z.string().min(1, 'Нэр шаардлагатай'),
  registrationNo: z.string().min(1, 'Регистрийн дугаар шаардлагатай'),
  phone: z.string().optional(),
  bankAccount: z.string().optional(),
  address: z.string().min(1, 'Хаяг шаардлагатай'),
});
type Values = z.infer<typeof schema>;

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
};

export function HerderPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [{ data, fetching }, refetch] = useQuery({
    query: HerderListDoc,
    variables: { limit: 50, page: 1 },
  });
  const [, createHerder] = useMutation(CreateHerderDoc);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      registrationNo: '',
      phone: '',
      bankAccount: '',
      address: '',
    },
  });

  // When dialog closes, reset.
  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const herders = compact(data?.herders?.herders);

  async function onSubmit(values: Values) {
    try {
      const r = await createHerder({
        name: values.name.trim(),
        registrationNo: values.registrationNo.trim(),
        phone: values.phone?.trim() || null,
        bankAccount: values.bankAccount?.trim() || null,
        address: values.address.trim(),
      });
      const created = unwrap(r.data?.createHerder).herder;
      if (!created?.id) throw new Error('Хариу буцаасангүй');
      toast.success(`Малчин нэмэгдлээ: ${created.name}`);
      refetch({ requestPolicy: 'network-only' });
      onChange(created.id);
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value ?? undefined}
        onValueChange={(v) => onChange(v || null)}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={fetching ? 'Уншиж байна…' : 'Малчин сонгох'}
          />
        </SelectTrigger>
        <SelectContent>
          {herders.map((h) => (
            <SelectItem key={h.id!} value={h.id!}>
              {h.name}
              {h.registrationNo ? ` — ${h.registrationNo}` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Шинээр нэмэх
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Шинэ малчин</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Нэр</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Регистрийн дугаар</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Утас</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bankAccount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дансны дугаар</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Хаяг</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  Болих
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  Хадгалах
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
