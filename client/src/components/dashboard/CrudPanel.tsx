import type { ReactNode } from "react";

type CrudPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function CrudPanel({ title, description, children }: CrudPanelProps) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h3 className="text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}
