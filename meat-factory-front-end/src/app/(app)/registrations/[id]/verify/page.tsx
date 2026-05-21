import { VerifyClient } from './verify-client';

type Props = { params: Promise<{ id: string }> };

export default async function VerifyPage({ params }: Props) {
  const { id } = await params;
  return <VerifyClient id={id} />;
}
