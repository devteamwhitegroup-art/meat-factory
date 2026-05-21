'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'urql';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/registration/StatusBadge';
import { PhotoUpload } from '@/components/common/PhotoUpload';
import { fmtDateTime } from '@/lib/format/date';
import {
  RegistrationDetailDoc,
  VerifyRegistrationDoc,
} from '@/lib/queries/registration';
import { unwrap } from '@/lib/urql/unwrap';

export function VerifyClient({ id }: { id: string }) {
  const router = useRouter();
  const [{ data, fetching }, refetch] = useQuery({
    query: RegistrationDetailDoc,
    variables: { id },
    requestPolicy: 'cache-and-network',
  });
  const [, verify] = useMutation(VerifyRegistrationDoc);
  const [notes, setNotes] = useState('');
  const [photoFileId, setPhotoFileId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (fetching && !data) return <Skeleton className="h-72 w-full" />;
  const reg = data?.registration?.registration;
  if (!reg) return <div className="text-muted-foreground">Олдсонгүй</div>;

  const v = reg.verification;
  const slot1Filled = !!v?.firstVerifierId;
  const slot2Filled = !!v?.secondVerifierId;

  async function sign() {
    setBusy(true);
    try {
      const r = await verify({
        registrationId: id,
        notes: notes.trim() || null,
        photoFileId: photoFileId ?? null,
      });
      unwrap(r.data?.verifyRegistration);
      toast.success('Баталгаажилт амжилттай');
      setNotes('');
      setPhotoFileId(null);
      refetch({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Бүртгэлийн дугаар</div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">#{reg.registrationNumber}</h1>
            <StatusBadge status={reg.status} />
          </div>
        </div>
        {reg.status === 'VERIFIED' || reg.status === 'SETTLED' ? (
          <Button onClick={() => router.push(`/registrations/${id}/settlement`)}>
            Тооцоо үүсгэх →
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Баталгаажуулалт — хоёр ажилтны шалгалт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-md border p-4">
              <div className="text-muted-foreground">Эхний баталгаа</div>
              <div className="mt-1 text-base">
                {v?.firstVerifier?.param ?? '— хоосон —'}
              </div>
              <div className="text-xs text-muted-foreground">
                {v?.firstVerifiedAt ? fmtDateTime(v.firstVerifiedAt) : '—'}
              </div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-muted-foreground">Хоёр дахь баталгаа</div>
              <div className="mt-1 text-base">
                {v?.secondVerifier?.param ?? '— хоосон —'}
              </div>
              <div className="text-xs text-muted-foreground">
                {v?.secondVerifiedAt ? fmtDateTime(v.secondVerifiedAt) : '—'}
              </div>
            </div>
          </div>

          {slot1Filled && !slot2Filled ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Хоёр дахь баталгаажуулалтыг өөр ажилтан хийх ёстой.
            </div>
          ) : null}

          {!slot2Filled && reg.status === 'WEIGHED' && (
            <div className="space-y-3">
              <Textarea
                placeholder="Тэмдэглэл (заавал биш)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
              <PhotoUpload
                value={photoFileId}
                onChange={setPhotoFileId}
                type="verify"
                label="Зураг (заавал биш)"
              />
              <Button onClick={sign} disabled={busy} className="w-full">
                {busy ? '...' : 'Гарын үсэг зурах'}
              </Button>
            </div>
          )}

          {slot2Filled && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
              Баталгаажилт дууссан.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
