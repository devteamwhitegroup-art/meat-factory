import { VerifyClient } from "./verify-client";
import { requireCap } from "@/lib/auth/server";

type Props = { params: Promise<{ id: string }> };

export default async function VerifyPage({ params }: Props) {
  const session = await requireCap("REGISTRATION_VERIFY");
  const { id } = await params;
  // Хойд үйлдвэр verify = finishing weighing (нярав / admin).
  return <VerifyClient id={id} canFinishWeighing={session.can("REGISTRATION_WEIGH")} />;
}
