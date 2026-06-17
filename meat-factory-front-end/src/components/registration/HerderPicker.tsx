'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
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
import { HerderAddressListDoc } from '@/lib/queries/herder-address';
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';

// Either pick an address from the catalogue (addressId) or type one in
// (address). At least one is required; both are allowed when admin wants to
// override the catalogue label for an unusual herder.
const schema = z
  .object({
    name: z.string().min(1, 'Нэр шаардлагатай'),
    registrationNo: z.string().min(1, 'Регистрийн дугаар шаардлагатай'),
    phone: z.string().optional(),
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    addressId: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((v) => (v.addressId && v.addressId.length > 0) || (v.address && v.address.trim().length > 0), {
    path: ['addressId'],
    message: 'Хаяг сонгох эсвэл бичих',
  });
type Values = z.infer<typeof schema>;

export type PickedHerder = {
  id: string;
  name?: string | null;
  registrationNo?: string | null;
  phone?: string | null;
  address?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
};

type Props = {
  value: string | null;
  onChange: (id: string | null) => void;
  onSelect?: (herder: PickedHerder | null) => void;
};

export function HerderPicker({ value, onChange, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const { data, loading: fetching, refetch } = useQuery(HerderListDoc, {
    variables: { limit: 50, page: 1 },
  });
  const [createHerder] = useMutation(CreateHerderDoc);
  // Address catalogue for the dropdown inside the "Шинэ малчин" dialog.
  const { data: addrData } = useQuery(HerderAddressListDoc, {
    variables: { search: null, isActive: true },
    fetchPolicy: 'cache-and-network',
  });
  const addresses = compact(addrData?.herderAddresses?.herderAddresses);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      registrationNo: '',
      phone: '',
      bankAccount: '',
      bankName: '',
      accountHolderName: '',
      addressId: '',
      address: '',
    },
  });

  // When dialog closes, reset.
  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const herders = compact(data?.herders?.herders);
  const labelFor = (h: (typeof herders)[number]) =>
    `${h.name}${h.registrationNo ? ` — ${h.registrationNo}` : ''}`;
  const itemLabels = Object.fromEntries(
    herders.filter((h) => h.id).map((h) => [h.id as string, labelFor(h)]),
  );

  async function onSubmit(values: Values) {
    try {
      const r = await createHerder({
        variables: {
          name: values.name.trim(),
          registrationNo: values.registrationNo.trim(),
          phone: values.phone?.trim() || null,
          bankAccount: values.bankAccount?.trim() || null,
          bankName: values.bankName?.trim() || null,
          accountHolderName: values.accountHolderName?.trim() || null,
          addressId: values.addressId || null,
          // Send the free-form fallback only when no catalogue id is set.
          address:
            values.addressId
              ? null
              : values.address?.trim() || null,
        },
      });
      const created = unwrap(r.data?.createHerder).herder;
      if (!created?.id) throw new Error('Хариу буцаасангүй');
      toast.success(`Малчин нэмэгдлээ: ${created.name}`);
      // Refresh the list first so the new herder is in the options before we
      // set it as the selected value (otherwise the trigger renders blank).
      await refetch();
      onChange(created.id);
      onSelect?.(created as PickedHerder);
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <Select
          items={itemLabels}
          value={value ?? null}
          onValueChange={(v) => {
            const id = (v as string) || null;
            onChange(id);
            onSelect?.(
              (herders.find((h) => h.id === id) as PickedHerder | undefined) ??
                null,
            );
          }}
        >
          <SelectTrigger className="h-12 w-full text-base">
            <SelectValue
              placeholder={fetching ? 'Уншиж байна…' : 'Малчин сонгох'}
            />
          </SelectTrigger>
          <SelectContent>
            {herders.map((h) => (
              <SelectItem key={h.id!} value={h.id!}>
                {labelFor(h)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 text-base"
        onClick={() => setOpen(true)}
      >
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
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Банкны нэр</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ж: Хаан банк"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountHolderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дансны эзэмшигчийн нэр</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(зөвхөн өөр хүний данс үед)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="addressId"
                render={({ field }) => {
                  // Resolve the picked address's name manually — base-ui
                  // Select shows the raw UUID in the trigger when the
                  // matching <SelectItem> isn't currently in the tree.
                  const selected = addresses.find(
                    (a) => a.id === field.value,
                  );
                  return (
                    <FormItem>
                      <FormLabel>Хаяг</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value || undefined}
                          onValueChange={(v) => field.onChange(v ?? '')}
                        >
                          <SelectTrigger className="h-10 w-full">
                            {field.value ? (
                              <span>
                                {selected?.name ?? 'Сонгосон'}
                              </span>
                            ) : (
                              <SelectValue placeholder="Хаягийн жагсаалтаас сонгох" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Хаяг алга. «Малчны хаягууд» хэсэгт нэмнэ үү.
                              </div>
                            ) : (
                              addresses.map((a) => (
                                <SelectItem key={a.id!} value={a.id!}>
                                  {a.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Хаяг (нэмэлт, заавал биш)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Жагсаалтаас сонгоогүй үед бичнэ"
                        {...field}
                      />
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
