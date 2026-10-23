import { Suspense } from "react";
import Image from "next/image";
import { LoginForm } from "./login-form";
import factory from "../factory.png";

// /login uses useSearchParams() in the client form → opt out of static prerender.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Factory photo panel; desktop only so the form stays first on phones. */}
      <div className="relative hidden lg:block">
        <Image
          src={factory}
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-10 text-white">
          <div className="text-3xl font-bold tracking-tight">Вайт Групп</div>
          <div className="max-w-md text-lg text-white/85">
            Мал хүлээн авахаас эхлээд төлбөр, ачилт хүртэлх бүх ажлыг нэг
            дороос.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-4 text-center">
            <Image
              src="/brand/mark-dark.png"
              alt="Вайт Групп"
              width={72}
              height={63}
              priority
              className="mx-auto dark:invert"
            />
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Системд нэвтрэх
              </h1>
              <p className="text-base text-muted-foreground">
                Хэрэглэгчийн нэр, нууц үгээ оруулна уу.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Нууц үгээ мартсан бол системийн админд хандана уу.
          </p>

          {process.env.NODE_ENV !== "production" ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              <div className="mb-1 font-medium">Туршилтын данс (dev):</div>
              <ul className="list-disc pl-4">
                <li>admin@example.com / admin123 (ADMIN)</li>
                <li>store@example.com / admin123</li>
                <li>accountant@example.com / admin123</li>
                <li>doctor@example.com / admin123</li>
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
