import { ExternalLink, FileText, LockKeyhole, Route, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const requirementCards = [
  ["Warehouses", "Name, location, max capacity, and storage type are modeled in the warehouse table."],
  ["Items", "Name, SKU, and storage requirement are modeled with the ABC-12345-X SKU constraint."],
  ["Inventory", "Warehouse-item quantity rows power occupancy, percent-full, and low-stock reporting."],
  ["Add stock", "POST /inventory/add blocks cold-to-standard placement and capacity overflow."],
  ["Transfer stock", "POST /inventory/transfer moves one SKU atomically between two warehouses."],
  ["Reports", "GET /inventory/report paginates warehouses and each warehouse item list."]
];

const reliabilityCards = [
  ["SKU regex", "^[A-Z]{3}-\\d{5}-[A-Z]$ validation is applied before service logic runs."],
  ["Concurrency", "Serializable transactions and row locks serialize capacity decisions."],
  ["Ghost stock", "Transfers resolve the item by SKU and lock the source inventory row."],
  ["Low stock", "Report items include low_stock when a warehouse quantity is below 10."],
  ["Soft deletes", "Warehouse deletion checks that occupancy is zero before marking deleted_at."],
  ["Errors", "Failures return consistent { error, message, code } JSON objects."]
];

export function OpsPage() {
  return (
    <div className="mt-6 flex flex-col gap-5">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck />
              </div>
              <div>
                <CardTitle>Ops</CardTitle>
                <CardDescription>Data model requirements and reliability guardrails in one operational view.</CardDescription>
              </div>
            </div>
            <Button asChild variant="outline">
              <a href="/openapi.json">
                OpenAPI JSON
                <ExternalLink data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {requirementCards.map(([title, copy]) => (
          <Card key={title}>
            <CardHeader>
              <Badge variant="secondary">Requirement</Badge>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{copy}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reliabilityCards.map(([title, copy]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {title === "Errors" ? <FileText /> : title === "Concurrency" ? <LockKeyhole /> : <Route />}
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{copy}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
