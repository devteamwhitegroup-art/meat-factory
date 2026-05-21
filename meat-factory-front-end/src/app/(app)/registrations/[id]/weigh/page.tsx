import { WeighClient } from './weigh-client';

type Props = { params: Promise<{ id: string }> };

export default async function WeighPage({ params }: Props) {
  const { id } = await params;
  return <WeighClient id={id} />;
}
