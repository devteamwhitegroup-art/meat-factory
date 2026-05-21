import { SettlementClient } from './settlement-client';

type Props = { params: Promise<{ id: string }> };

export default async function SettlementPage({ params }: Props) {
  const { id } = await params;
  return <SettlementClient id={id} />;
}
