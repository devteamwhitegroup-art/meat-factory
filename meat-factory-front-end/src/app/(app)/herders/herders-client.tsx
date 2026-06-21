'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreateHerderDoc,
  DeleteHerderDoc,
  HerderListDoc,
  UpdateHerderDoc,
} from '@/lib/queries/herder';
import { HerderAddressListDoc } from '@/lib/queries/herder-address';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { runMutation } from '@/lib/runMutation';
import { compact } from '@/lib/compact';
import { fmtDate } from '@/lib/format/date';

const schema = z
  .object({
    name: z.string().min(1, 'Нэр шаардлагатай'),
    registrationNo: z.string().min(1, 'Регистр шаардлагатай'),
    phone: z.string().optional(),
    bankAccount: z.string().optional(),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    addressId: z.string().optional(),
    address: z.string().optional(),
  })
  .refine(
    (v) =>
      (v.addressId && v.addressId.length > 0) ||
      (v.address && v.address.trim().length > 0),
    {
      path: ['addressId'],
      message: 'Хаяг сонгох эсвэл бичих',
    },
  );
type Values = z.infer<typeof schema>;

type EditTarget = {
  id?: string | null;
  name?: string | null;
  registrationNo?: string | null;
  phone?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  addressId?: string | null;
  address?: string | null;
  addressEntry?: { id?: string | null; name?: string | null } | null;
} | null;

export function HerdersClient() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading: fetching, refetch } = useQuery(HerderListDoc, {
    variables: { search: search || null, limit: 20, page },
    fetchPolicy: 'cache-and-network',
  });
  const [createHerder] = useMutation(CreateHerderDoc);
  const [updateHerder] = useMutation(UpdateHerderDoc);
  const [deleteHerder] = useMutation(DeleteHerderDoc);
  const { data: addrData } = useQuery(HerderAddressListDoc, {
    variables: { search: null, isActive: true },
    fetchPolicy: 'cache-and-network',
  });
  const addresses = compact(addrData?.herderAddresses?.herderAddresses);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
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

  function openCreate() {
    setEditing(null);
    form.reset({
      name: '',
      registrationNo: '',
      phone: '',
      bankAccount: '',
      bankName: '',
      accountHolderName: '',
      addressId: '',
      address: '',
    });
    setSheetOpen(true);
  }

  function openEdit(h: NonNullable<EditTarget>) {
    setEditing(h);
    form.reset({
      name: h.name ?? '',
      registrationNo: h.registrationNo ?? '',
      phone: h.phone ?? '',
      bankAccount: h.bankAccount ?? '',
      bankName: h.bankName ?? '',
      accountHolderName: h.accountHolderName ?? '',
      addressId: h.addressId ?? '',
      // When an address row is linked we leave the free-form field blank
      // — it's just a fallback for ad-hoc strings.
      address: h.addressId ? '' : h.address ?? '',
    });
    setSheetOpen(true);
  }

  async function onSubmit(values: Values) {
    const sharedVars = {
      name: values.name.trim(),
      registrationNo: values.registrationNo.trim(),
      phone: values.phone?.trim() || null,
      bankAccount: values.bankAccount?.trim() || null,
      bankName: values.bankName?.trim() || null,
      accountHolderName: values.accountHolderName?.trim() || null,
      addressId: values.addressId || null,
      address: values.addressId
        ? null
        : values.address?.trim() || null,
    };
    await runMutation(
      async () => {
        if (editing?.id) {
          const r = await updateHerder({
            variables: { id: editing.id, ...sharedVars },
          });
          return r.data?.updateHerder;
        }
        const r = await createHerder({ variables: sharedVars });
        return r.data?.createHerder;
      },
      {
        success: editing?.id ? 'Шинэчлэгдлээ' : 'Малчин нэмэгдлээ',
        onSuccess: () => {
          setSheetOpen(false);
          refetch();
        },
      },
    );
  }

  async function onDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    await runMutation(
      async () => (await deleteHerder({ variables: { id } })).data?.deleteHerder,
      { success: 'Устгагдлаа', onSuccess: refetch },
    );
  }

  const herders = (data?.herders?.herders ?? []).filter(
    (h): h is NonNullable<typeof h> => !!h,
  );
  const total = data?.herders?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Хайх (нэр/регистр/утас)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Шинэ малчин</Button>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>
                {editing ? 'Малчин засах' : 'Шинэ малчин'}
              </SheetTitle>
            </SheetHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 p-4"
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
                      <FormLabel>Регистр</FormLabel>
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
                    const selected = addresses.find(
                      (a) => a.id === field.value,
                    );
                    return (
                      <FormItem>
                        <FormLabel>Хаяг</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value || undefined}
                            onValueChange={(v) =>
                              field.onChange(v ?? '')
                            }
                          >
                            <SelectTrigger className="h-10 w-full">
                              {field.value ? (
                                <span>
                                  {selected?.name ?? 'Сонгосон'}
                                </span>
                              ) : (
                                <SelectValue placeholder="Каталогаас сонгох" />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {addresses.length === 0 ? (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                  Хаяг алга
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
                          placeholder="Каталогаас сонгоогүй үед бичнэ"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  >
                    Хадгалах
                  </Button>
                </div>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {fetching && herders.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : herders.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Малчин олдсонгүй
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Регистр</TableHead>
                <TableHead>Утас</TableHead>
                <TableHead>Хаяг</TableHead>
                <TableHead>Банк</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {herders.map((h) => (
                <TableRow key={h.id!}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.registrationNo}</TableCell>
                  <TableCell>{h.phone ?? '—'}</TableCell>
                  <TableCell>{h.address ?? '—'}</TableCell>
                  <TableCell className="text-xs">
                    {h.bankName || h.bankAccount ? (
                      <div className="space-y-0.5">
                        {h.bankName ? <div>{h.bankName}</div> : null}
                        {h.bankAccount ? (
                          <div className="font-mono">{h.bankAccount}</div>
                        ) : null}
                        {h.accountHolderName ? (
                          <div className="text-muted-foreground">
                            {h.accountHolderName}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{fmtDate(h.createdAt)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(h)}
                    >
                      Засах
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(h.id!)}
                    >
                      Устгах
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Нийт: {total}</span>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ←
          </Button>
          <span>Хуудас {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={herders.length < 20}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
}
