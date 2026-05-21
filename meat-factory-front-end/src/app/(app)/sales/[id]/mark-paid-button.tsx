'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'urql';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MarkSalesTransactionPaidDoc } from '@/lib/queries/sales';
import { unwrap } from '@/lib/urql/unwrap';

export function MarkPaidButton({ id }: { id: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [, markPaid] = useMutation(MarkSalesTransactionPaidDoc);
  async function onClick() {
    setBusy(true);
    try {
      const r = await markPaid({ id });
      unwrap(r.data?.markSalesTransactionPaid);
      toast.success('Төлбөр тэмдэглэгдлээ');
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button onClick={onClick} disabled={busy}>
      {busy ? '...' : 'Төлбөр төлсөнд тэмдэглэх'}
    </Button>
  );
}
