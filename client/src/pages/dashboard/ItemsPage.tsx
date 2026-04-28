import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionModal } from "../../components/dashboard/ActionModal";
import { FormStack, SelectField, TextField, WarehouseSelect } from "../../components/dashboard/FormControls";
import { ItemTable } from "../../components/dashboard/ItemTable";
import { createItem, deleteItem, updateItem } from "../../lib/api";
import type { Item, Warehouse } from "../../types/logistics";

type ItemsPageProps = {
  token: string | null;
  warehouses: Warehouse[];
  items: Item[];
  onRunAction: (action: () => Promise<unknown>, successMessage: string) => Promise<boolean>;
};

type ItemFormErrors = Partial<Record<"name" | "sku" | "storageRequirement" | "warehouseId" | "quantity", string>>;

export function ItemsPage({ token, warehouses, items, onRunAction }: ItemsPageProps) {
  const [creatingItem, setCreatingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.id);

  return (
    <div className="mt-6 flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <div>
          <h3 className="text-lg font-semibold">Item catalog</h3>
          <p className="text-sm text-muted-foreground">Create, update, and soft-delete SKUs with no stock rows.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionModal
            title="Create item"
            description="SKUs are strictly validated with the ABC-12345-X format."
            trigger={<Button><Plus data-icon="inline-start" />Create</Button>}
            open={creatingItem}
            onOpenChange={setCreatingItem}
          >
            <ItemForm
              submitLabel="Create item"
              warehouses={activeWarehouses}
              includeWarehouse
              onSubmit={async (form) => {
                const success = await onRunAction(
                  () =>
                    createItem(token!, {
                      name: String(form.get("name") ?? ""),
                      sku: String(form.get("sku") ?? "").toUpperCase(),
                      storageRequirement: form.get("storageRequirement") as "STANDARD" | "COLD",
                      warehouseId: String(form.get("warehouseId") ?? ""),
                      quantity: Number(form.get("quantity") ?? 1)
                    }),
                  "Item created."
                );
                if (success) {
                  setCreatingItem(false);
                }
                return success;
              }}
            />
          </ActionModal>
        </div>
      </section>

      <ItemTable
        items={items}
        onEdit={setEditingItem}
        onDelete={(itemId) => void onRunAction(() => deleteItem(token!, itemId), "Item deleted.")}
      />
      <ActionModal
        title="Update item"
        description="Replace item name, SKU, and storage requirement."
        open={Boolean(editingItem)}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <ItemForm
          item={editingItem ?? undefined}
          submitLabel="Update item"
          onSubmit={async (form) => {
            const success = await onRunAction(
              () =>
                updateItem(token!, editingItem?.id ?? "", {
                  name: String(form.get("name") ?? ""),
                  sku: String(form.get("sku") ?? "").toUpperCase(),
                  storageRequirement: form.get("storageRequirement") as "STANDARD" | "COLD"
                }),
              "Item updated."
            );
            if (success) {
              setEditingItem(null);
            }
            return success;
          }}
        />
      </ActionModal>
    </div>
  );
}

function ItemForm({
  item,
  warehouses = [],
  includeWarehouse = false,
  submitLabel,
  onSubmit
}: {
  item?: Item;
  warehouses?: Warehouse[];
  includeWarehouse?: boolean;
  submitLabel: string;
  onSubmit: (form: FormData) => Promise<boolean>;
}) {
  const [storageRequirement, setStorageRequirement] = useState(String(item?.storageRequirement ?? item?.storage_requirement ?? "STANDARD"));
  const [errors, setErrors] = useState<ItemFormErrors>({});
  const preferredWarehouseType = storageRequirement === "COLD" ? "COLD" : "STANDARD";
  const compatibleWarehouses = warehouses.filter((warehouse) => (warehouse.type ?? warehouse.storageType) === preferredWarehouseType);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        const nextErrors = validateItemForm(form, { includeWarehouse, hasWarehouses: compatibleWarehouses.length > 0 });

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
          return;
        }

        void onSubmit(form).then((success) => {
          if (success) {
            setErrors({});
            formElement.reset();
          }
        });
      }}
    >
      <FormStack>
        <TextField name="name" label="Name" placeholder="Ice Cream" defaultValue={item?.name} error={errors.name} />
        <TextField name="sku" label="SKU" placeholder="ICE-12345-C" defaultValue={item?.sku} error={errors.sku} />
        <SelectField
          name="storageRequirement"
          label="Storage requirement"
          options={["STANDARD", "COLD"]}
          value={storageRequirement}
          onValueChange={(value) => {
            setStorageRequirement(value);
            setErrors((current) => ({ ...current, storageRequirement: undefined, warehouseId: undefined }));
          }}
          error={errors.storageRequirement}
        />
        {includeWarehouse ? (
          <>
            <WarehouseSelect key={storageRequirement} warehouses={compatibleWarehouses} name="warehouseId" label="Warehouse" error={errors.warehouseId} />
            <TextField name="quantity" label="Initial quantity" type="number" min="1" placeholder="1" defaultValue={1} error={errors.quantity} />
          </>
        ) : null}
        <Button type="submit">{submitLabel}</Button>
      </FormStack>
    </form>
  );
}

function validateItemForm(form: FormData, options: { includeWarehouse: boolean; hasWarehouses: boolean }) {
  const errors: ItemFormErrors = {};
  const name = String(form.get("name") ?? "").trim();
  const sku = String(form.get("sku") ?? "").trim().toUpperCase();
  const storageRequirement = String(form.get("storageRequirement") ?? "");
  const warehouseId = String(form.get("warehouseId") ?? "");
  const quantity = Number(form.get("quantity") ?? 0);

  if (!name) {
    errors.name = "Name is required.";
  } else if (name.length > 120) {
    errors.name = "Name must be 120 characters or fewer.";
  }

  if (!sku) {
    errors.sku = "SKU is required.";
  } else if (!/^[A-Z]{3}-\d{5}-[A-Z]$/.test(sku)) {
    errors.sku = "Use the ABC-12345-X format.";
  }

  if (storageRequirement !== "STANDARD" && storageRequirement !== "COLD") {
    errors.storageRequirement = "Select a storage requirement.";
  }

  if (options.includeWarehouse) {
    if (!options.hasWarehouses) {
      errors.warehouseId = "No matching warehouse is available.";
    } else if (!warehouseId) {
      errors.warehouseId = "Select a warehouse.";
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      errors.quantity = "Quantity must be a whole number greater than 0.";
    }
  }

  return errors;
}
