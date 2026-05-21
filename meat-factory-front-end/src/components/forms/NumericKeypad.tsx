'use client';

import { Button } from '@/components/ui/button';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '←'];

export function NumericKeypad({
  value,
  onChange,
  onSubmit,
  disabled,
}: Props) {
  function press(k: string) {
    if (disabled) return;
    if (k === '←') {
      onChange(value.length > 1 ? value.slice(0, -1) : '');
      return;
    }
    if (k === '.' && value.includes('.')) return;
    if (k === '.' && value === '') {
      onChange('0.');
      return;
    }
    if (value === '0' && k !== '.') {
      onChange(k);
      return;
    }
    onChange(value + k);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-black p-6 text-center font-mono text-4xl text-emerald-400">
        {value || '0'}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <Button
            key={k}
            type="button"
            variant="outline"
            className="h-14 text-xl"
            onClick={() => press(k)}
            disabled={disabled}
          >
            {k}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-12"
          onClick={() => onChange('')}
          disabled={disabled}
        >
          Цэвэрлэх
        </Button>
        <Button
          type="button"
          className="h-12"
          onClick={onSubmit}
          disabled={disabled || !value || Number(value) <= 0}
        >
          Бүртгэх
        </Button>
      </div>
    </div>
  );
}
