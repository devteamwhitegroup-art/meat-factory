import { ByproductClient } from "./byproduct-client";
import { requireCap } from "@/lib/auth/server";

type Props = { params: Promise<{ id: string }> };

export default async function ByproductPage({ params }: Props) {
  await requireCap("REGISTRATION_WEIGH");
  const { id } = await params;
  return <ByproductClient id={id} />;
}
