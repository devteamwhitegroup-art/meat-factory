import { ByproductClient } from './byproduct-client';

type Props = { params: Promise<{ id: string }> };

export default async function ByproductPage({ params }: Props) {
  const { id } = await params;
  return <ByproductClient id={id} />;
}
