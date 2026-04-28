import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { ReactNode } from "react";
import type { Item, Warehouse } from "../../types/logistics";

type TextFieldProps = {
  label: string;
  name: string;
  type?: string;
  min?: string;
  placeholder?: string;
  defaultValue?: string | number;
  error?: string;
};

export function FormStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

export function TextField({ label, name, type = "text", min, placeholder, defaultValue, error }: TextFieldProps) {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        min={min}
        placeholder={placeholder}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        required
      />
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
  value,
  onValueChange,
  error
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
}) {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} defaultValue={defaultValue} value={value} onValueChange={onValueChange} required>
        <SelectTrigger id={name} className="w-full" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

export function WarehouseSelect({ warehouses, name, label, error }: { warehouses: Warehouse[]; name: string; label: string; error?: string }) {
  const errorId = `${name}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} required>
        <SelectTrigger id={name} className="w-full" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}>
          <SelectValue placeholder="Select warehouse" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id ?? ""}>
                {warehouse.name} - {warehouse.type}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-xs font-normal leading-5 text-destructive">
      {children}
    </p>
  );
}

export function ItemSelect({ items, name, label }: { items: Item[]; name: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Select name={name} required>
        <SelectTrigger id={name} className="w-full">
          <SelectValue placeholder="Select item" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id ?? ""}>
                {item.sku} - {item.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function SkuField({ items, error }: { items: Item[]; error?: string }) {
  const errorId = "sku-error";

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="sku">SKU</Label>
      <Input id="sku" name="sku" list="sku-options" placeholder="ICE-12345-C" aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} required />
      <datalist id="sku-options">
        {items.map((item) => (
          <option key={item.sku} value={item.sku}>{item.name}</option>
        ))}
      </datalist>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}
