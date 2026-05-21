'use client';

import { Provider } from 'urql';
import { browserUrqlClient } from './client';

export function UrqlProvider({ children }: { children: React.ReactNode }) {
  return <Provider value={browserUrqlClient}>{children}</Provider>;
}
