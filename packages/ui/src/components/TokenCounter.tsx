import { ArrowBigDown, ArrowBigUp, ArrowDown, ArrowUp } from 'lucide-react';

interface CounterValues {
  input: number;
  output: number;
}

interface Props {
  latest: CounterValues | null;
  cumulative: CounterValues | null;
  unavailable?: boolean;
}

export function TokenCounter({ latest, cumulative, unavailable = false }: Props) {
  if (unavailable) {
    return <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Tokens n/a</div>;
  }

  const latestValues = latest ?? { input: 0, output: 0 };
  const cumulativeValues = cumulative ?? { input: 0, output: 0 };

  return (
    <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
      <div className="flex items-center gap-1" aria-label="Latest roundtrip tokens">
        <ArrowUp size={12} strokeWidth={1.5} />
        <span>{formatTokenCount(latestValues.input)}</span>
        <ArrowDown size={12} strokeWidth={1.5} />
        <span>{formatTokenCount(latestValues.output)}</span>
      </div>
      <div className="flex items-center gap-1" aria-label="Cumulative conversation tokens">
        <ArrowBigUp size={13} strokeWidth={1.8} />
        <span>{formatTokenCount(cumulativeValues.input)}</span>
        <ArrowBigDown size={13} strokeWidth={1.8} />
        <span>{formatTokenCount(cumulativeValues.output)}</span>
      </div>
    </div>
  );
}

function formatTokenCount(value: number): string {
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }

  return String(value);
}
