interface Props {
  version: string;
}

export function AppFooter({ version }: Props) {
  return (
    <footer className="flex justify-center py-1.5">
      <div className="w-[90vw] border-t border-slate-200 pt-1.5 flex items-center">
        <span className="text-[10px] font-mono text-slate-400">
          ({version})
        </span>
      </div>
    </footer>
  );
}
