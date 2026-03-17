"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Tag, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2
} from "lucide-react";

interface Merch {
  id: string; name: string; upc: string | null; model: string | null;
  image_url: string | null; price: number;
}
interface User { id: string; name: string | null; email: string; }
interface CPRecord { id: string; user_id: string; merchandise_id: string; custom_price: number; }

const LIMIT = 20;

export default function AdminCustomerPricing() {
  const [merch, setMerch]         = useState<Merch[]>([]);
  const [users, setUsers]         = useState<User[]>([]);
  const [prices, setPrices]       = useState<Map<string, CPRecord>>(new Map());
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);

  // Inline edit state
  const [editingKey, setEditingKey] = useState<string | null>(null); // `${merchandiseId}::${userId}`
  const [editValue, setEditValue]   = useState("");
  const [savingKey, setSavingKey]   = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.length >= 2) p.set("search", search);

    const [mRes, uRes, cpRes] = await Promise.all([
      fetch(`/api/admin/merchandise?${p}`),
      fetch("/api/admin/msbiz-users"),
      fetch(`/api/admin/customer-merchandise?limit=9999`),
    ]);
    const [mData, uData, cpData] = await Promise.all([mRes.json(), uRes.json(), cpRes.json()]);

    setMerch(mData.items ?? []);
    setTotal(mData.total ?? 0);
    setUsers(uData.users ?? []);

    const map = new Map<string, CPRecord>();
    for (const r of (cpData.items ?? [])) {
      map.set(`${r.merchandise_id}::${r.user_id}`, r);
    }
    setPrices(map);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setPage(1); }, [search]);

  useEffect(() => {
    if (editingKey && inputRef.current) inputRef.current.focus();
  }, [editingKey]);

  const startEdit = (merchandiseId: string, userId: string, listPrice: number) => {
    const key = `${merchandiseId}::${userId}`;
    const existing = prices.get(key);
    setEditingKey(key);
    setEditValue(existing ? String(existing.custom_price) : String(Number(listPrice).toFixed(2)));
  };

  const cancelEdit = () => { setEditingKey(null); setEditValue(""); };

  const saveEdit = async (merchandiseId: string, userId: string) => {
    const key = `${merchandiseId}::${userId}`;
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { cancelEdit(); return; }

    setSavingKey(key);
    const existing = prices.get(key);

    const res = await fetch(
      existing ? `/api/admin/customer-merchandise/${existing.id}` : "/api/admin/customer-merchandise",
      {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, merchandise_id: merchandiseId, custom_price: val }),
      }
    );

    if (res.ok) {
      const d = await res.json();
      const record: CPRecord = existing
        ? { ...existing, custom_price: val }
        : { id: d.item?.id ?? key, user_id: userId, merchandise_id: merchandiseId, custom_price: val };
      setPrices(prev => new Map(prev).set(key, record));
    }
    setSavingKey(null);
    setEditingKey(null);
    setEditValue("");
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-400" /> Customer Pricing
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Double-click any cell to set a custom price</p>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-[100px] z-10 bg-gray-950/80 backdrop-blur-md py-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter items… (2+ chars)"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
        </div>
      </div>

      {/* Pivot table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-800">
                {/* Item header */}
                <th className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider bg-gray-900 sticky left-0 z-10 min-w-[220px] border-r border-gray-800">
                  Item
                </th>
                <th className="text-right px-3 py-3 text-xs text-gray-500 uppercase tracking-wider bg-gray-900 w-24 shrink-0 border-r border-gray-800/50">
                  List
                </th>
                {/* One column per customer */}
                {users.map(u => (
                  <th key={u.id} className="px-3 py-3 text-center min-w-[110px] border-r border-gray-800/30">
                    <div className="text-[11px] font-medium text-white truncate max-w-[100px] mx-auto" title={u.name ?? u.email}>
                      {u.name || u.email.split("@")[0]}
                    </div>
                    <div className="text-[9px] text-gray-600 truncate max-w-[100px] mx-auto font-mono" title={u.email}>
                      {u.email}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={users.length + 2} className="px-4 py-3">
                      <div className="h-5 bg-gray-800 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : merch.length === 0 ? (
                <tr>
                  <td colSpan={users.length + 2} className="text-center py-16 text-gray-500 text-sm">
                    No merchandise found.
                  </td>
                </tr>
              ) : merch.map(m => (
                <tr key={m.id} className="hover:bg-gray-800/20 transition-colors">
                  {/* Item cell — sticky */}
                  <td className="px-4 py-2.5 sticky left-0 bg-gray-900 border-r border-gray-800 z-[2]">
                    <div className="flex items-center gap-2 min-w-0">
                      {m.image_url
                        ? <img src={m.image_url} alt="" className="w-7 h-7 object-contain rounded border border-gray-700 shrink-0"
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <div className="w-7 h-7 rounded bg-gray-800 border border-gray-700 shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate max-w-[160px]" title={m.name}>{m.name}</div>
                        {(m.upc || m.model) && (
                          <div className="text-[9px] text-gray-600 font-mono">{m.upc || m.model}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* List price */}
                  <td className="px-3 py-2.5 text-right border-r border-gray-800/50 w-24">
                    <span className="text-xs font-mono text-gray-500">${Number(m.price).toFixed(2)}</span>
                  </td>
                  {/* Price cells per customer */}
                  {users.map(u => {
                    const key = `${m.id}::${u.id}`;
                    const record = prices.get(key);
                    const isEditing = editingKey === key;
                    const isSaving  = savingKey === key;
                    const custom = record?.custom_price;
                    const diff = custom != null ? custom - m.price : null;
                    const cellColor = custom == null
                      ? "text-gray-700"
                      : diff! < 0 ? "text-green-400" : diff! > 0 ? "text-red-400" : "text-gray-400";

                    return (
                      <td key={u.id}
                        className="px-1 py-1 text-center border-r border-gray-800/20 min-w-[110px]"
                        onDoubleClick={() => !isEditing && startEdit(m.id, u.id, m.price)}>
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value.replace(/[^0-9.]/g, ""))}
                            onBlur={() => saveEdit(m.id, u.id)}
                            onKeyDown={e => {
                              if (e.key === "Enter") saveEdit(m.id, u.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="w-20 bg-gray-800 border border-amber-500/70 rounded px-2 py-1 text-xs text-white font-mono text-center focus:outline-none"
                          />
                        ) : isSaving ? (
                          <Loader2 className="w-3 h-3 text-amber-400 animate-spin mx-auto" />
                        ) : (
                          <div className={`text-xs font-mono cursor-pointer select-none px-2 py-1.5 rounded hover:bg-gray-700/40 transition-colors ${cellColor}`}
                            title={custom != null ? `Double-click to edit · List: $${Number(m.price).toFixed(2)}` : "Double-click to set custom price"}>
                            {custom != null ? `$${Number(custom).toFixed(2)}` : <span className="text-gray-700 text-[10px]">—</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="border-t border-gray-800 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-600">{(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total} items</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page===1} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronsLeft className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="px-2 text-xs text-gray-400">{page} / {pages || 1}</span>
              <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page>=pages} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPage(pages)} disabled={page>=pages} className="w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors"><ChevronsRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
