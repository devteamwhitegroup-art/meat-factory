"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({
  label = "Буцах",
  href,
}: {
  label?: string;
  href?: string;
}) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => (href ? router.push(href) : router.back())}
    >
      <ArrowLeftIcon />
      {label}
    </Button>
  );
}
