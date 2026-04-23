import { createItemRecord, listActiveItemRecords } from "../repositories/itemRepository.js";

export type CreateItemInput = {
  name: string;
  sku: string;
  storageRequirement: "STANDARD" | "COLD";
};

export async function createItem(input: CreateItemInput) {
  return createItemRecord(input);
}

export async function listItems() {
  return listActiveItemRecords();
}
