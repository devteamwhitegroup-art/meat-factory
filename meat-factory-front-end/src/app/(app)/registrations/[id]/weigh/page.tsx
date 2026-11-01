import { WeighClient } from "./weigh-client";
import { requireCap } from "@/lib/auth/server";

type Props = { params: Promise<{ id: string }> };

export default async function WeighPage({ params }: Props) {
  // Weighing, or the privileged fix once weighed (reg.can.weigh decides).
  await requireCap("REGISTRATION_WEIGH", "REGISTRATION_WEIGH_FIX");
  const { id } = await params;
  return <WeighClient id={id} />;
}
