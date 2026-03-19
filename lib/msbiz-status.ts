/**
 * msbiz-status.ts
 *
 * Centralized status color maps for all MS Business status types.
 * These static maps are the fallback for SSR/build time.
 * The authoritative source is the msbiz_statuses DB table (via GET /api/msbiz/statuses).
 *
 * Usage:
 *   import { ORDER_STATUS_COLORS, PM_STATUS_COLORS } from "@/lib/msbiz-status";
 */

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:    '#6b7280',
  processing: '#3b82f6',
  shipped:    '#f59e0b',
  delivered:  '#22c55e',
  confirmed:  '#10b981',
  cancelled:  '#374151',
  exception:  '#ef4444',
};

export const PM_STATUS_COLORS: Record<string, string> = {
  unpmed:     '#f59e0b',
  submitted:  '#3b82f6',
  approved:   '#22c55e',
  rejected:   '#ef4444',
  ineligible: '#6b7280',
  expired:    '#991b1b',
};

export const SHIPPING_STATUS_COLORS: Record<string, string> = {
  pending:          '#6b7280',
  ordered:          '#f59e0b',
  in_transit:       '#3b82f6',
  out_for_delivery: '#8b5cf6',
  delivered:        '#22c55e',
};

export const ACCOUNT_STATUS_COLORS: Record<string, string> = {
  Ready:     '#22c55e',
  Suspended: '#ef4444',
  Topup:     '#f59e0b',
  Error:     '#f87171',
  Hold:      '#6b7280',
};

export const EXCEPTION_STATUS_COLORS: Record<string, string> = {
  open:          '#ef4444',
  investigating: '#f59e0b',
  resolved:      '#22c55e',
};

export const SEVERITY_COLORS: Record<string, string> = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#991b1b',
};

export const PRICE_MATCH_STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  submitted: '#3b82f6',
  approved:  '#22c55e',
  rejected:  '#ef4444',
};

export const INBOUND_STATUS_COLORS: Record<string, string> = {
  pending:    '#6b7280',
  in_transit: '#3b82f6',
  received:   '#22c55e',
  partial:    '#f59e0b',
};

export const OUTBOUND_STATUS_COLORS: Record<string, string> = {
  pending:   '#6b7280',
  shipped:   '#f59e0b',
  delivered: '#22c55e',
  exception: '#ef4444',
};

export const INVITATION_STATUS_COLORS: Record<string, string> = {
  pending:  '#f59e0b',
  accepted: '#22c55e',
  expired:  '#6b7280',
};

export const PURCHASE_ORDER_STATUS_COLORS: Record<string, string> = {
  pending:   '#6b7280',
  approved:  '#3b82f6',
  ordered:   '#f59e0b',
  received:  '#22c55e',
  cancelled: '#374151',
};

// ── Runtime fetch helper ────────────────────────────────────────────────────
// Call this in client components to load live status maps from DB.
// Falls back to the static maps above if the fetch fails.

export interface MsbizStatus {
  id: string;
  type_id: string;
  value: string;
  label: string;
  color_hex: string | null;
  sort_order: number;
  is_terminal: boolean;
  type_label: string;
}

export interface MsbizStatusType {
  id: string;
  label: string;
}

let _cache: { statuses: MsbizStatus[]; types: MsbizStatusType[] } | null = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchMsbizStatuses(typeFilter?: string): Promise<{
  statuses: MsbizStatus[];
  types: MsbizStatusType[];
}> {
  const now = Date.now();
  if (!typeFilter && _cache && now - _cacheTs < CACHE_TTL_MS) {
    return _cache;
  }
  const url = `/api/msbiz/statuses${typeFilter ? `?type=${typeFilter}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch statuses: ${res.status}`);
  const data = await res.json();
  if (!typeFilter) {
    _cache = data;
    _cacheTs = now;
  }
  return data;
}

/**
 * Build a color map { value → color_hex } from fetched statuses for a given type.
 * Merges with the provided fallback so missing entries are covered.
 */
export function buildColorMap(
  statuses: MsbizStatus[],
  typeId: string,
  fallback: Record<string, string>
): Record<string, string> {
  const map: Record<string, string> = { ...fallback };
  for (const s of statuses) {
    if (s.type_id === typeId && s.color_hex) {
      map[s.value] = s.color_hex;
    }
  }
  return map;
}
