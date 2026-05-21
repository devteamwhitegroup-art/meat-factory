'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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
  CreateCustomerDoc,
  CustomerListDoc,
  DeleteCustomerDoc,
  UpdateCustomerDoc,
} from '@/lib/queries/customer';
import { unwrap } from '@/lib/unwrap';
import { compact } from '@/lib/compact';

const schema = z.object({
  name: z.string().min(1, 'Нэр шаардлагатай'),
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
  const { data, loading: fetching, refetch } = useQuery(CustomerListDoc, {
    variables: {
      search: search || null,
      isActive: null,
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
    form.reset({
      name: c.name ?? '',
      contactPhone: c.contactPhone ?? '',
      address: c.address ?? '',
      bankAccount: c.bankAccount ?? '',
      registrationNumber: c.registrationNumber ?? '',
      taxId: c.taxId ?? '',
    });
    setOpen(true);
  }

  async function onSubmit(values: Values) {
    try {
      if (editing?.id) {
        const r = await updateCustomer({
          variables: {
            id: editing.id,
            name: values.name.trim(),
            contactPhone: values.contactPhone?.trim() || null,
            address: values.address?.trim() || null,
            bankAccount: values.bankAccount?.trim() || null,
            registrationNumber: values.registrationNumber?.trim() || null,
            taxId: values.taxId?.trim() || null,
            isActive: editing.isActive ?? true,
          },
        });
        unwrap(r.data?.updateCustomer);
        toast.success('Шинэчлэгдлээ');
      } else {
        const r = await createCustomer({
          variables: {
            name: values.name.trim(),
            contactPhone: values.contactPhone?.trim() || null,
            address: values.address?.trim() || null,
            bankAccount: values.bankAccount?.trim() || null,
            registrationNumber: values.registrationNumber?.trim() || null,
            taxId: values.taxId?.trim() || null,
          },
        });
        unwrap(r.data?.createCustomer);
        toast.success('Харилцагч нэмэгдлээ');
      }
      setOpen(false);
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      const r = await updateCustomer({ variables: { id, isActive: !isActive } });
      unwrap(r.data?.updateCustomer);
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    try {
      const r = await deleteCustomer({ variables: { id } });
      unwrap(r.data?.deleteCustomer);
      toast.success('Устгагдлаа');
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const customers = compact(data?.customers?.customers);
  const total = data?.customers?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input
          placeholder="Хайх (нэр)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
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
