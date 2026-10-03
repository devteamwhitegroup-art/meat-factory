"use client";

import { useRouter } from "next/navigation";

// Shared by the sidebar (office roles) and the kiosk top bar (operator roles).
export function useLogout() {
  const router = useRouter();
  return async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };
}
