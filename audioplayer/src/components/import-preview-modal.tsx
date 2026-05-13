"use client";

import { useEffect, useState } from 'react';

type PreviewRow = { name: string; sku?: string; quantity?: number; unit?: string; categoryId?: string | null; errors?: string[] };

interface Props {
  isOpen: boolean;
  items: PreviewRow[];
  categories?: { id: string; name: string }[];
  units?: { id?: string; name: string }[];
  onClose: () => void;
  onCommit: (items: PreviewRow[]) => Promise<void>;
}

export default function ImportPreviewModal({ isOpen, items = [], categories = [], units = [], onClose, onCommit }: Props) {
  const [localItems, setLocalItems] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalItems(items.map(i => ({ ...i, quantity: typeof i.quantity === 'number' ? i.quantity : Number(i.quantity || 0), errors: i.errors || [] })));
  }, [items]);

  const updateRow = (idx: number, key: keyof PreviewRow, value: any) => {
    setLocalItems(prev => {
      const copy = [...prev];
      (copy[idx] as any)[key] = value;
      // Recompute simple validations
      const errs: string[] = [];
      if (!copy[idx].name) errs.push('Missing name');
      if (typeof copy[idx].quantity !== 'number' || Number.isNaN(copy[idx].quantity)) errs.push('Invalid quantity');
      if (copy[idx].unit && !units.find(u => u.name === copy[idx].unit)) errs.push('Unknown unit');
      if (copy[idx].categoryId && !categories.find(c => c.id === copy[idx].categoryId)) errs.push('Unknown category');
      copy[idx].errors = errs;
      return copy;
    });
  };

  const removeRow = (idx: number) => setLocalItems(prev => prev.filter((_, i) => i !== idx));

  const handleCommit = async () => {
    setLoading(true);
    try {
      await onCommit(localItems);
      onClose();
    } catch (err) {
      console.error('Commit failed', err);
      alert('Failed to commit import');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl rounded-[28px] bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] border border-white/10 p-6 shadow-2xl text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Import Preview</h2>
          <div className="text-sm text-white/60">Rows: {localItems.length} · Errors: {localItems.filter(r => r.errors && r.errors.length > 0).length}</div>
        </div>

        <div className="mt-4 max-h-[60vh] overflow-auto">
          <table className="w-full table-auto text-left text-sm">
            <thead>
              <tr className="text-white/60">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2">Qty</th>
                <th className="px-2 py-2">Unit</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Errors</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {localItems.map((r, idx) => (
                <tr key={idx} className="border-t border-white/5">
                  <td className="px-2 py-2 align-top">{idx + 1}</td>
                  <td className="px-2 py-2 align-top"><input value={r.name} onChange={e => updateRow(idx, 'name', e.target.value)} className="bg-white/5 px-2 py-1 rounded w-full" /></td>
                  <td className="px-2 py-2 align-top"><input value={r.sku || ''} onChange={e => updateRow(idx, 'sku', e.target.value)} className="bg-white/5 px-2 py-1 rounded w-full" /></td>
                  <td className="px-2 py-2 align-top"><input value={r.quantity ?? 0} type="number" onChange={e => updateRow(idx, 'quantity', e.target.value === '' ? 0 : Number(e.target.value))} className="bg-white/5 px-2 py-1 rounded w-full" /></td>
                  <td className="px-2 py-2 align-top">
                    <input value={r.unit || ''} onChange={e => updateRow(idx, 'unit', e.target.value)} className="bg-white/5 px-2 py-1 rounded w-full" list="units-list" />
                    <datalist id="units-list">
                      {units.map((u) => (<option key={u.id || u.name} value={u.name} />))}
                    </datalist>
                  </td>
                  <td className="px-2 py-2 align-top">
                    <select value={r.categoryId || ''} onChange={e => updateRow(idx, 'categoryId', e.target.value || null)} className="bg-white/5 px-2 py-1 rounded w-full">
                      <option value="">--</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2 align-top">
                    {r.errors && r.errors.length > 0 ? (
                      <ul className="text-xs text-red-300 space-y-1">
                        {r.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    ) : <span className="text-xs text-white/60">—</span>}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => removeRow(idx)} className="px-2 py-1 bg-red-700 rounded">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex gap-3 justify-end">
          <button className="px-4 py-2 bg-white/10 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-gradient-to-r from-[#ff9b2a] to-[#ff6816] rounded text-white" onClick={handleCommit} disabled={loading}>Commit Import</button>
        </div>
      </div>
    </div>
  );
}
