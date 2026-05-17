import type { User as FirebaseUser } from 'firebase/auth';

// --- Types & Interfaces ---

export type Business = {
  id: string;
  name: string;
  description?: string | null;
  ownerUid: string;
  createdAt: string;
  type: string;
  approved?: boolean;
  status?: string;
  financialSummary?: {
    grossRevenue: number;
    netRevenue: number;
    cashBalance: number;
    pendingPayments: number;
    apDue: number;
  };
};

export type Staff = {
  id: string;
  staffId: string;
  name: string;
  role?: string;
  status?: 'active' | 'inactive';
  salary?: number;
};

export type Table = {
  id: string;
  tableNo: string;
  capacity?: number;
  status: 'Available' | 'Occupied' | 'Reserved';
  assignedStaff?: string;
};

export type Invoice = {
  id?: string;
  businessId: string;
  staffId: string;
  tableId: string;
  orderItems: {
    itemId: string;
    name: string;
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  paymentMethod: string;
  status: string;
  timestamp: string;
};

export type InventoryItem = {
  id?: string;
  name: string;
  sku?: string;
  quantity?: number;
  unit?: string;
  categoryId?: string | null;
  reorderLevel?: number | null;
  unitPrice?: number | null;
  enabled?: boolean;
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
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
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

export type Unit = { id?: string; name: string; symbol?: string; description?: string; createdAt?: string; updatedAt?: string };

// --- Helper Functions ---

export function isBusinessActive(b?: Business | null | undefined) {
  if (!b) return false;
  const status = (b.status || '').toLowerCase();
  return b.approved === true || status === 'active' || status === 'approved';
}

// --- Business Management (Restored Original Logic) ---

export async function listBusinesses(user: FirebaseUser | null): Promise<Business[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch('/api/businesses', {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
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
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `Failed to create business: ${res.status}`;
    const code = body?.code || 'server_error';
    const err = new Error(msg);
    // @ts-ignore
    err.code = code;
    throw err;
  }
  return body.business;
}

export async function getBusinessData(user: FirebaseUser | null, businessId: string): Promise<Business | null> {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.business;
}

// --- Restaurant POS & HR Logic ---

export async function listBusinessStaff(user: FirebaseUser | null, businessId: string): Promise<Staff[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/staff`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch staff');
  const json = await res.json();
  return json.staff || [];
}

export async function listBusinessTables(user: FirebaseUser | null, businessId: string): Promise<Table[]> {
  if (!user) return [];
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/tables`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch tables');
  const json = await res.json();
  return json.tables || [];
}

export async function saveInvoice(user: FirebaseUser | null, businessId: string, invoiceData: any) {
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(`/api/businesses/${businessId}/billing/invoices`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || 'Failed to save invoice');
  return body.invoice;
}

// --- Inventory Management (Restored Original Logic) ---

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

// --- Categories, Suppliers, Units & Movements (Restored Original Logic) ---

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

// --- Purchase Orders & GRN (Restored Original Logic) ---

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

// --- Reports & Exports ---

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

// Use individual named exports to prevent Build Errors in components like AccountDrawer
// This is critical for Next.js 15 Turbopack
export default { 
  listBusinesses, 
  createBusiness, 
  getBusinessData, 
  listBusinessStaff, 
  listBusinessTables, 
  saveInvoice,
  listInventory
};