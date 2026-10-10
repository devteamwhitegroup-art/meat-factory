import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

// /login uses useSearchParams() in the client form → opt out of static prerender.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Махны үйлдвэрийн ERP</CardTitle>
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
  );
}
