"use client";

import { useQuery } from "@apollo/client/react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { HerderAddressListDoc } from "@/lib/queries/herder-address";
import { compact } from "@/lib/compact";

// Shared herder create/edit form: schema, defaults, mutation vars, and the
// field list. Used by the /herders CRUD sheet and the registration
// HerderPicker dialog — the callers own the <Form>, submit wiring and buttons.

// Either pick an address from the catalogue (addressId) or type one in
// (address). At least one is required; both are allowed when admin wants to
// override the catalogue label for an unusual herder.
export const herderSchema = z
  .object({
    name: z.string().min(1, "Нэр шаардлагатай"),
    registrationNo: z.string().min(1, "Регистрийн дугаар шаардлагатай"),
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
      path: ["addressId"],
      message: "Хаяг сонгох эсвэл бичих",
    },
  );
export type HerderFormValues = z.infer<typeof herderSchema>;

export const herderFormDefaults: HerderFormValues = {
  name: "",
  registrationNo: "",
  phone: "",
  bankAccount: "",
  bankName: "",
  accountHolderName: "",
  addressId: "",
  address: "",
};

// Trimmed createHerder/updateHerder variables. The free-form address is a
// fallback — only sent when no catalogue id is picked.
export function herderMutationVars(values: HerderFormValues) {
  return {
    name: values.name.trim(),
    registrationNo: values.registrationNo.trim(),
    phone: values.phone?.trim() || null,
    bankAccount: values.bankAccount?.trim() || null,
    bankName: values.bankName?.trim() || null,
    accountHolderName: values.accountHolderName?.trim() || null,
    addressId: values.addressId || null,
    address: values.addressId ? null : values.address?.trim() || null,
  };
}

export function HerderFormFields({
  form,
}: {
  form: UseFormReturn<HerderFormValues>;
}) {
  // Address catalogue for the dropdown.
  const { data: addrData } = useQuery(HerderAddressListDoc, {
    variables: { search: null, isActive: true },
    fetchPolicy: "cache-and-network",
  });
  const addresses = compact(addrData?.herderAddresses?.herderAddresses);

  return (
    <>
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
              <Input placeholder="ж: Хаан банк" {...field} />
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
              <Input placeholder="(зөвхөн өөр хүний данс үед)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="addressId"
        render={({ field }) => {
          // Resolve the picked address's name manually — base-ui Select shows
          // the raw UUID in the trigger when the matching <SelectItem> isn't
          // currently in the tree.
          const selected = addresses.find((a) => a.id === field.value);
          return (
            <FormItem>
              <FormLabel>Хаяг</FormLabel>
              <FormControl>
                <Select
                  value={field.value || undefined}
                  onValueChange={(v) => field.onChange(v ?? "")}
                >
                  <SelectTrigger className="h-10 w-full">
                    {field.value ? (
                      <span>{selected?.name ?? "Сонгосон"}</span>
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
              <Input placeholder="Жагсаалтаас сонгоогүй үед бичнэ" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
