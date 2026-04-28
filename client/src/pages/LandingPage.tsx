import { ArrowRight, Boxes, DatabaseZap, FileText, LockKeyhole, Route, ShieldCheck, Warehouse } from "lucide-react";
import { Button, LinkButton } from "../components/Button";

type LandingPageProps = {
  onOpenDashboard: () => void;
};

export function LandingPage({ onOpenDashboard }: LandingPageProps) {
  const schemaCards = [
    ["Warehouses", "Name, location, max capacity, and Standard or Cold Storage type.", Warehouse],
    ["Items", "Name, SKU matching ABC-12345-X, and Standard or Cold storage requirement.", Boxes],
    ["Inventory", "Warehouse-item quantities with occupancy and low-stock visibility.", DatabaseZap]
  ] as const;

  const endpointRows = [
    ["POST", "/inventory/add", "Rejects cold items in standard warehouses and blocks capacity overflow."],
    ["POST", "/inventory/transfer", "Moves stock atomically after source, destination, capacity, storage, and SKU checks."],
    ["GET", "/inventory/report", "Returns paginated warehouse occupancy, percent full, stored items, and low-stock flags."]
  ];

  const reliabilityRows = [
    ["Consistent errors", '{ "error": "INSUFFICIENT_CAPACITY", "message": "...", "code": 422 }'],
    ["Strict validation", "SKU regex, UUID checks, positive integer quantities, and bounded report pagination."],
    ["Race protection", "Serializable transactions plus warehouse and inventory row locks around capacity and transfer decisions."],
    ["Soft deletes", "Warehouses are deleted only when empty, preserving inventory integrity."],
    ["Request logging", "Middleware logs every incoming request and response time."],
    ["Environment config", "Database URL, auth credentials, JWT secret, and port come from .env."]
  ];

  return (
    <main id="top">
      <section className="grid min-h-[calc(100vh-72px)] min-w-0 grid-cols-1 items-center gap-10 px-5 py-12 md:px-10 xl:grid-cols-[0.85fr_1.15fr] xl:px-14 xl:py-16">
        <div className="min-w-0 max-w-2xl">
          <h1 className="max-w-[310px] break-words text-4xl font-extrabold leading-[1.04] text-ink sm:max-w-[620px] sm:text-5xl md:max-w-[780px] md:text-6xl xl:text-7xl">
            Inventory intelligence for every warehouse
          </h1>
          <p className="mt-7 max-w-[310px] text-lg leading-8 text-muted-foreground sm:max-w-xl">
            Real-time capacity, protected transfers, and cold-chain controls for teams running distributed warehouse networks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="large" onClick={onOpenDashboard}>
              Open Dashboard
              <ArrowRight size={18} />
            </Button>
            <LinkButton size="large" href="/docs">View API Docs</LinkButton>
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["ABC-12345-X", "SKU validation"],
              ["100/page", "bounded reports"],
              ["SERIALIZABLE", "transfer isolation"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-line bg-white/70 p-4">
                <dt className="text-lg font-extrabold text-ink">{value}</dt>
                <dd className="mt-1 text-xs font-bold uppercase text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-white p-4 shadow-corporate" aria-label="Inventory dashboard preview">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Production network</span>
            <strong>API secured</strong>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["Warehouses", "Name, location", "Capacity and storage type"],
              ["Items", "SKU + storage", "Standard or cold requirement"],
              ["Inventory", "Quantity ledger", "Low stock below 10 units"]
            ].map(([label, value, caption]) => (
              <article key={label} className="rounded-lg border border-line bg-moss p-4">
                <span className="text-xs font-bold uppercase text-muted-foreground">{label}</span>
                <strong className="mt-1 block text-2xl font-extrabold text-ink">{value}</strong>
                <small className="text-sm font-semibold text-muted-foreground">{caption}</small>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-lg border border-line p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-ink">Capacity profile</h2>
                <span className="text-xs font-extrabold uppercase text-teal-600">Live</span>
              </div>
              <div className="mt-8 flex h-48 items-end gap-3 border-b border-line">
                {[46, 72, 58, 86, 64, 49].map((height, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-teal-600 to-emerald-300"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-line p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-ink">Transfer queue</h2>
                <span className="text-xs font-extrabold uppercase text-muted-foreground">4 open</span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["ICE-12842-C", "Cold Manila to Cebu Hub", false],
                  ["MED-44108-C", "Capacity review required", true],
                  ["DRY-98122-A", "Ghost-stock check passed", false]
                ].map(([sku, copy, warn]) => (
                  <div key={String(sku)} className={`rounded-lg border p-3 ${warn ? "border-amber-200 bg-amber-50" : "border-line bg-white"}`}>
                    <strong className="block text-sm text-ink">{sku}</strong>
                    <span className="text-sm text-muted-foreground">{copy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="border-y border-line bg-white px-5 py-16 md:px-10 xl:px-14" id="platform">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-extrabold text-ink">Data model</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">The workspace mirrors the API schema for warehouses, items, and inventory quantities.</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {schemaCards.map(([title, copy, Icon]) => (
            <article key={String(title)} className="rounded-lg border border-line bg-[#f6f8f7] p-6">
              <Icon className="text-teal-600" size={24} />
              <h3 className="mt-5 text-xl font-extrabold text-ink">{title as string}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{copy as string}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 px-5 py-16 md:px-10 lg:grid-cols-[0.85fr_1.15fr] xl:px-14" id="operations">
        <div>
          <h2 className="text-4xl font-extrabold text-ink">Inventory logic</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            The core endpoints enforce capacity, storage compatibility, SKU identity, and atomic transfer behavior.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/docs">Swagger Docs</LinkButton>
            <LinkButton href="/openapi.json">OpenAPI JSON</LinkButton>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-corporate">
          {endpointRows.map(([method, path, detail]) => (
            <div key={path} className="grid gap-2 border-b border-line py-4 last:border-b-0 sm:grid-cols-[92px_190px_1fr] sm:items-center">
              <span className="w-fit rounded-md bg-moss px-2 py-1 text-xs font-extrabold uppercase text-teal-700">{method}</span>
              <strong className="font-mono text-sm text-ink">{path}</strong>
              <span className="text-sm font-semibold leading-6 text-muted-foreground">{detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-white px-5 py-16 md:px-10 xl:px-14">
        <div className="flex max-w-4xl items-start gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink text-white">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-ink">Reliability checks</h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              The UI calls out the implementation details that protect the warehouse ledger from invalid inputs, race conditions, and oversized reports.
            </p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reliabilityRows.map(([title, copy]) => (
            <article key={title} className="rounded-lg border border-line bg-[#f6f8f7] p-5">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-ink">
                {title === "Consistent errors" ? <FileText size={19} /> : title === "Race protection" ? <LockKeyhole size={19} /> : <Route size={19} />}
                {title}
              </h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">{copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
