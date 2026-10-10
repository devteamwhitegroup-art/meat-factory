import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { FACTORY_COOKIE } from "@/lib/auth/server";
import { can } from "@/lib/auth/roles";

function landingFor(role: string | null | undefined): string {
  switch (role) {
    case "STOREKEEPER":
      return "/registrations?stage=in_process";
    case "ACCOUNTANT":
      return "/sales";
    case "DOCTOR":
      return "/medical-numbers";
    case "ADMIN":
    default:
      return "/dashboard";
  }
}

export default async function RootPage() {
  const jar = await cookies();
  const role = jar.get(env.ROLE_COOKIE_NAME)?.value ?? null;
  // Byproduct-factory staff never handle livestock.
  if (
    jar.get(FACTORY_COOKIE)?.value === "FACTORY_3" &&
    can(role, "byproductProcessing")
  )
    redirect("/byproduct-processing");
  redirect(landingFor(role));
}
