"use client";
import { useState, useEffect } from "react";
import { X, DollarSign, Package, User } from "lucide-react";

interface PMItem {
  name: string;
  qty: number;
  unit_price: number;
}

interface PriceMatch {
  id: string;
  order_id: string;
  ms_order_number: string;
  status: string;
  status_value: string;
  status_label: string;
  status_color: string;
  original_price: number;
  refund_amount: number | null;
  refund_type: string | null;
  reward_amount: number | null;
  account_email: string | null;
  account_name: string | null;
  items: PMItem[] | null;
  expires_at: string | null;
  urgent: boolean;
  rewarded_to: string | null;
  notes: string | null;
}

interface Props {
  pm: PriceMatch;
  onClose: () => void;
  onSaved: () => void;
}

const FULL_RATE = 0.15;
const PARTIAL_RATE = 0.10;

export default function RecordPMDialog({ pm, onClose, onSaved }: Props) {
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState<string>(String(pm.original_price));
  const [notes, setNotes] = useState(pm.notes ?? "");
  const [rewardedTo, setRewardedTo] = useState(pm.rewarded_to ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const originalPrice = Number(pm.original_price);
  const parsedRefund = parseFloat(refundAmount) || 0;
  const rate = refundType === "full" ? FULL_RATE : PARTIAL_RATE;
  const computedReward = parsedRefund * rate;

  useEffect(() => {
    if (refundType === "full") {
      setRefundAmount(String(originalPrice));
    }
  }, [refundType, originalPrice]);

  const isValid =
    parsedRefund > 0 &&
    parsedRefund <= originalPrice &&
    (refundType === "full" ? parsedRefund === originalPrice : true);

  async function handleSubmit() {
    setError("");
    if (!isValid) {
      setError("Invalid refund amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/msbiz/price-matches/${pm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refund_amount: parsedRefund,
          refund_type: refundType,
          notes: notes || null,
          rewarded_to: rewardedTo || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to record PM");
        return;
      }
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const items = pm.items ?? [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#1c1608",
            borderBottom: "1px solid #92400e",
            borderRadius: "16px 16px 0 0",
            padding: "16px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <DollarSign style={{ width: "16px", height: "16px", color: "#f59e0b" }} />
              <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#fbbf24", fontSize: "15px" }}>
                {pm.ms_order_number}
              </span>
            </div>
            {pm.account_email && (
              <div style={{ fontSize: "12px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                <User style={{ width: "11px", height: "11px" }} />
                {pm.account_email}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Items */}
          {items.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Package style={{ width: "11px", height: "11px" }} /> Items
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#1f2937",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  >
                    <span style={{ color: "#d1d5db", fontSize: "13px" }}>
                      <span style={{ color: "#f59e0b", fontFamily: "monospace", fontWeight: 600 }}>{item.qty}×</span>{" "}
                      {item.name}
                    </span>
                    <span style={{ fontFamily: "monospace", fontSize: "13px", color: "#9ca3af" }}>
                      ${(item.qty * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderTop: "1px solid #374151",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6b7280" }}>Subtotal</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#f3f4f6", fontSize: "15px" }}>
                  ${originalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Refund type toggle */}
          <div>
            <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", display: "block", marginBottom: "8px" }}>
              Refund Type
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["full", "partial"] as const).map((type) => {
                const active = refundType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setRefundType(type)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: active ? "1px solid #f59e0b" : "1px solid #374151",
                      backgroundColor: active ? "#1c1608" : "#1f2937",
                      color: active ? "#fbbf24" : "#9ca3af",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    {type === "full" ? `Full Refund (${(FULL_RATE * 100).toFixed(0)}%)` : `Partial Refund (${(PARTIAL_RATE * 100).toFixed(0)}%)`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refund amount */}
          <div>
            <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", display: "block", marginBottom: "8px" }}>
              Refund Amount
            </label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                fontSize: "14px",
                pointerEvents: "none",
              }}>$</span>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                disabled={refundType === "full"}
                min={0}
                max={originalPrice}
                step={0.01}
                style={{
                  width: "100%",
                  backgroundColor: refundType === "full" ? "#1a1a2e" : "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "10px",
                  padding: "10px 12px 10px 28px",
                  color: refundType === "full" ? "#6b7280" : "#f3f4f6",
                  fontSize: "14px",
                  fontFamily: "monospace",
                  outline: "none",
                  boxSizing: "border-box",
                  cursor: refundType === "full" ? "not-allowed" : "text",
                }}
              />
            </div>
            {refundType === "partial" && parsedRefund > originalPrice && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                Cannot exceed subtotal of ${originalPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Live reward calculation */}
          <div
            style={{
              backgroundColor: "#0f1f0f",
              border: "1px solid #166534",
              borderRadius: "10px",
              padding: "12px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: "13px", color: "#9ca3af" }}>
              Refund <span style={{ color: "#d1d5db", fontFamily: "monospace" }}>${parsedRefund.toFixed(2)}</span>
              <span style={{ margin: "0 6px", color: "#4b5563" }}>×</span>
              <span style={{ color: "#6b7280" }}>{(rate * 100).toFixed(0)}%</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Reward</div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "18px", color: "#4ade80" }}>
                ${computedReward.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Rewarded to */}
          <div>
            <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", display: "block", marginBottom: "8px" }}>
              Rewarded To (User ID or name)
            </label>
            <input
              type="text"
              value={rewardedTo}
              onChange={(e) => setRewardedTo(e.target.value)}
              placeholder="Leave blank to assign to yourself"
              style={{
                width: "100%",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "10px",
                padding: "10px 12px",
                color: "#f3f4f6",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", display: "block", marginBottom: "8px" }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes about this price match…"
              style={{
                width: "100%",
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "10px",
                padding: "10px 12px",
                color: "#f3f4f6",
                fontSize: "13px",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#ef4444", backgroundColor: "#1f0a0a", border: "1px solid #7f1d1d", borderRadius: "8px", padding: "10px 12px" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                borderRadius: "10px",
                border: "1px solid #374151",
                backgroundColor: "transparent",
                color: "#9ca3af",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !isValid}
              style={{
                flex: 2,
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: submitting || !isValid ? "#374151" : "#d97706",
                color: submitting || !isValid ? "#6b7280" : "#fff",
                cursor: submitting || !isValid ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 600,
                transition: "background-color 0.15s",
              }}
            >
              {submitting ? "Recording…" : `Record PM — Reward $${computedReward.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
