import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primaryContainer:     "var(--color-primary-container)",
  secondary:            "var(--color-secondary)",
  secondaryContainer:   "var(--color-secondary-container)",
  onSecondaryContainer: "var(--color-on-secondary-container)",
  tertiaryFixed:        "var(--color-tertiary-fixed)",
  onTertiaryFixedVariant:"var(--color-on-tertiary-fixed-variant)",
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

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",  path: "/staff/dashboard"            },
  { icon: "list_alt",      label: "Requests",   path: "/staff/maintenance-requests" },
  { icon: "fact_check",    label: "Approvals",  path: "/staff/monitor-approvals"    },
  { icon: "history",       label: "History",    path: "/staff/monitored-requests"   },
  { icon: "domain",        label: "Dept.",      path: "/staff/departmental-history"  },
  { icon: "notifications", label: "Alerts",     path: "/staff/notifications"        },
];

const STATUS_CFG = {
  "Pending Monitor Approval": { bg: C.tertiaryFixed, text: C.onTertiaryFixedVariant },
  "Rejected by Monitor":      { bg: C.errorContainer, text: C.error },
  Pending:                    { bg: "#FEF3C7", text: "#b45309" },
  Assigned:                   { bg: "#EEF2FF", text: "#4338ca" },
  Completed:                  { bg: "#DCFCE7", text: "#166534" },
};

const CATEGORY_ICONS = {
  HVAC: "hvac", Electrical: "bolt", Plumbing: "water_drop", Structural: "domain",
  "IT Services": "router", Furniture: "chair", Lighting: "light_mode",
  Elevator: "elevator", Other: "build",
};

const TABS = ["All", "Pending Monitor Approval", "Rejected by Monitor", "Pending", "Assigned", "Completed"];

function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mob;
}

function Icon({ name, size = 22, filled = false, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, verticalAlign: "middle", fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400", ...style }}>{name}</span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
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
            }}>
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
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer",
              color: isActive ? C.primaryContainer : C.onSurfaceVariant,
              fontSize: 8, fontFamily: MONO, padding: "4px 2px", minWidth: 0,
            }}
          >
            <Icon name={item.icon} size={18} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ isMobile, onMenu, search, setSearch }) {
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 32px", position: "sticky", top: 0, zIndex: 40, background: "color-mix(in srgb, var(--color-background) 94%, transparent)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 10 }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurface, padding: 4, display: "flex", flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 380, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
          style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 99, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box" }}
        />
      </div>
      {!isMobile && (
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface, whiteSpace: "nowrap" }}>Request History</h2>
      )}
    </header>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MonitoredRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          id, title, category, priority, status, location, created_at,
          monitor_rejection_reason,
          requester:profiles!requests_created_by_fkey ( full_name, role )
        `)
        .eq("monitor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests((data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        priority: r.priority,
        status: r.status,
        location: r.location,
        rejectionReason: r.monitor_rejection_reason,
        requesterName: r.requester?.full_name ?? "Unknown",
        requesterRole: r.requester?.role === "hod" ? "HOD" : r.requester?.role === "dean" ? "Dean" : r.requester?.role,
        date: new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      })));
    } catch (err) {
      console.error("Monitored requests fetch error:", err);
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("staff-monitored-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests", filter: `monitor_id=eq.${user.id}` }, () => fetchRequests())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, fetchRequests]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const tabOk = tab === "All" || r.status === tab;
      const searchOk = !q || [r.title, r.requesterName, r.category, r.location].some((f) => f?.toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [requests, tab, search]);

  const go = useCallback((path) => navigate(path), [navigate]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{ marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column", paddingBottom: isMobile ? 64 : 0, minWidth: 0 }}>
        <TopBar isMobile={isMobile} onMenu={() => setDrawerOpen(true)} search={search} setSearch={setSearch} />

        <div style={{ flex: 1, padding: isMobile ? "20px 16px 40px" : "32px", maxWidth: 1000, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 26, fontWeight: 700 }}>Monitored Requests</h1>
            <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
              Full history of every request you've reviewed as monitor.
            </p>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18, overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", paddingBottom: isMobile ? 4 : 0 }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: MONO, border: "none", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, background: tab === t ? C.primaryContainer : C.surfaceContainerHigh, color: tab === t ? C.white : C.onSurfaceVariant }}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 76, background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", background: CARD, borderRadius: 14, border: `1px solid ${C.outlineVariant}` }}>
              <Icon name="fact_check" size={40} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 10px" }} />
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
                {requests.length === 0 ? "No requests assigned to you as monitor yet." : "No requests match your filters."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((r) => {
                const cfg = STATUS_CFG[r.status] || STATUS_CFG.Pending;
                return (
                  <div key={r.id} style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={CATEGORY_ICONS[r.category] || "build"} size={20} style={{ color: C.primaryContainer }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{r.title}</h4>
                        <span style={{ padding: "2px 9px", borderRadius: 4, background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, flexShrink: 0 }}>{r.status}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
                        {r.requesterName} ({r.requesterRole}) · {r.location} · {r.date}
                      </p>
                      {r.rejectionReason && (
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: C.error, background: C.errorContainer, padding: "6px 10px", borderRadius: 6 }}>
                          Your reason: {r.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}