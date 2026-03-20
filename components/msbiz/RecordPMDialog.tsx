"use client";
import { useState, useEffect } from "react";
import { X, DollarSign, Package, User } from "lucide-react";

interface PMItem { name: string; qty: number; unit_price: number; }
interface PriceMatch {
  id: string; order_id: string; ms_order_number: string;
  status: string; status_value: string; status_label: string; status_color: string;
  original_price: number; refund_amount: number | null; refund_type: string | null;
  reward_amount: number | null; rewarded_to: string | null;
  assigned_pmer_id: string | null; pmer_name: string | null; pmer_email: string | null;
  account_email: string | null; account_name: string | null;
  items: PMItem[] | null; expires_at: string | null; urgent: boolean; notes: string | null;
}
interface Props { pm: PriceMatch; onClose: () => void; onSaved: () => void; }

export default function RecordPMDialog({ pm, onClose, onSaved }: Props) {
  const [refundAmount, setRefundAmount] = useState<string>(String(pm.original_price));
  const [notes, setNotes] = useState(pm.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fullRate, setFullRate] = useState(0.15);
  const [partialOverRate, setPartialOverRate] = useState(0.12);
  const [partialRate, setPartialRate] = useState(0.10);
  const originalPrice = Number(pm.original_price);

  // Fetch rates from API (sourced from Vercel env vars)
  useEffect(() => {
    fetch("/api/msbiz/price-matches/rates")
      .then(r => r.json())
      .then(d => {
        if (d.full_refund_rate)         setFullRate(d.full_refund_rate);
        if (d.partial_over_refund_rate) setPartialOverRate(d.partial_over_refund_rate);
        if (d.partial_refund_rate)      setPartialRate(d.partial_refund_rate);
      })
      .catch(() => {});
  }, []);

  // Assignee display: "Name (email)" from pmer_name + pmer_email on the PM record
  const assigneeDisplay = pm.pmer_name && pm.pmer_email
    ? `${pm.pmer_name} (${pm.pmer_email})`
    : pm.pmer_email ?? pm.pmer_name ?? null;

  const parsedRefund = parseFloat(refundAmount) || 0;
  const refundRatio = originalPrice > 0 ? parsedRefund / originalPrice : 0;

  // 3-tier auto-computed refund type
  const refundTier = refundRatio >= 1.0 ? "full" : refundRatio >= 0.25 ? "partial_over" : "partial";
  const tierRate = refundTier === "full" ? fullRate : refundTier === "partial_over" ? partialOverRate : partialRate;
  const tierLabel = refundTier === "full" ? "Full Refund" : refundTier === "partial_over" ? "Partial (≥25%)" : "Partial (<25%)";
  const tierColor = refundTier === "full" ? "#4ade80" : refundTier === "partial_over" ? "#60a5fa" : "#fb923c";

  const computedReward = parsedRefund * tierRate;
  const isValid = parsedRefund > 0 && parsedRefund <= originalPrice;

  async function handleSubmit() {
    setError("");
    if (!isValid) { setError("Invalid refund amount."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/msbiz/price-matches/${pm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refund_amount: parsedRefund,
          notes: notes || null,
          rewarded_to: pm.rewarded_to || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed"); return; }
      onSaved();
    } catch { setError("Network error"); }
    finally { setSubmitting(false); }
  }

  const items = pm.items ?? [];

  return (
    <div
      style={{ position:"fixed",inset:0,zIndex:50,backgroundColor:"rgba(0,0,0,0.7)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",backdropFilter:"blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ backgroundColor:"#111827",border:"1px solid #374151",borderRadius:"20px",
        width:"100%",maxWidth:"520px",maxHeight:"90vh",overflowY:"auto",display:"flex",flexDirection:"column" }}>

        {/* Bento grid header — amber theme */}
        <div style={{ position:"relative",overflow:"hidden",borderRadius:"20px 20px 0 0",
          borderBottom:"1px solid #374151" }}>
          {/* Background grid */}
          <div style={{ position:"absolute",inset:0,backgroundColor:"#030712" }}>
            <div style={{ position:"absolute",inset:0,opacity:0.07,
              backgroundImage:"linear-gradient(#f59e0b 1px, transparent 1px),linear-gradient(90deg,#f59e0b 1px,transparent 1px)",
              backgroundSize:"28px 28px" }} />
            <div style={{ position:"absolute",top:"-32px",left:"-32px",width:"140px",height:"140px",
              backgroundColor:"rgba(245,158,11,0.15)",borderRadius:"50%",filter:"blur(32px)" }} />
            <div style={{ position:"absolute",bottom:"-16px",right:"24px",width:"100px",height:"100px",
              backgroundColor:"rgba(245,158,11,0.08)",borderRadius:"50%",filter:"blur(24px)" }} />
          </div>
          {/* Content */}
          <div style={{ position:"relative",padding:"16px 20px",display:"flex",
            alignItems:"flex-start",justifyContent:"space-between" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"12px" }}>
              <div style={{ width:"40px",height:"40px",borderRadius:"12px",
                backgroundColor:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.3)",
                display:"flex",alignItems:"center",justifyContent:"center" }}>
                <DollarSign style={{ width:"20px",height:"20px",color:"#f59e0b" }} />
              </div>
              <div>
                <div style={{ fontFamily:"monospace",fontWeight:700,color:"#fbbf24",fontSize:"15px" }}>
                  Record Price Match
                </div>
                <div style={{ fontSize:"12px",color:"#6b7280",marginTop:"2px",fontFamily:"monospace" }}>
                  {pm.ms_order_number}
                  {pm.account_email && <span style={{ color:"#9ca3af",marginLeft:"8px" }}>{pm.account_email}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",
              color:"#6b7280",padding:"4px",borderRadius:"6px" }}>
              <X style={{ width:"16px",height:"16px" }} />
            </button>
          </div>
        </div>

        <div style={{ padding:"20px",display:"flex",flexDirection:"column",gap:"16px" }}>

          {/* Items */}
          {items.length > 0 && (
            <div>
              <div style={{ fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em",
                color:"#6b7280",marginBottom:"8px",display:"flex",alignItems:"center",gap:"6px" }}>
                <Package style={{ width:"11px",height:"11px" }} /> Items
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:"4px" }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                    backgroundColor:"#1f2937",borderRadius:"8px",padding:"8px 12px" }}>
                    <span style={{ color:"#d1d5db",fontSize:"13px" }}>
                      <span style={{ color:"#f59e0b",fontFamily:"monospace",fontWeight:600 }}>{item.qty}×</span>{" "}{item.name}
                    </span>
                    <span style={{ fontFamily:"monospace",fontSize:"13px",color:"#9ca3af" }}>
                      ${(item.qty * item.unit_price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                marginTop:"6px",padding:"8px 12px",borderTop:"1px solid #374151" }}>
                <span style={{ fontSize:"13px",color:"#6b7280" }}>Total</span>
                <span style={{ fontFamily:"monospace",fontWeight:700,color:"#f3f4f6",fontSize:"15px" }}>
                  ${originalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Assignee */}
          <div style={{ display:"flex",alignItems:"center",gap:"8px",backgroundColor:"#1f2937",
            borderRadius:"10px",padding:"10px 12px" }}>
            <User style={{ width:"14px",height:"14px",color:"#6b7280",flexShrink:0 }} />
            <div>
              <div style={{ fontSize:"10px",textTransform:"uppercase",letterSpacing:"0.05em",color:"#6b7280" }}>
                Assigned Pmer
              </div>
              <div style={{ fontSize:"13px",color:"#d1d5db",marginTop:"1px" }}>
                {assigneeDisplay ?? <span style={{ color:"#6b7280",fontStyle:"italic" }}>Unassigned</span>}
              </div>
            </div>
          </div>

          {/* Refund amount + auto tier */}
          <div>
            <label style={{ fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em",
              color:"#6b7280",display:"block",marginBottom:"8px" }}>Refund Amount</label>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",
                color:"#9ca3af",fontSize:"14px",pointerEvents:"none" }}>$</span>
              <input type="number" value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                min={0} max={originalPrice} step={0.01}
                style={{ width:"100%",backgroundColor:"#1f2937",border:"1px solid #374151",
                  borderRadius:"10px",padding:"10px 12px 10px 28px",color:"#f3f4f6",
                  fontSize:"14px",fontFamily:"monospace",outline:"none",boxSizing:"border-box" }} />
            </div>
            {parsedRefund > originalPrice && (
              <p style={{ fontSize:"12px",color:"#ef4444",marginTop:"4px" }}>
                Cannot exceed ${originalPrice.toFixed(2)}
              </p>
            )}
            {/* Auto-tier indicator */}
            {parsedRefund > 0 && (
              <div style={{ display:"flex",alignItems:"center",gap:"6px",marginTop:"6px" }}>
                <div style={{ width:"8px",height:"8px",borderRadius:"50%",backgroundColor:tierColor,flexShrink:0 }} />
                <span style={{ fontSize:"12px",color:tierColor,fontWeight:500 }}>{tierLabel}</span>
                <span style={{ fontSize:"11px",color:"#6b7280" }}>— {(tierRate*100).toFixed(0)}% reward rate</span>
                <span style={{ fontSize:"10px",color:"#4b5563",marginLeft:"auto" }}>
                  {refundRatio < 0.25 ? "< 25% of order" : refundRatio < 1.0 ? "25–99% of order" : "= full order"}
                </span>
              </div>
            )}
          </div>

          {/* Live reward preview */}
          <div style={{ backgroundColor:"#0a1a0a",border:"1px solid #14532d",borderRadius:"10px",
            padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div style={{ fontSize:"13px",color:"#9ca3af" }}>
              ${parsedRefund.toFixed(2)}
              <span style={{ margin:"0 6px",color:"#374151" }}>×</span>
              <span style={{ color:tierColor }}>{(tierRate*100).toFixed(0)}%</span>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"11px",color:"#6b7280",marginBottom:"2px" }}>Reward to Pmer</div>
              <div style={{ fontFamily:"monospace",fontWeight:700,fontSize:"18px",color:"#4ade80" }}>
                ${computedReward.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize:"11px",textTransform:"uppercase",letterSpacing:"0.05em",
              color:"#6b7280",display:"block",marginBottom:"8px" }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Optional notes…"
              style={{ width:"100%",backgroundColor:"#1f2937",border:"1px solid #374151",
                borderRadius:"10px",padding:"10px 12px",color:"#f3f4f6",fontSize:"13px",
                outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit" }} />
          </div>

          {error && (
            <p style={{ fontSize:"13px",color:"#ef4444",backgroundColor:"#1a0808",
              border:"1px solid #7f1d1d",borderRadius:"8px",padding:"10px 12px" }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display:"flex",gap:"10px" }}>
            <button onClick={onClose} style={{ flex:1,padding:"11px",borderRadius:"10px",
              border:"1px solid #374151",backgroundColor:"transparent",color:"#9ca3af",
              cursor:"pointer",fontSize:"14px" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || !isValid} style={{
              flex:2,padding:"11px",borderRadius:"10px",border:"none",
              backgroundColor: submitting || !isValid ? "#374151" : "#d97706",
              color: submitting || !isValid ? "#6b7280" : "#fff",
              cursor: submitting || !isValid ? "not-allowed" : "pointer",
              fontSize:"14px",fontWeight:600 }}>
              {submitting ? "Recording…" : `Record PM · Reward $${computedReward.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
