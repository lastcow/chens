"use client";
import { useEffect, useState, useCallback } from "react";
import { Warehouse, Plus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, Edit2, Trash2 } from "lucide-react";
import WarehouseForm from "@/components/msbiz/WarehouseForm";

interface Warehouse {
  id: string; name: string; address_id: string; address?: { full_address: string; city: string; state: string; };
  capacity_units: number | null; inventory_count: number; created_at: string;
}

export default function WarehousePage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const limit = 12;

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) p.set("search", search);
    const res = await fetch(`/api/msbiz/warehouses?${p}`);
    const d = await res.json();
    setWarehouses(d.warehouses ?? []);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);
  useEffect(() => { setPage(1); }, [search]);

  const doDelete = async (id: string) => {
    await fetch(`/api/msbiz/warehouses/${id}`, { method: "DELETE" });
    fetchWarehouses();
    setDeletingId("");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Warehouses</h2>
        <button onClick={() => { setEditId(""); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/90 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Warehouse
        </button>
      </div>

      <div className="sticky top-[100px] z-10 bg-gray-950/95 backdrop-blur-md py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search warehouse name…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="text-center py-10 text-gray-600">No warehouses found. Create your first warehouse!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <div key={w.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Warehouse className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{w.name}</h3>
                    <p className="text-[10px] text-gray-500">{w.address?.city}, {w.address?.state}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditId(w.id); setShowForm(true); }}
                    className="w-7 h-7 rounded-md hover:bg-gray-800 text-gray-500 hover:text-gray-300 flex items-center justify-center">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingId(w.id)}
                    className="w-7 h-7 rounded-md hover:bg-red-900/20 text-gray-500 hover:text-red-400 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4 line-clamp-2">{w.address?.full_address}</div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="text-xs text-gray-600 mb-0.5">Inventory</div>
                  <div className="font-mono text-sm font-bold text-blue-400">{w.inventory_count} SKUs</div>
                </div>
                {w.capacity_units && (
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 mb-0.5">Capacity</div>
                    <div className="font-mono text-sm font-bold text-amber-400">{w.capacity_units} units</div>
                  </div>
                )}
              </div>

              <a href={`/msbiz/warehouse/${w.id}`} className="mt-3 block text-xs text-purple-400 hover:text-purple-300 transition-colors">
                View details →
              </a>
            </div>
          ))}
        </div>
      )}

      {showForm && <WarehouseForm warehouseId={editId} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchWarehouses(); }} />}

      {deletingId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm">
            <h3 className="font-bold text-white mb-3">Delete Warehouse?</h3>
            <p className="text-sm text-gray-400 mb-6">This action cannot be undone. Make sure inventory is empty or reallocated.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId("")} className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm">Cancel</button>
              <button onClick={() => doDelete(deletingId)} className="flex-1 px-4 py-2 rounded-lg bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
