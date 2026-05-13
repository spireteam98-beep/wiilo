import type { User as FirebaseUser } from 'firebase/auth';

export type Business = {
  id: string;
  name: string;
  description?: string | null;
  ownerUid: string;
  createdAt: string;
  type: string;
  approved?: boolean;
  status?: string;
};

export function isBusinessActive(b?: Business | null | undefined) {
  if (!b) return false;
  const status = (b.status || '').toLowerCase();
  return b.approved === true || status === 'active' || status === 'approved';
}

export type InventoryItem = {
  id?: string;
  name: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  categoryId?: string | null;
  reorderLevel?: number | null;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type InventoryCategory = {
  id?: string;
  name: string;
  parentId?: string | null;
  description?: string;
  defaultUnit?: string;
  storageType?: 'dry' | 'chilled' | 'frozen' | string;
  defaultSupplierId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Supplier = {
  id?: string;
  name: string;
  contact?: string;
  address?: string;
  priceList?: Record<string, number> | null;
  status?: 'active' | 'inactive' | string;
  createdAt?: string;
  updatedAt?: string;
};

export type StockMovement = {
  id?: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';
  itemId: string;
  quantity: number;
  unit?: string;
  supplierId?: string;
  costPerUnit?: number;
  batchNo?: string;
  expiryDate?: string | null;
  reason?: string;
  createdBy?: string;
  unitPrice?: number | null;
  enabled?: boolean;
  createdAt?: string;
};

export type PurchaseOrder = {
  id?: string;
  supplierId?: string | null;
  items: { itemId: string; quantity: number; unitPrice?: number | null; requested?: boolean }[];
  expectedDeliveryDate?: string | null;
  status?: string;
  note?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
};

export type Grn = {
  id?: string;
  poId: string;
  items: { itemId: string; quantity: number; unitPrice?: number; batchNo?: string; expiryDate?: string }[];
  createdAt?: string;
  createdBy?: string;
};

export async function listBusinesses(user: FirebaseUser | null): Promise<Business[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch('/api/businesses', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body && body.error) || `Failed to fetch businesses: ${res.status}`);
  }
  const json = await res.json();
  return json.businesses || [];
}

export async function createBusiness(user: FirebaseUser | null, input: { name: string; description?: string; type: string; }) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch('/api/businesses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `Failed to create business: ${res.status}`;
    const code = body?.code || 'server_error';
    const err = new Error(msg);
    // @ts-ignore add code prop for convenience
    err.code = code;
    throw err;
  }
  return body.business;
}

export async function listInventory(user: FirebaseUser | null, businessId: string): Promise<InventoryItem[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error((body && body.error) || `Failed to list inventory: ${res.status}`);
  }
  const json = await res.json();
  return json.items || [];
}

export async function listCategories(user: FirebaseUser | null, businessId: string): Promise<InventoryCategory[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/categories`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to list categories');
  const json = await res.json();
  return json.categories || [];
}

export async function createCategory(user: FirebaseUser | null, businessId: string, input: InventoryCategory) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/categories`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to create category: ${res.status}`);
  return body.category;
}

export async function updateCategory(user: FirebaseUser | null, businessId: string, input: InventoryCategory & { id: string }) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/categories`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to update category: ${res.status}`);
  return body.category;
}

export async function deleteCategory(user: FirebaseUser | null, businessId: string, id: string) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/categories`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && (body.message || body.error)) || `Failed to delete category: ${res.status}`);
  return true;
}

export async function listSuppliers(user: FirebaseUser | null, businessId: string): Promise<Supplier[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/suppliers`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to list suppliers');
  const json = await res.json();
  return json.suppliers || [];
}

export async function createSupplier(user: FirebaseUser | null, businessId: string, input: Supplier) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/suppliers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to create supplier: ${res.status}`);
  return body.supplier;
}

export async function updateSupplier(user: FirebaseUser | null, businessId: string, input: Supplier & { id: string }) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/suppliers`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to update supplier: ${res.status}`);
  return body.supplier;
}

export async function deleteSupplier(user: FirebaseUser | null, businessId: string, id: string) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/suppliers`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && (body.message || body.error)) || `Failed to delete supplier: ${res.status}`);
  return true;
}

export async function createStockMovement(user: FirebaseUser | null, businessId: string, input: StockMovement) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/stock-movements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to create stock movement: ${res.status}`);
  return body.movement;
}

// Purchase orders
export async function listPurchaseOrders(user: FirebaseUser | null, businessId: string): Promise<PurchaseOrder[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/purchase-orders`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to list purchase orders');
  const json = await res.json();
  return json.orders || [];
}

export async function createPurchaseOrder(user: FirebaseUser | null, businessId: string, input: PurchaseOrder) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/purchase-orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to create purchase order: ${res.status}`);
  return body.order;
}

export async function updatePurchaseOrder(user: FirebaseUser | null, businessId: string, input: PurchaseOrder & { id: string }) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/purchase-orders`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to update purchase order: ${res.status}`);
  return body.order;
}

// GRN receive
export async function receiveGrn(user: FirebaseUser | null, businessId: string, input: Grn) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/grn`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to receive GRN: ${res.status}`);
  return body;
}

// Transfer helper - wrapper over createStockMovement with type TRANSFER and transferTo
export async function createTransfer(user: FirebaseUser | null, businessId: string, itemId: string, quantity: number, transferTo: string, opts?: { unit?: string; reason?: string }) {
  const idToken = await user?.getIdToken();
  if (!user || !idToken) throw new Error('Not authenticated');
  const res = await fetch(`/api/businesses/${businessId}/inventory/stock-movements`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'TRANSFER', itemId, quantity, unit: opts?.unit, transferTo, reason: opts?.reason }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to create transfer: ${res.status}`);
  return body.movement;
}

export async function listStockMovements(user: FirebaseUser | null, businessId: string): Promise<StockMovement[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/stock-movements`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to list stock movements');
  const json = await res.json();
  return json.movements || [];
}

// Units
export type Unit = { id?: string; name: string; symbol?: string; description?: string; createdAt?: string; updatedAt?: string };

export async function listUnits(user: FirebaseUser | null, businessId: string): Promise<Unit[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/units`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to list units');
  const json = await res.json();
  return json.units || [];
}

export async function createUnit(user: FirebaseUser | null, businessId: string, input: Unit) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/units`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to create unit: ${res.status}`);
  return body.unit;
}

export async function updateUnit(user: FirebaseUser | null, businessId: string, input: Unit & { id: string }) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/units`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to update unit: ${res.status}`);
  return true;
}

export async function deleteUnit(user: FirebaseUser | null, businessId: string, id: string) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/units`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && (body.message || body.error)) || `Failed to delete unit: ${res.status}`);
  return true;
}

// Inventory item management: edit and delete
export async function updateInventoryItem(user: FirebaseUser | null, businessId: string, input: InventoryItem & { id: string }) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to update inventory item: ${res.status}`);
  return body.item;
}

export async function deleteInventoryItem(user: FirebaseUser | null, businessId: string, id: string) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && (body.message || body.error)) || `Failed to delete inventory item: ${res.status}`);
  return true;
}

export async function getInventoryReport(user: FirebaseUser | null, businessId: string, type: string = 'stock', opts?: { categoryId?: string; unit?: string; group?: string }) {
  if (!user) return { ok: false };
  const idToken = await user.getIdToken();
  const url = new URL(`/api/businesses/${businessId}/inventory/reports`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  url.searchParams.set('type', type);
  if (opts?.categoryId) url.searchParams.set('categoryId', opts.categoryId);
  if (opts?.unit) url.searchParams.set('unit', opts.unit);
  if (opts?.group) url.searchParams.set('group', opts.group);
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.json();
}

export async function listReorderSuggestions(user: FirebaseUser | null, businessId: string) {
  if (!user) return { suggestions: [] };
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/reorder-suggestions`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to get reorder suggestions');
  return res.json();
}

export async function listInventoryAlerts(user: FirebaseUser | null, businessId: string) {
  if (!user) return { lowStock: [], expirySoon: [], counts: {} };
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/alerts`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function createInventoryItem(user: FirebaseUser | null, businessId: string, input: InventoryItem) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to create inventory: ${res.status}`);
  return body.item;
}

// Export items as CSV - returns Response (caller can call .blob())
export async function exportInventoryItemsCsv(user: FirebaseUser | null, businessId: string) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/inventory/export/items`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error('Failed to export items');
  return res;
}

export async function exportReportCsv(user: FirebaseUser | null, businessId: string, type: string = 'stock') {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const url = new URL(`/api/businesses/${businessId}/inventory/export/reports`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  url.searchParams.set('type', type);
  const res = await fetch(url.toString(), { method: 'GET', headers: { Authorization: `Bearer ${idToken}` } });
  if (!res.ok) throw new Error('Failed to export report');
  return res;
}

// Import CSV text or JSON items array
export async function importInventoryItemsCsv(user: FirebaseUser | null, businessId: string, csvText: string, dryRun: boolean = false) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const url = new URL(`/api/businesses/${businessId}/inventory/bulk`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  if (dryRun) url.searchParams.set('dryRun', 'true');
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'text/csv' },
    body: csvText,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to import items: ${res.status}`);
  return body;
}

// Import items via JSON array (used by the import preview commit)
export async function importInventoryItemsJson(user: FirebaseUser | null, businessId: string, items: any[], dryRun: boolean = false) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const url = new URL(`/api/businesses/${businessId}/inventory/bulk`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  if (dryRun) url.searchParams.set('dryRun', 'true');
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Failed to import items: ${res.status}`);
  return body;
}

export default { listBusinesses, createBusiness };
