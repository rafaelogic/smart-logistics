type BrandProps = {
  compact?: boolean;
};

export function Brand({ compact = false }: BrandProps) {
  return (
    <a className="inline-flex items-center gap-2.5 font-extrabold text-foreground" href="#top" aria-label="Smart Logistics home">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-xs font-extrabold text-primary-foreground">SL</span>
      {!compact && <span className="whitespace-nowrap text-sm">Smart Logistics</span>}
    </a>
  );
}
