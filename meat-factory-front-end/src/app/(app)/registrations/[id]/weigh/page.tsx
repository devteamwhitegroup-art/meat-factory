import { WeighClient } from "./weigh-client";
import { requireCap } from "@/lib/auth/server";

type Props = { params: Promise<{ id: string }> };

export default async function WeighPage({ params }: Props) {
  await requireCap("REGISTRATION_WEIGH");
  const { id } = await params;
  return <WeighClient id={id} />;
}
