type MetricCardProps = {
  label: string;
  value: string | number;
  caption: string;
};

export function MetricCard({ label, value, caption }: MetricCardProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <span className="text-xs font-extrabold uppercase text-muted-foreground">{label}</span>
      <strong className="mt-2 block text-3xl font-extrabold text-foreground">{value}</strong>
      <small className="mt-1 block text-sm font-semibold text-muted-foreground">{caption}</small>
    </article>
  );
}
