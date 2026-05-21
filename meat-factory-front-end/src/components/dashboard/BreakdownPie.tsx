'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#f59e0b',
  '#9333ea',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ea580c',
  '#0ea5e9',
];

type Slice = { name: string; value: number };

export function BreakdownPie({
  title,
  data,
  emptyText,
}: {
  title: string;
  data: Slice[];
  emptyText: string;
}) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(p) =>
                  `${p.name}: ${Number(p.value).toLocaleString('mn-MN')}`
                }
              >
                {filtered.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => Number(v).toLocaleString('mn-MN')}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
