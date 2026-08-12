import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primaryContainer:     "var(--color-primary-container)",
  onPrimaryContainer:   "var(--color-on-primary-container)",
  secondaryContainer:   "var(--color-secondary-container)",
  onSecondaryContainer: "var(--color-on-secondary-container)",
  errorContainer:       "var(--color-error-container)",
  onErrorContainer:     "var(--color-on-error-container)",
  error:                "var(--color-error)",
  surface:              "var(--color-background)",
  surfaceContainerLow:  "var(--color-surface-container-low)",
  surfaceContainerHigh: "var(--color-surface-container-high)",
  onSurface:            "var(--color-on-surface)",
  onSurfaceVariant:     "var(--color-on-surface-variant)",
  outlineVariant:        "var(--color-outline-variant)",
  white:                "#ffffff",
};
const CARD = "var(--color-surface-container-lowest)";
const SIDEBAR_BG = "#4a0404";
const MONO = "'JetBrains Mono', monospace";
const SANS = "'Hanken Grotesk', sans-serif";

// ─── UNIFIED nav — identical across every staff page ─────────────────────────
const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",           shortLabel: "Home",    path: "/staff/dashboard"            },
  { icon: "fact_check",    label: "Monitor Approvals",   shortLabel: "Approve", path: "/staff/monitor-approvals"    },
  { icon: "history",       label: "Request History",     shortLabel: "History", path: "/staff/monitored-requests"   },
  { icon: "domain",        label: "Dept. History & Log", shortLabel: "Dept.",   path: "/staff/departmental-history" },
  { icon: "notifications", label: "Notifications",       shortLabel: "Alerts",  path: "/staff/notifications"        },
];

const CATEGORY_ICONS = {
  Electrical: "bolt", Plumbing: "water_drop", HVAC: "hvac", Structural: "domain",
  "IT Services": "router", Furniture: "chair", Lighting: "light_mode",
  Elevator: "elevator", Other: "build",
};

// Semantic priority chip colors — literal light chips in both themes,
// consistent with the convention used across this app.
const PRIORITY_CFG = {
  Emergency: { bg: "#ffdad6", text: "#93000a" },
  High:      { bg: "#FEF3C7", text: "#92400E" },
  Medium:    { bg: C.secondaryContainer, text: C.onSecondaryContainer },
  Low:       { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant },
};

function Icon({ name, size = 22, filled = false, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size, lineHeight: 1, verticalAlign: "middle",
      fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400",
      ...style,
    }}>{name}</span>
  );
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Low;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 4, background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {priority}
    </span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// FIX: previously referenced `location.pathname` without ever calling
// useLocation() inside this component — threw a ReferenceError on render.
function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const content = (
    <aside style={{ width: 260, background: SIDEBAR_BG, color: C.white, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", borderRight: `1px solid ${C.outlineVariant}`, fontFamily: SANS }}>
      <div style={{ padding: "24px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.white }}>AATU</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: MONO }}>Staff Portal</p>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
            <Icon name="close" size={22} />
          </button>
        )}
      </div>
      <nav style={{ flex: 1, padding: "16px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.label} onClick={() => { navigate(item.path); if (isMobile) onClose(); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
              color: isActive ? C.white : "rgba(255,255,255,0.7)", fontWeight: isActive ? 700 : 400,
              borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent",
              border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
              transition: "background 0.15s",
            }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.7)" }} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 8px" }}>
        <button onClick={() => navigate("/staff/profile")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "transparent", color: "rgba(255,255,255,0.7)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="account_circle" size={20} /> User Profile
        </button>
        <button onClick={() => supabase.auth.signOut().then(() => navigate("/login"))} style={{ width: "100%", marginTop: 4, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="logout" size={20} /> Logout
        </button>
      </div>
    </aside>
  );

  if (!isMobile) return <div style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50 }}>{content}</div>;
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, zIndex: 101, boxShadow: "4px 0 20px rgba(0,0,0,0.2)" }}>{content}</div>
    </>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
// FIX: previously referenced `location.pathname` without calling useLocation()
// inside this component — same bug as Sidebar. Also previously only showed 5
// of 6 items via .slice(0, 5); now maps all 5 real items with useLocation fixed.
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: CARD, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 60 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.path)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: isActive ? C.primaryContainer : C.onSurfaceVariant, fontSize: 9, fontFamily: MONO, padding: "4px 2px", minWidth: 0 }}
          >
            <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{item.shortLabel}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ onMenuClick, search, setSearch, isMobile }) {
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 32px", position: "sticky", top: 0, zIndex: 40, background: "color-mix(in srgb, var(--color-background) 94%, transparent)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 12 }}>
      {isMobile && (
        <button onClick={onMenuClick} style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurface, padding: 4, display: "flex" }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 380, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search monitor requests…" style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 99, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }} />
      </div>
    </header>
  );
}

// ─── Reject Reason Modal ──────────────────────────────────────────────────────
function RejectModal({ request, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <div onClick={!submitting ? onClose : undefined} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(460px, 95vw)", background: CARD, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", background: C.errorContainer, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="cancel" size={22} style={{ color: C.onErrorContainer }} filled />
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.onErrorContainer }}>Reject Request</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onErrorContainer, opacity: 0.85 }}>{request.title}</p>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
            Reason for rejection *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain what needs to change before this can be resubmitted…"
            rows={4}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: C.surfaceContainerLow, outline: "none", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: "9px 20px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={submitting || !reason.trim()}
            style={{ padding: "9px 22px", background: C.error, color: C.white, border: "none", borderRadius: 8, cursor: (submitting || !reason.trim()) ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: (submitting || !reason.trim()) ? 0.6 : 1 }}
          >
            {submitting ? "Sending…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req, onApprove, onReject, actingId }) {
  const isActing = actingId === req.id;
  return (
    <div style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={CATEGORY_ICONS[req.category] || "build"} size={21} style={{ color: C.primaryContainer }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>#{req.id.slice(0, 8)}</p>
            <h4 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 700, color: C.onSurface }}>{req.title}</h4>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onSurfaceVariant }}>
              Requested by {req.requesterName} ({req.requesterRole}) · {req.location}
            </p>
          </div>
        </div>
        <PriorityBadge priority={req.priority} />
      </div>

      {req.description && (
        <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.5, background: C.surfaceContainerLow, borderRadius: 8, padding: "10px 12px" }}>
          {req.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={() => onReject(req)}
          disabled={isActing}
          style={{ padding: "9px 18px", border: `1px solid ${C.error}`, borderRadius: 8, background: "none", color: C.error, cursor: isActing ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: isActing ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="close" size={15} /> Reject
        </button>
        <button
          onClick={() => onApprove(req)}
          disabled={isActing}
          style={{ padding: "9px 18px", background: "#396844", color: "#ffffff", border: "none", borderRadius: 8, cursor: isActing ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: isActing ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}
        >
          {isActing ? (
            <><Icon name="progress_activity" size={15} style={{ animation: "spin 0.8s linear infinite" }} /> Sending…</>
          ) : (
            <><Icon name="check" size={15} /> Approve & Send to Admin</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MonitorApprovals() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Fetch requests where THIS staff member is the assigned monitor ────────
  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          id, title, description, category, priority, location, department, created_at,
          requester:profiles!requests_created_by_fkey ( full_name, role )
        `)
        .eq("monitor_id", user.id)
        .eq("status", "Pending Monitor Approval")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests((data ?? []).map((r) => ({
        id:            r.id,
        title:         r.title,
        description:   r.description,
        category:      r.category,
        priority:      r.priority,
        location:      r.location,
        department:    r.department,
        requesterName: r.requester?.full_name ?? "Unknown",
        requesterRole: r.requester?.role === "hod" ? "HOD" : r.requester?.role === "dean" ? "Dean" : r.requester?.role ?? "user",
      })));
    } catch (err) {
      console.error("Monitor approvals fetch error:", err);
      showToast(`Failed to load requests: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── Real-time: new assignments appear instantly ───────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("staff-monitor-approvals")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests", filter: `monitor_id=eq.${user.id}` }, () => fetchRequests())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, fetchRequests]);

  // ── Approve — sends straight to Admin ──────────────────────────────────────
  async function handleApprove(req) {
    setActingId(req.id);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: "Pending",
          monitor_reviewed_at: new Date().toISOString(),
        })
        .eq("id", req.id);

      if (error) throw error;

      const { data: fullReq } = await supabase.from("requests").select("created_by").eq("id", req.id).single();
      if (fullReq?.created_by) {
        const { error: notifErr } = await supabase.from("notifications").insert({
          user_id: fullReq.created_by,
          type: "StatusUpdate",
          title: "Request Approved by Monitor",
          body: `${profile?.full_name ?? "Your monitor"} approved "${req.title}". It has been forwarded to the admin for technician assignment.`,
          read: false,
        });
        if (notifErr) console.error("Notification insert failed:", notifErr.message);
      }

      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins?.length) {
        const { error: adminNotifErr } = await supabase.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.id,
            type: "NewRequest",
            title: "New Approved Request",
            body: `"${req.title}" was approved by monitor ${profile?.full_name ?? ""} and needs technician assignment.`,
            read: false,
          }))
        );
        if (adminNotifErr) console.error("Admin notification insert failed:", adminNotifErr.message);
      }

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      showToast(`Approved and sent to admin: "${req.title}"`);
    } catch (err) {
      console.error("Approve error:", err);
      showToast(`Failed to approve: ${err.message}`);
    } finally {
      setActingId(null);
    }
  }

  // ── Reject — with reason, back to requester ────────────────────────────────
  async function handleReject(reason) {
    if (!rejectTarget) return;
    setActingId(rejectTarget.id);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          status: "Rejected by Monitor",
          monitor_reviewed_at: new Date().toISOString(),
          monitor_rejection_reason: reason.trim(),
        })
        .eq("id", rejectTarget.id);

      if (error) throw error;

      const { data: fullReq } = await supabase.from("requests").select("created_by").eq("id", rejectTarget.id).single();
      if (fullReq?.created_by) {
        const { error: notifErr } = await supabase.from("notifications").insert({
          user_id: fullReq.created_by,
          type: "StatusUpdate",
          title: "Request Rejected by Monitor",
          body: `${profile?.full_name ?? "Your monitor"} rejected "${rejectTarget.title}". Reason: ${reason.trim()}. Please review and resubmit with changes.`,
          read: false,
        });
        if (notifErr) console.error("Notification insert failed:", notifErr.message);
      }

      setRequests((prev) => prev.filter((r) => r.id !== rejectTarget.id));
      showToast(`Rejected: "${rejectTarget.title}"`);
      setRejectTarget(null);
    } catch (err) {
      console.error("Reject error:", err);
      showToast(`Failed to reject: ${err.message}`);
    } finally {
      setActingId(null);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) =>
      !q || [r.title, r.requesterName, r.category, r.location].some((f) => f?.toLowerCase().includes(q))
    );
  }, [requests, search]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{ marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column", paddingBottom: isMobile ? 64 : 0, minWidth: 0 }}>
        <TopBar onMenuClick={() => setDrawerOpen(true)} search={search} setSearch={setSearch} isMobile={isMobile} />

        <div style={{ flex: 1, padding: isMobile ? "20px 16px 40px" : "32px", maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>Monitor Approvals</h1>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
                Requests submitted by HODs and Deans that need your review before reaching the admin.
              </p>
            </div>
            <button
              onClick={() => navigate("/staff/monitored-requests")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: CARD, cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurfaceVariant, flexShrink: 0 }}
            >
              <Icon name="history" size={16} />
              View Full History
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 130, background: C.surfaceContainerLow, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", background: CARD, borderRadius: 14, border: `1px solid ${C.outlineVariant}` }}>
              <Icon name="fact_check" size={44} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                {requests.length === 0 ? "No requests awaiting your review" : "No requests match your search"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>
                {requests.length === 0 ? "You'll see requests here when an HOD or Dean assigns you as monitor." : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  actingId={actingId}
                  onApprove={handleApprove}
                  onReject={setRejectTarget}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {isMobile && <BottomNav />}

      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          submitting={actingId === rejectTarget.id}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 76 : 24, left: "50%", transform: "translateX(-50%)", background: "var(--color-inverse-surface)", color: "var(--color-inverse-on-surface)", padding: "12px 24px", borderRadius: 30, fontSize: 13, fontFamily: MONO, zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxWidth: "90vw", textAlign: "center" }}>
          {toast}
        </div>
      )}
    </div>
  );
}