import { redirect } from 'next/navigation';

// Shipments are now split into two category pages. Default to export — the
// main business — with an on-page switch over to domestic.
export default function ShipmentsPage() {
  redirect('/shipments/export');
}
