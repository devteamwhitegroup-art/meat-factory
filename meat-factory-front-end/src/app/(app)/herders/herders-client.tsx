'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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
import { unwrap } from '@/lib/urql/unwrap';
import { fmtDate } from '@/lib/format/date';

const schema = z.object({
  name: z.string().min(1, 'Нэр шаардлагатай'),
  registrationNo: z.string().min(1, 'Регистр шаардлагатай'),
  phone: z.string().optional(),
  bankAccount: z.string().optional(),
  address: z.string().min(1, 'Хаяг шаардлагатай'),
});
type Values = z.infer<typeof schema>;

type EditTarget = {
  id?: string | null;
  name?: string | null;
  registrationNo?: string | null;
  phone?: string | null;
  bankAccount?: string | null;
  address?: string | null;
} | null;

export function HerdersClient() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [{ data, fetching }, refetch] = useQuery({
    query: HerderListDoc,
    variables: { search: search || null, limit: 20, page },
    requestPolicy: 'cache-and-network',
  });
  const [, createHerder] = useMutation(CreateHerderDoc);
  const [, updateHerder] = useMutation(UpdateHerderDoc);
  const [, deleteHerder] = useMutation(DeleteHerderDoc);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget>(null);
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

  function openCreate() {
    setEditing(null);
    form.reset({
      name: '',
      registrationNo: '',
      phone: '',
      bankAccount: '',
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
      address: h.address ?? '',
    });
    setSheetOpen(true);
  }

  async function onSubmit(values: Values) {
    try {
      if (editing?.id) {
        const r = await updateHerder({
          id: editing.id,
          name: values.name.trim(),
          registrationNo: values.registrationNo.trim(),
          phone: values.phone?.trim() || null,
          bankAccount: values.bankAccount?.trim() || null,
          address: values.address.trim(),
        });
        unwrap(r.data?.updateHerder);
        toast.success('Шинэчлэгдлээ');
      } else {
        const r = await createHerder({
          name: values.name.trim(),
          registrationNo: values.registrationNo.trim(),
          phone: values.phone?.trim() || null,
          bankAccount: values.bankAccount?.trim() || null,
          address: values.address.trim(),
        });
        unwrap(r.data?.createHerder);
        toast.success('Малчин нэмэгдлээ');
      }
      setSheetOpen(false);
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Устгах уу?')) return;
    try {
      const r = await deleteHerder({ id });
      unwrap(r.data?.deleteHerder);
      toast.success('Устгагдлаа');
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error((e as Error).message);
    }
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
                      <FormLabel>Малчны данс</FormLabel>
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
                  <TableCell>{h.address}</TableCell>
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
