import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  onPrimaryContainer:     "#d26a5f",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
  tertiaryFixedDim:       "#ffb77d",
  errorContainer:         "#ffdad6",
  onErrorContainer:       "#93000a",
  error:                  "#ba1a1a",
  surface:                "#f9f9ff",
  surfaceContainer:       "#e7eefe",
  surfaceContainerLow:    "#f0f3ff",
  surfaceContainerHigh:   "#e2e8f8",
  surfaceContainerLowest: "#ffffff",
  onSurface:              "#151c27",
  onSurfaceVariant:       "#554240",
  outlineVariant:         "#dcc0bd",
  outline:                "#89726f",
  white:                  "#ffffff",
};
const MONO = "'JetBrains Mono', monospace";
const SANS = "'Hanken Grotesk', sans-serif";

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/admin/dashboard"     },
  { icon: "list_alt",      label: "Requests",      path: "/admin/requests"      },
  { icon: "engineering",   label: "Job Orders",    path: "/admin/job-orders"    },
  { icon: "inventory_2",   label: "Assets",        path: "/admin/assets"        },
  { icon: "group",         label: "Users",         path: "/admin/users"         },
  { icon: "domain",        label: "Departments",   path: "/admin/departments"   },
  { icon: "notifications", label: "Notifications", path: "/admin/notifications" },
];

const PRIORITY_CFG = {
  Emergency: { bg: "#FEE2E2", text: "#991B1B" },
  High:      { bg: "#FEF3C7", text: "#92400E" },
  Medium:    { bg: C.secondaryContainer, text: C.onSecondaryContainer },
  Low:       { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant },
};

const STATUS_CFG = {
  "Pending Approval":           { bg: "#FEF3C7", text: "#92400E",  dot: "#f59e0b"  },
  "Pending Admin Verification": { bg: "#ffdcc3", text: "#6e3900",  dot: "#ffb77d"  },
  "Approved":                   { bg: "#EEF2FF", text: "#3730A3",  dot: "#6366f1"  },
  "Rejected":                   { bg: "#ffdad6", text: "#93000a",  dot: "#ba1a1a"  },
  "In Progress":                { bg: C.secondaryContainer, text: C.secondary, dot: C.secondary },
  "Completed":                  { bg: "#dcfce7", text: "#166534",  dot: C.secondary},
};

const TABS = ["All Orders", "Pending Admin Verification", "Pending Approval", "Approved", "In Progress", "Completed"];
const PER_PAGE = 6;

const CATEGORY_ICONS = {
  Electrical: "bolt", Plumbing: "water_drop", HVAC: "hvac", Structural: "domain",
  "IT Services": "router", Furniture: "chair", Lighting: "light_mode",
  Elevator: "elevator", Other: "build",
};

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function Icon({ name, size = 22, filled = false, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, verticalAlign: "middle", fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400", ...style }}>{name}</span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Low;
  return <span style={{ padding: "2px 9px", borderRadius: 4, background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{priority}</span>;
}

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["Pending Approval"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.text, fontFamily: MONO }}>{status}</span>
    </div>
  );
}

function ProgressBar({ pct, status }) {
  const fill = status === "Completed" ? C.secondary : pct === 0 ? C.outlineVariant : C.primaryContainer;
  return (
    <div style={{ width: "100%", height: 4, background: C.surfaceContainerHigh, borderRadius: 99 }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: fill, transition: "width 0.4s ease" }} />
    </div>
  );
}

function Avatar({ name, size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, fontFamily: MONO, flexShrink: 0, border: `2px solid ${C.surface}` }}>
      {name?.[0] ?? "?"}
    </div>
  );
}

function Sidebar({ currentPath, onNavigate, onLogout }) {
  return (
    <aside style={{ width: 260, background: C.primaryContainer, color: C.white, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, overflowY: "auto", fontFamily: SANS }}>
      <div style={{ padding: "24px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="account_balance" size={20} filled style={{ color: C.white }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>Infrastructure Mgmt</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "8px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          return (
            <button key={item.label} onClick={() => onNavigate(item.path)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO, transition: "background 0.15s" }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={() => onNavigate("/admin/profile")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.65)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="account_circle" size={20} style={{ color: "rgba(255,255,255,0.65)" }} />
          User Profile
        </button>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.40)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="logout" size={20} style={{ color: "rgba(255,255,255,0.40)" }} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function MobileDrawer({ open, onClose, currentPath, onNavigate, onLogout }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 70 }} />
      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, background: C.primaryContainer, zIndex: 71, display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.7)", display: "flex" }}>
            <Icon name="close" size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "4px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            return (
              <button key={item.label} onClick={() => { onNavigate(item.path); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO }}>
                <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
            <Icon name="logout" size={20} style={{ color: "rgba(255,255,255,0.5)" }} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileBottomNav({ currentPath, onNavigate }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: C.white, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 62 }}>
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const isActive = currentPath.startsWith(item.path);
        return (
          <button key={item.label} onClick={() => onNavigate(item.path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: isActive ? C.primaryContainer : C.onSurfaceVariant, fontFamily: MONO, fontSize: 9, fontWeight: isActive ? 700 : 400, borderTop: isActive ? `2px solid ${C.primaryContainer}` : "2px solid transparent" }}>
            <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ search, setSearch, onMenu, isMobile }) {
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 20px", position: "sticky", top: 0, zIndex: 40, background: "rgba(249,249,255,0.92)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 10 }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurface, display: "flex", flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 420, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search job orders…" style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 8, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }} />
      </div>
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.onSurfaceVariant, fontSize: 14 }}>A</div>
        </div>
      )}
    </header>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, valueColor, cardStyle, loading, filled, highlight }) {
  return (
    <div style={{ background: C.surfaceContainerLowest, border: highlight ? `2px solid #ffb77d` : `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: "18px 18px", display: "flex", alignItems: "center", gap: 14, ...(cardStyle || {}) }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} filled={filled} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
        {loading
          ? <div style={{ width: 40, height: 22, background: C.surfaceContainerHigh, borderRadius: 6, marginTop: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
          : <h3 style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 700, color: valueColor || C.onSurface, fontFamily: SANS }}>{value}</h3>}
      </div>
    </div>
  );
}

// ─── Verify HOD Proof Modal ───────────────────────────────────────────────────
function VerifyProofModal({ order, onClose, onVerified, showToast }) {
  const { user, profile } = useAuth();
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReject,      setShowReject]       = useState(false);
  const [loading,         setLoading]          = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      // 1. Update job order to Approved
      const { error: jobErr } = await supabase
        .from("job_orders")
        .update({ status: "Approved", verified_by: user.id, verified_at: new Date().toISOString() })
        .eq("id", order.id);
      if (jobErr) throw jobErr;

      // 2. Notify the technician
      if (order.technicianId) {
        await supabase.from("notifications").insert({
          user_id: order.technicianId,
          type:    "Approved",
          title:   "HOD Signature Verified — You Can Start Work",
          body:    `Your HOD proof for "${order.title}" has been verified by the admin. You can now begin work on this job.`,
          read:    false,
        });
      }

      // 3. Notify the requester that work is starting
      if (order.requestId) {
        const { data: req } = await supabase
          .from("requests")
          .select("created_by")
          .eq("id", order.requestId)
          .single();

        if (req?.created_by) {
          await supabase.from("notifications").insert({
            user_id: req.created_by,
            type:    "StatusUpdate",
            title:   "Work Has Begun on Your Request",
            body:    `Good news! A technician has been cleared to start working on your request "${order.title}". You will be notified as progress is made.`,
            read:    false,
          });
        }
      }

      onVerified({ ...order, status: "Approved" });
      showToast("HOD proof approved. Technician and requester notified.");
      onClose();
    } catch (err) {
      console.error("Approve error:", err);
      showToast("Failed to approve. Try again.", true);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setLoading(true);
    try {
      // 1. Revert to Rejected so technician can resubmit
      const { error: jobErr } = await supabase
        .from("job_orders")
        .update({
          status:           "Rejected",
          hod_proof_url:    null,
          hod_name:         null,
          hod_signed_at:    null,
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", order.id);
      if (jobErr) throw jobErr;

      // 2. Notify technician with reason
      if (order.technicianId) {
        await supabase.from("notifications").insert({
          user_id: order.technicianId,
          type:    "StatusUpdate",
          title:   "HOD Proof Rejected — Please Resubmit",
          body:    `Your HOD proof for "${order.title}" was rejected. Reason: ${rejectionReason.trim()}. Please get the document properly signed and resubmit.`,
          read:    false,
        });
      }

      onVerified({ ...order, status: "Rejected", hodProofUrl: null });
      showToast("Proof rejected. Technician notified to resubmit.");
      onClose();
    } catch (err) {
      console.error("Reject error:", err);
      showToast("Failed to reject. Try again.", true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(560px,95vw)", background: C.white, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", zIndex: 201, fontFamily: SANS, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.primaryContainer, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.white }}>Verify HOD Signature</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{order.title} · #{order.id?.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%", cursor: "pointer", padding: 6, display: "flex" }}>
            <Icon name="close" size={18} style={{ color: C.white }} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Job info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 14, background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 10 }}>
            {[
              ["Job Title",   order.title],
              ["Department",  order.department || "—"],
              ["HOD Name",    order.hodName    || "—"],
              ["Submitted",   order.hodSignedAt ? new Date(order.hodSignedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"],
              ["Technician",  order.assigneeName],
              ["Priority",    order.priority],
            ].map(([l, v]) => (
              <div key={l}>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{l}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface }}>{v}</p>
              </div>
            ))}
          </div>

          {/* HOD proof photo */}
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em" }}>Uploaded Signed Document</p>
            {order.hodProofUrl ? (
              <div style={{ border: `1px solid ${C.outlineVariant}`, borderRadius: 10, overflow: "hidden" }}>
                <img
                  src={order.hodProofUrl}
                  alt="HOD signed document"
                  style={{ width: "100%", maxHeight: 300, objectFit: "contain", background: C.surfaceContainerLow, display: "block" }}
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            ) : (
              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: C.surfaceContainerLow, borderRadius: 10, border: `1px solid ${C.outlineVariant}` }}>
                <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant, fontFamily: MONO }}>No proof image available</p>
              </div>
            )}
            {order.hodProofUrl && (
              <a href={order.hodProofUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, fontFamily: MONO, color: C.primaryContainer, textDecoration: "none" }}>
                <Icon name="open_in_new" size={14} style={{ color: C.primaryContainer }} />
                Open full image in new tab
              </a>
            )}
          </div>

          {/* Rejection reason */}
          {showReject && (
            <div>
              <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="e.g. Signature is not clear, wrong document submitted, HOD name doesn't match department records..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, fontSize: 13, fontFamily: SANS, color: C.onSurface, background: C.white, outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", gap: 10 }}>
          {!showReject ? (
            <>
              <button
                onClick={() => setShowReject(true)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", background: C.errorContainer, color: C.onErrorContainer, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}
              >
                <Icon name="cancel" size={15} style={{ color: C.onErrorContainer }} />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", background: "#396844", color: C.white, border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? <Icon name="hourglass_top" size={15} style={{ color: C.white }} /> : <Icon name="verified" size={15} style={{ color: C.white }} />}
                {loading ? "Approving…" : "Approve & Allow Work to Begin"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setShowReject(false); setRejectionReason(""); }} style={{ flex: 1, padding: "11px 0", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Back</button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 0", background: C.error, color: C.white, border: "none", borderRadius: 8, cursor: loading || !rejectionReason.trim() ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, opacity: loading || !rejectionReason.trim() ? 0.5 : 1 }}
              >
                {loading ? <Icon name="hourglass_top" size={15} style={{ color: C.white }} /> : <Icon name="send" size={15} style={{ color: C.white }} />}
                {loading ? "Sending…" : "Send Rejection"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ order, onClose, onUpdateProgress, onMarkComplete, onVerifyProof }) {
  if (!order) return null;
  const [progress, setProgress] = useState(order.progress);
  const canEdit = order.status !== "Completed";
  const needsVerification = order.status === "Pending Admin Verification";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(440px,100vw)", background: C.white, zIndex: 101, boxShadow: "-6px 0 32px rgba(0,0,0,0.13)", display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>

        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.onPrimaryContainer, fontWeight: 700 }}>#{order.id.slice(0, 8)}</span>
                <PriorityBadge priority={order.priority} />
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{order.title}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>{order.location}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
              <Icon name="close" size={20} />
            </button>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>PROGRESS</span>
              <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>{progress}%</span>
            </div>
            <ProgressBar pct={progress} status={order.status} />
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Verification alert */}
          {needsVerification && (
            <div style={{ padding: "14px 16px", background: "#ffdcc3", border: "2px solid #ffb77d", borderRadius: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="fact_check" size={20} style={{ color: "#6e3900" }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#6e3900" }}>HOD Proof Submitted — Action Required</p>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#6e3900", lineHeight: 1.5 }}>
                Technician {order.assigneeName} has uploaded a signed HOD document for this job. Please review the photo and verify or reject it.
              </p>
              <button
                onClick={() => onVerifyProof(order)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}
              >
                <Icon name="fact_check" size={15} style={{ color: C.white }} />
                Review HOD Proof Now
              </button>
            </div>
          )}

          {/* Status */}
          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Status</div>
            <StatusChip status={order.status} />
          </div>

          {/* HOD Approval */}
          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>HOD Approval</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: order.hodSignedAt && !needsVerification ? "#DCFCE7" : needsVerification ? "#ffdcc3" : "#FEF3C7" }}>
              <Icon
                name={order.hodSignedAt && !needsVerification ? "verified" : needsVerification ? "hourglass_top" : "pending"}
                size={16}
                style={{ color: order.hodSignedAt && !needsVerification ? "#166534" : needsVerification ? "#6e3900" : "#92400E" }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: order.hodSignedAt && !needsVerification ? "#166534" : needsVerification ? "#6e3900" : "#92400E" }}>
                {order.hodSignedAt && !needsVerification
                  ? `Verified — Signed by ${order.hodName}`
                  : needsVerification
                    ? `Proof submitted by ${order.hodName} — pending your review`
                    : "Awaiting HOD signature from technician"}
              </span>
            </div>

            {/* View proof photo */}
            {order.hodProofUrl && (
              <a href={order.hodProofUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, fontFamily: MONO, color: C.primaryContainer, textDecoration: "none" }}>
                <Icon name="photo_camera" size={14} style={{ color: C.primaryContainer }} />
                View uploaded proof photo
              </a>
            )}
          </div>

          {/* PDF */}
          {order.pdfUrl && (
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Job Order Document</div>
              <button onClick={() => window.open(order.pdfUrl, "_blank", "noopener,noreferrer")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.outlineVariant}`, background: C.white, cursor: "pointer", textAlign: "left", width: "100%" }}>
                <Icon name="picture_as_pdf" size={20} style={{ color: C.error }} />
                <span style={{ flex: 1, fontSize: 13, color: C.onSurface, fontWeight: 600 }}>View Job Order PDF</span>
                <Icon name="open_in_new" size={16} style={{ color: C.onSurfaceVariant }} />
              </button>
            </div>
          )}

          {/* Fields */}
          {[
            ["Assigned Technician", order.assigneeName],
            ["Department",          order.department],
            ["Created",             order.createdAt],
            ["Linked Request",      `#${order.requestId?.slice(0, 8) ?? "—"}`],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontSize: 14, color: C.onSurface, fontWeight: 500 }}>{val || "—"}</div>
            </div>
          ))}

          {/* Notes */}
          {order.notes && (
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Field Notes</div>
              <div style={{ background: C.surfaceContainerLow, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: C.onSurface, lineHeight: 1.6, border: `1px solid ${C.outlineVariant}` }}>{order.notes}</div>
            </div>
          )}

          {/* Progress slider */}
          {canEdit && (
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Update Progress</div>
              <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", accentColor: C.primaryContainer }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, marginTop: 2 }}>
                <span>0%</span><span style={{ fontWeight: 700, color: C.onSurface }}>{progress}%</span><span>100%</span>
              </div>
              <button onClick={() => onUpdateProgress(order, progress)} style={{ marginTop: 8, width: "100%", padding: "8px 0", background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>
                Save Progress
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", background: C.surfaceContainerHigh, color: C.onSurface, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}>Close</button>
          {needsVerification && (
            <button onClick={() => onVerifyProof(order)} style={{ flex: 2, padding: "11px 0", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="fact_check" size={15} style={{ color: C.white }} />
              Verify HOD Proof
            </button>
          )}
          {canEdit && !needsVerification && (
            <button onClick={() => onMarkComplete(order)} style={{ flex: 1, padding: "11px 0", background: C.secondaryContainer, color: C.onSecondaryContainer, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="check_circle" size={15} style={{ color: C.onSecondaryContainer }} />
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function TableRow({ order, onSelect }) {
  const [hov, setHov] = useState(false);
  const needsVerification = order.status === "Pending Admin Verification";
  return (
    <tr onClick={() => onSelect(order)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderTop: `1px solid ${C.outlineVariant}33`, background: needsVerification ? "#ffdcc355" : hov ? C.surfaceContainerLow : "transparent", cursor: "pointer", transition: "background 0.12s", opacity: order.status === "Completed" ? 0.75 : 1 }}>
      <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: MONO, color: C.onPrimaryContainer, whiteSpace: "nowrap" }}>#{order.id.slice(0, 8)}</td>
      <td style={{ padding: "14px 20px", minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.onSurface }}>{order.title}</div>
        <div style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>{order.location}</div>
      </td>
      <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}><PriorityBadge priority={order.priority} /></td>
      <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StatusChip status={order.status} />
          {needsVerification && <Icon name="priority_high" size={14} style={{ color: "#6e3900" }} />}
        </div>
      </td>
      <td style={{ padding: "14px 20px", minWidth: 110 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ProgressBar pct={order.progress} status={order.status} />
          <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>{order.progress}%</span>
        </div>
      </td>
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={order.assigneeName} />
          <span style={{ fontSize: 13, color: C.onSurface }}>{order.assigneeName}</span>
        </div>
      </td>
      <td style={{ padding: "14px 20px", fontSize: 13, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>{order.createdAt}</td>
      <td style={{ padding: "14px 20px", textAlign: "right" }}>
        {needsVerification
          ? <span style={{ fontSize: 10, fontFamily: MONO, fontWeight: 700, color: "#6e3900", background: "#ffdcc3", padding: "3px 8px", borderRadius: 4 }}>VERIFY</span>
          : order.status === "Completed"
            ? <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, color: C.secondary }}><Icon name="check_circle" size={16} filled /><span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>Done</span></div>
            : <Icon name="chevron_right" size={20} style={{ color: C.onSurfaceVariant }} />}
      </td>
    </tr>
  );
}

function MobileOrderCard({ order, onSelect }) {
  const needsVerification = order.status === "Pending Admin Verification";
  return (
    <div onClick={() => onSelect(order)} style={{ background: needsVerification ? "#ffdcc355" : C.white, border: needsVerification ? "2px solid #ffb77d" : `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: "14px 16px", opacity: order.status === "Completed" ? 0.8 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onPrimaryContainer }}>#{order.id.slice(0, 8)}</p>
          <h3 style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.onSurface }}>{order.title}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onSurfaceVariant }}>{order.location}</p>
        </div>
        <PriorityBadge priority={order.priority} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <ProgressBar pct={order.progress} status={order.status} />
        <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>{order.progress}%</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar name={order.assigneeName} size={22} />
          <span style={{ fontSize: 12, color: C.onSurface }}>{order.assigneeName}</span>
        </div>
        <StatusChip status={order.status} />
      </div>
      {needsVerification && (
        <div style={{ marginTop: 10, padding: "6px 10px", background: "#ffdcc3", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="fact_check" size={14} style={{ color: "#6e3900" }} />
          <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: "#6e3900" }}>Tap to verify HOD proof</span>
        </div>
      )}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.onSurface, color: C.white, padding: "10px 22px", borderRadius: 99, fontSize: 13, fontFamily: SANS, fontWeight: 600, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminJobOrdersPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();
  const { user }  = useAuth();

  const [search,     setSearch]     = useState("");
  const [tab,        setTab]        = useState("All Orders");
  const [page,       setPage]       = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [verifyJob,  setVerifyJob]  = useState(null);
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [orders,     setOrders]     = useState([]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }
  const go = useCallback((path) => navigate(path), [navigate]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("job_orders")
        .select(`
          id, title, location, department, priority, status,
          progress, notes, created_at, request_id,
          pdf_url, hod_signed_at, hod_name, hod_proof_url,
          rejection_reason, verified_at,
          technician_id,
          technician:profiles!job_orders_technician_id_fkey ( id, full_name )
        `)
        .order("created_at", { ascending: false });

      if (error) { console.error("Job orders fetch error:", error); showToast("Failed to load job orders."); return; }

      setOrders((data ?? []).map((o) => ({
        id:             o.id,
        title:          o.title,
        location:       o.location,
        department:     o.department,
        priority:       o.priority,
        status:         o.status,
        progress:       o.progress ?? 0,
        notes:          o.notes,
        pdfUrl:         o.pdf_url,
        hodSignedAt:    o.hod_signed_at,
        hodName:        o.hod_name,
        hodProofUrl:    o.hod_proof_url,
        rejectionReason:o.rejection_reason,
        requestId:      o.request_id,
        technicianId:   o.technician_id,
        assigneeName:   o.technician?.full_name ?? "Unassigned",
        createdAt:      new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      })));
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  // ── Real-time ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel("job-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_orders" }, () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchOrders]);

  // ── Update progress (also notifies requester) ─────────────────────────────
  async function handleUpdateProgress(order, progress) {
    try {
      const newStatus = progress >= 100 ? "Completed" : progress > 0 ? "In Progress" : order.status;

      const { error } = await supabase
        .from("job_orders")
        .update({ progress, status: newStatus })
        .eq("id", order.id);
      if (error) throw error;

      if (newStatus === "Completed" && order.requestId) {
        await supabase.from("requests").update({ status: "Completed" }).eq("id", order.requestId);
      }

      // Notify requester at milestones
      if ([25, 50, 75].includes(progress) && order.requestId) {
        const { data: req } = await supabase.from("requests").select("created_by").eq("id", order.requestId).single();
        if (req?.created_by) {
          await supabase.from("notifications").insert({
            user_id: req.created_by,
            type:    "StatusUpdate",
            title:   `Your Request is ${progress}% Complete`,
            body:    `The technician working on "${order.title}" has made progress — the job is now ${progress}% done.`,
            read:    false,
          });
        }
      }

      // Notify requester on full completion
      if (newStatus === "Completed" && order.requestId) {
        const { data: req } = await supabase.from("requests").select("created_by").eq("id", order.requestId).single();
        if (req?.created_by) {
          await supabase.from("notifications").insert({
            user_id: req.created_by,
            type:    "Completed",
            title:   "✅ Your Request Has Been Completed",
            body:    `The maintenance job for "${order.title}" has been fully completed. If you have any concerns, please contact the admin.`,
            read:    false,
          });
        }
      }

      await fetchOrders();
      setSelected(s => s?.id === order.id ? { ...s, progress, status: newStatus } : s);
      showToast("Progress updated.");
    } catch (err) {
      console.error("Update progress error:", err);
      showToast("Failed to update progress.");
    }
  }

  // ── Mark complete ─────────────────────────────────────────────────────────
  async function handleMarkComplete(order) {
    try {
      const { error } = await supabase.from("job_orders").update({ status: "Completed", progress: 100 }).eq("id", order.id);
      if (error) throw error;

      if (order.requestId) {
        await supabase.from("requests").update({ status: "Completed" }).eq("id", order.requestId);

        // Notify requester
        const { data: req } = await supabase.from("requests").select("created_by").eq("id", order.requestId).single();
        if (req?.created_by) {
          await supabase.from("notifications").insert({
            user_id: req.created_by,
            type:    "Completed",
            title:   "✅ Your Request Has Been Completed",
            body:    `The maintenance job for "${order.title}" has been fully completed. If you have any concerns, please contact the admin.`,
            read:    false,
          });
        }
      }

      await fetchOrders();
      setSelected(null);
      setDrawerOpen(false);
      showToast("Job order marked complete. Requester notified.");
    } catch (err) {
      console.error("Mark complete error:", err);
      showToast("Failed to mark complete.");
    }
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const tabOk    = tab === "All Orders" || o.status === tab;
      const searchOk = !q || [o.id, o.title, o.location, o.assigneeName, o.department].some((f) => f?.toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [orders, tab, search]);

  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const pendingVerificationCount = orders.filter(o => o.status === "Pending Admin Verification").length;

  const STAT_CARDS = [
    { icon: "fact_check",      label: "Needs Verification", value: pendingVerificationCount,                                                                   iconBg: "#ffdcc355", iconColor: "#6e3900", highlight: pendingVerificationCount > 0 },
    { icon: "bolt",            label: "In Progress",        value: orders.filter(o => o.status === "In Progress").length,                                      iconBg: C.secondaryContainer, iconColor: C.secondary, filled: true },
    { icon: "check_circle",    label: "Completed",          value: orders.filter(o => o.status === "Completed").length,                                        iconBg: C.surfaceContainerLow, iconColor: C.onSurfaceVariant },
    { icon: "warning",         label: "Critical",           value: orders.filter(o => o.priority === "Emergency" && o.status !== "Completed").length,           iconBg: C.errorContainer, iconColor: C.onErrorContainer, valueColor: C.error, filled: true, cardStyle: { background: `linear-gradient(135deg, ${C.errorContainer}55 0%, transparent 100%)` } },
  ];

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box}`}</style>

      {!isMobile && <Sidebar currentPath={location.pathname} onNavigate={go} onLogout={() => supabase.auth.signOut().then(() => navigate("/login"))} />}
      {isMobile && (
        <MobileDrawer open={drawerOpen && !selected && !verifyJob} onClose={() => setDrawerOpen(false)}
          currentPath={location.pathname} onNavigate={go} onLogout={() => supabase.auth.signOut().then(() => navigate("/login"))} />
      )}

      <div style={{ marginLeft: isMobile ? 0 : 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar search={search} setSearch={setSearch} onMenu={() => setDrawerOpen(true)} isMobile={isMobile} />

        <main style={{ flex: 1, padding: isMobile ? "20px 14px 80px" : "32px", maxWidth: 1600, width: "100%", alignSelf: "center" }}>

          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>Job Orders</h1>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Facility maintenance dispatch — auto-created when a technician is assigned.</p>
            </div>
            {pendingVerificationCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#ffdcc3", border: "1px solid #ffb77d", borderRadius: 8 }}>
                <Icon name="priority_high" size={16} style={{ color: "#6e3900" }} />
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: MONO, color: "#6e3900" }}>{pendingVerificationCount} HOD proof{pendingVerificationCount > 1 ? "s" : ""} awaiting your review</span>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
            {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
          </div>

          <div style={{ background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
            {/* Toolbar */}
            <div style={{ padding: "12px 18px", borderBottom: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", background: C.surface }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
                {TABS.map((t) => (
                  <button key={t} onClick={() => { setTab(t); setPage(1); }} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 11, fontFamily: MONO, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: tab === t ? C.surfaceContainerHigh : "transparent", color: tab === t ? C.onSurface : C.onSurfaceVariant, fontWeight: tab === t ? 700 : 400, position: "relative" }}>
                    {t}
                    {t === "Pending Admin Verification" && pendingVerificationCount > 0 && (
                      <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#6e3900", color: C.white, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingVerificationCount}</span>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={() => { setLoading(true); fetchOrders().finally(() => setLoading(false)); }} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant, fontSize: 12, fontFamily: MONO, flexShrink: 0 }}>
                <Icon name="refresh" size={16} />
                Refresh
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map((i) => <div key={i} style={{ height: 56, background: C.surfaceContainerLow, borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />)}
              </div>
            ) : paged.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: C.onSurfaceVariant }}>
                <Icon name="engineering" size={40} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 10px" }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                  {orders.length === 0 ? "No job orders yet" : "No job orders match your filters"}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                  {orders.length === 0 ? "Job orders are created automatically when you assign a technician to a request." : "Try adjusting your search or tab filter."}
                </p>
              </div>
            ) : isMobile ? (
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {paged.map((o) => <MobileOrderCard key={o.id} order={o} onSelect={(o) => { setSelected(o); setDrawerOpen(true); }} />)}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
                  <thead>
                    <tr style={{ background: `${C.surfaceContainerLow}60` }}>
                      {["Order ID", "Task Description", "Priority", "Status", "Progress", "Assigned To", "Created", ""].map((h, i) => (
                        <th key={i} style={{ padding: "11px 20px", textAlign: i === 7 ? "right" : "left", fontSize: 10, fontWeight: 500, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", opacity: 0.7 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((o) => (
                      <TableRow key={o.id} order={o} onSelect={(o) => { setSelected(o); setDrawerOpen(true); }} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: `1px solid ${C.outlineVariant}` }}>
                <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>{paged.length} of {filtered.length}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "5px 8px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: "none", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, display: "flex" }}><Icon name="chevron_left" size={18} /></button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: "5px 11px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: page === p ? C.primaryContainer : "none", color: page === p ? C.white : C.onSurface, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 700 : 400, fontFamily: MONO }}>{p}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "5px 8px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: "none", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1, display: "flex" }}><Icon name="chevron_right" size={18} /></button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", background: C.primaryContainer, borderRadius: 10, color: C.white }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffb4aa", animation: "pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, letterSpacing: "0.06em" }}>Live — auto-updates in real time</span>
          </div>
        </main>
      </div>

      {isMobile && <MobileBottomNav currentPath={location.pathname} onNavigate={go} />}

      {drawerOpen && selected && !verifyJob && (
        <DetailDrawer
          order={selected}
          onClose={() => { setDrawerOpen(false); setSelected(null); }}
          onUpdateProgress={handleUpdateProgress}
          onMarkComplete={handleMarkComplete}
          onVerifyProof={(o) => setVerifyJob(o)}
        />
      )}

      {verifyJob && (
        <VerifyProofModal
          order={verifyJob}
          onClose={() => setVerifyJob(null)}
          showToast={showToast}
          onVerified={(updated) => {
            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
            setSelected(null);
            setDrawerOpen(false);
            setVerifyJob(null);
          }}
        />
      )}

      <Toast msg={toast} />
    </div>
  );
}