"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const schema = z.object({
  param: z.string().min(3, "Хамгийн багадаа 3 тэмдэгт"),
  password: z.string().min(6, "Хамгийн багадаа 6 тэмдэгт"),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  // Typing blind is the #1 login failure for new users; let them look.
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { param: "", password: "" },
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          param: values.param.trim(),
          password: values.password.trim(),
        }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string };
      if (!data.ok) {
        toast.error(data.message ?? "Нэвтрэх амжилтгүй");
        return;
      }
      const from = search.get("from");
      router.replace(from && from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      toast.error("Сервер холбогдсонгүй");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="param"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Хэрэглэгчийн нэр / И-мэйл</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  autoFocus
                  className="h-12 text-lg"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Нууц үг</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="h-12 pr-14 text-lg"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                    title={showPassword ? "Нууц үг нуух" : "Нууц үг харах"}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 w-full text-lg"
          disabled={submitting}
        >
          <LogIn />
          {submitting ? "Нэвтэрч байна…" : "Нэвтрэх"}
        </Button>
      </form>
    </Form>
  );
}
