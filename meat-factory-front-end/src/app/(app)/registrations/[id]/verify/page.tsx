import { VerifyClient } from "./verify-client";
import { requireCap } from "@/lib/auth/server";

type Props = { params: Promise<{ id: string }> };

export default async function VerifyPage({ params }: Props) {
  // Live intake is verified here; pre-butchered intake finishes weighing here
  // (REGISTRATION_WEIGH). What the account may do comes from `reg.can`.
  await requireCap("REGISTRATION_VERIFY", "REGISTRATION_WEIGH");
  const { id } = await params;
  return <VerifyClient id={id} />;
}
