'use client';

import { useQuery } from '@apollo/client/react';
import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { MonthlyOverviewDoc } from '@/lib/queries/monthly-budget';
import { compact } from '@/lib/compact';

const MN_MONTH = [
  '1 сар',
  '2 сар',
  '3 сар',
  '4 сар',
  '5 сар',
  '6 сар',
  '7 сар',
  '8 сар',
  '9 сар',
  '10 сар',
  '11 сар',
  '12 сар',
];

function formatTick(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

// Sa-by-month bars (income, herder cost) overlaid with the budget target line.
// Sources: paid SalesTransactions for income, paid Settlements for herder
// cost, MonthlyBudget table for the target.
export function MonthlyOverviewChart({ monthsBack = 12 }: { monthsBack?: number }) {
  const { data, loading, error } = useQuery(MonthlyOverviewDoc, {
    variables: { monthsBack },
    fetchPolicy: 'cache-and-network',
  });
  const rows = compact(data?.monthlyOverview?.rows);
  const chartData = rows.map((r) => ({
    label: `${MN_MONTH[(r.month ?? 1) - 1]} '${String(r.year ?? 0).slice(-2)}`,
    income: Number(r.incomeMnt ?? 0),
    herderCost: Number(r.herderCostMnt ?? 0),
    budget: Number(r.budgetMnt ?? 0),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сараар: Орлого / Малчдын зардал / Төсөв</CardTitle>
      </CardHeader>
      <CardContent className="h-80">
        {loading && chartData.length === 0 ? (
          <Skeleton className="h-full w-full" />
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-destructive">
            Өгөгдөл ачаалахад алдаа гарлаа
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Өгөгдөл алга
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatTick} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) =>
                  `${Number(v ?? 0).toLocaleString('mn-MN')} ₮`
                }
              />
              <Legend />
              <Bar dataKey="income" name="Орлого" fill="#16a34a" />
              <Bar dataKey="herderCost" name="Малчдын зардал" fill="#dc2626" />
              <Line
                type="monotone"
                dataKey="budget"
                name="Төсөв"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
