import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionModal } from "../../components/dashboard/ActionModal";
import { FormStack, SelectField, TextField } from "../../components/dashboard/FormControls";
import { WarehouseTable } from "../../components/dashboard/WarehouseTable";
import { createWarehouse, deleteWarehouse, updateWarehouse } from "../../lib/api";
import type { Warehouse } from "../../types/logistics";

type WarehousesPageProps = {
  token: string | null;
  warehouses: Warehouse[];
  onRunAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean>;
};

export function WarehousesPage({ token, warehouses, onRunAction }: WarehousesPageProps) {
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <div>
          <h3 className="text-lg font-semibold">Warehouse records</h3>
          <p className="text-sm text-muted-foreground">Create, update, and soft-delete empty warehouses.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionModal
            title="Create warehouse"
            description="Create Standard or Cold Storage facilities with a positive unit capacity."
            trigger={<Button><Plus data-icon="inline-start" />Create</Button>}
            open={creatingWarehouse}
            onOpenChange={setCreatingWarehouse}
          >
            <WarehouseForm
              submitLabel="Create warehouse"
              onSubmit={async (form) => {
                const success = await onRunAction(
                  () =>
                    createWarehouse(token!, {
                      name: String(form.get("name") ?? ""),
                      location: String(form.get("location") ?? ""),
                      maxCapacity: Number(form.get("maxCapacity")),
                      type: form.get("type") as "STANDARD" | "COLD"
                    }),
                  "Warehouse created."
                );
                if (success) {
                  setCreatingWarehouse(false);
                }
                return success;
              }}
            />
          </ActionModal>
        </div>
      </section>

      <WarehouseTable
        warehouses={warehouses}
        onEdit={setEditingWarehouse}
        onDelete={(warehouseId) => void onRunAction(() => deleteWarehouse(token!, warehouseId), "Warehouse deleted.")}
      />
      <ActionModal
        title="Update warehouse"
        description="Replace warehouse details while preserving the row identity."
        open={Boolean(editingWarehouse)}
        onOpenChange={(open) => !open && setEditingWarehouse(null)}
      >
        <WarehouseForm
          warehouse={editingWarehouse ?? undefined}
          submitLabel="Update warehouse"
          onSubmit={async (form) => {
            const success = await onRunAction(
              () =>
                updateWarehouse(token!, editingWarehouse?.id ?? "", {
                  name: String(form.get("name") ?? ""),
                  location: String(form.get("location") ?? ""),
                  maxCapacity: Number(form.get("maxCapacity")),
                  type: form.get("type") as "STANDARD" | "COLD"
                }),
              "Warehouse updated."
            );
            if (success) {
              setEditingWarehouse(null);
            }
            return success;
          }}
        />
      </ActionModal>
    </div>
  );
}

function WarehouseForm({
  warehouse,
  submitLabel,
  onSubmit
}: {
  warehouse?: Warehouse;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<boolean>;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        void onSubmit(new FormData(formElement)).then((success) => {
          if (success) {
            formElement.reset();
          }
        });
      }}
    >
      <FormStack>
        <TextField name="name" label="Name" placeholder="North Distribution" defaultValue={warehouse?.name} />
        <TextField name="location" label="Location" placeholder="Manila" defaultValue={warehouse?.location} />
        <TextField name="maxCapacity" label="Max capacity" type="number" min="1" placeholder="1000" defaultValue={warehouse?.maxCapacity ?? warehouse?.max_capacity} />
        <SelectField name="type" label="Type" options={["STANDARD", "COLD"]} defaultValue={warehouse?.type ?? warehouse?.storageType ?? "STANDARD"} />
        <Button type="submit">{submitLabel}</Button>
      </FormStack>
    </form>
  );
}
