import { Suspense } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";
import factory from "../factory.png";

// /login uses useSearchParams() in the client form → opt out of static prerender.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Factory photo panel; desktop only so the form stays first on phones. */}
      <div className="relative hidden lg:block">
        <Image
          src={factory}
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
      </div>
      <div className="flex items-center justify-center bg-sidebar p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="justify-items-center text-center">
            <Image
              src="/brand/mark-dark.png"
              alt="Вайт Групп"
              width={56}
              height={49}
              priority
              className="mb-2 dark:invert"
            />
            <CardTitle className="text-xl">Вайтгрүпп ERP</CardTitle>
            <CardDescription>Бүртгэлээр нэвтэрнэ үү</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
            {process.env.NODE_ENV !== "production" ? (
              <div className="mt-6 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                <div className="mb-1 font-medium">Туршилтын данс (dev):</div>
                <ul className="list-disc pl-4">
                  <li>admin@example.com / admin123 (ADMIN)</li>
                  <li>store@example.com / admin123</li>
                  <li>accountant@example.com / admin123</li>
                  <li>doctor@example.com / admin123</li>
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
