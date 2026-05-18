interface Props {
  percentLeft: number | null;
  unavailable?: boolean;
}

export function ContextWindowTracker({ percentLeft, unavailable = false }: Props) {
  if (unavailable) {
    return <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Context n/a</div>;
  }

  return (
    <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
      {percentLeft ?? 100}% left
    </div>
  );
}
