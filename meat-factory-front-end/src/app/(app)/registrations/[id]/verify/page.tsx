import { VerifyClient } from './verify-client';
import { requireCap } from '@/lib/auth/server';

type Props = { params: Promise<{ id: string }> };

export default async function VerifyPage({ params }: Props) {
  await requireCap('verify');
  const { id } = await params;
  return <VerifyClient id={id} />;
}
