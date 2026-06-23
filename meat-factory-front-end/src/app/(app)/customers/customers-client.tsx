'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CreateCustomerDoc,
  CustomerListDoc,
  DeleteCustomerDoc,
  UpdateCustomerDoc,
} from '@/lib/queries/customer';
import { Customer_Kind } from '@/lib/gql/graphql';
import { CUSTOMER_KIND_MN, CUSTOMER_KIND_COLOR } from '@/lib/format/enum';
import { runMutation } from '@/lib/runMutation';
import { compact } from '@/lib/compact';

const KIND_VALUES = ['LOCAL_BROKER', 'ULAANBAATAR_BROKER', 'FACTORY'] as const;
type Kind = (typeof KIND_VALUES)[number];

const schema = z.object({
  name: z.string().min(1, 'Нэр шаардлагатай'),
  kind: z.enum(KIND_VALUES),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  bankAccount: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
});
type Values = z.infer<typeof schema>;

type EditTarget = {
  id?: string | null;
  name?: string | null;
  kind?: Customer_Kind | string | null;
  contactPhone?: string | null;
  address?: string | null;
  bankAccount?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  isActive?: boolean | null;
} | null;

export function CustomersClient() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [kindFilter, setKindFilter] = useState<'ALL' | Kind>('ALL');
  const { data, loading: fetching, refetch } = useQuery(CustomerListDoc, {
    variables: {
      search: search || null,
      isActive: null,
      kind: kindFilter === 'ALL' ? null : (kindFilter as Customer_Kind),
      limit: 20,
      page,
    },
    fetchPolicy: 'cache-and-network',
  });
  const [createCustomer] = useMutation(CreateCustomerDoc);
  const [updateCustomer] = useMutation(UpdateCustomerDoc);
  const [deleteCustomer] = useMutation(DeleteCustomerDoc);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      kind: 'LOCAL_BROKER',
      contactPhone: '',
      address: '',
      bankAccount: '',
      registrationNumber: '',
      taxId: '',
    },
  });

  function openCreate() {
    setEditing(null);
    form.reset({
      name: '',
      kind: 'LOCAL_BROKER',
      contactPhone: '',
      address: '',
      bankAccount: '',
      registrationNumber: '',
      taxId: '',
    });
    setOpen(true);
  }

  function openEdit(c: NonNullable<EditTarget>) {
    setEditing(c);
    const k = (c.kind as Kind | null) ?? 'LOCAL_BROKER';
    form.reset({
      name: c.name ?? '',
      kind: k,
      contactPhone: c.contactPhone ?? '',
      address: c.address ?? '',
      bankAccount: c.bankAccount ?? '',
      registrationNumber: c.registrationNumber ?? '',
      taxId: c.taxId ?? '',
    });
    setOpen(true);
  }

  async function onSubmit(values: Values) {
    await runMutation(
      async () => {
        if (editing?.id) {
          const r = await updateCustomer({
            variables: {
              id: editing.id,
              name: values.name.trim(),
              kind: values.kind as Customer_Kind,
              contactPhone: values.contactPhone?.trim() || null,
              address: values.address?.trim() || null,
              bankAccount: values.bankAccount?.trim() || null,
              registrationNumber: values.registrationNumber?.trim() || null,
              taxId: values.taxId?.trim() || null,
              isActive: editing.isActive ?? true,
            },
          });
          return r.data?.updateCustomer;
        }
        const r = await createCustomer({
          variables: {
            name: values.name.trim(),
            kind: values.kind as Customer_Kind,
            contactPhone: values.contactPhone?.trim() || null,
            address: values.address?.trim() || null,
            bankAccount: values.bankAccount?.trim() || null,
            registrationNumber: values.registrationNumber?.trim() || null,
            taxId: values.taxId?.trim() || null,
          },
        });
        return r.data?.createCustomer;
      },
      {
        success: editing?.id ? 'Шинэчлэгдлээ' : 'Харилцагч нэмэгдлээ',
        onSuccess: () => {
          setOpen(false);
          refetch();
        },
      },
    );
  }

  async function toggleActive(id: string, isActive: boolean) {
    await runMutation(
      async () =>
        (await updateCustomer({ variables: { id, isActive: !isActive } })).data
          ?.updateCustomer,
      { onSuccess: refetch },
    );
  }

  async function onDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    await runMutation(
      async () =>
        (await deleteCustomer({ variables: { id } })).data?.deleteCustomer,
      { success: 'Устгагдлаа', onSuccess: refetch },
    );
  }

  const customers = compact(data?.customers?.customers);
  const total = data?.customers?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Хайх (нэр)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <Tabs
            value={kindFilter}
            onValueChange={(v) => {
              setKindFilter(v as 'ALL' | Kind);
              setPage(1);
            }}
          >
            <TabsList>
              <TabsTrigger value="ALL">Бүгд</TabsTrigger>
              {KIND_VALUES.map((k) => (
                <TabsTrigger key={k} value={k}>
                  {CUSTOMER_KIND_MN[k]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={openCreate}>Шинэ харилцагч</Button>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>
                {editing ? 'Харилцагч засах' : 'Шинэ харилцагч'}
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
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Төрөл</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Сонгох">
                              <span>{CUSTOMER_KIND_MN[field.value]}</span>
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {KIND_VALUES.map((k) => (
                            <SelectItem key={k} value={k}>
                              {CUSTOMER_KIND_MN[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
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
                  name="registrationNumber"
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
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ТТД</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  Хадгалах
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {fetching && customers.length === 0 ? (
        <Skeleton className="h-48 w-full" />
      ) : customers.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Харилцагч олдсонгүй
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Нэр</TableHead>
                <TableHead>Төрөл</TableHead>
                <TableHead>Утас</TableHead>
                <TableHead>Регистр / ТТД</TableHead>
                <TableHead>Идэвхтэй</TableHead>
                <TableHead>Үйлдэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id!}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        CUSTOMER_KIND_COLOR[c.kind ?? ''] ?? 'border-0 bg-muted'
                      }
                    >
                      {CUSTOMER_KIND_MN[c.kind ?? ''] ?? '—'}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.contactPhone ?? '—'}</TableCell>
                  <TableCell>
                    {[c.registrationNumber, c.taxId]
                      .filter(Boolean)
                      .join(' / ') || '—'}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleActive(c.id!, c.isActive ?? false)}
                      className="inline-block"
                    >
                      <Badge
                        className={
                          c.isActive
                            ? 'border-0 bg-emerald-100 text-emerald-800'
                            : 'border-0 bg-rose-100 text-rose-800'
                        }
                      >
                        {c.isActive ? 'Тийм' : 'Үгүй'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(c)}
                    >
                      Засах
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(c.id!)}
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
            disabled={customers.length < 20}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </Button>
        </div>
      </div>
    </div>
  );
}
