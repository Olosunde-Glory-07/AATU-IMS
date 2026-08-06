import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primaryContainer:     "var(--color-primary-container)",
  onPrimaryContainer:   "var(--color-on-primary-container)",
  secondary:            "var(--color-secondary)",
  secondaryContainer:   "var(--color-secondary-container)",
  onSecondaryContainer: "var(--color-on-secondary-container)",
  tertiaryFixed:        "var(--color-tertiary-fixed)",
  onTertiaryFixedVariant:"var(--color-on-tertiary-fixed-variant)",
  errorContainer:       "var(--color-error-container)",
  onErrorContainer:     "var(--color-on-error-container)",
  error:                "var(--color-error)",
  surface:              "var(--color-background)",
  surfaceContainer:     "var(--color-surface-container)",
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
  { icon: "dashboard",     label: "Dashboard",           path: "/staff/dashboard"            },
  { icon: "list_alt",      label: "Requests",            path: "/staff/maintenance-requests" },
  { icon: "fact_check",    label: "Approvals",           path: "/staff/monitor-approvals"    },
  { icon: "history",       label: "History",             path: "/staff/monitored-requests"   },
  { icon: "domain",        label: "Dept.",                path: "/staff/departmental-history"  },
  { icon: "notifications", label: "Alerts",               path: "/staff/notifications"        },
];

const CATEGORY_ICONS = {
  Electrical: "bolt", Plumbing: "water_drop", HVAC: "hvac", Structural: "domain",
  "IT Services": "router", Furniture: "chair", Lighting: "light_mode",
  Elevator: "elevator", Other: "build",
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

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
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
        <button onClick={() => navigate("/staff/profile")} style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          background: "transparent", color: "rgba(255,255,255,0.7)", border: "none",
          cursor: "pointer", fontSize: 12, fontFamily: MONO,
        }}>
          <Icon name="account_circle" size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          User Profile
        </button>
        <button onClick={() => supabase.auth.signOut().then(() => navigate("/login"))} style={{
          width: "100%", marginTop: 4, display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
          background: "transparent", color: "rgba(255,255,255,0.5)", border: "none",
          cursor: "pointer", fontSize: 12, fontFamily: MONO,
        }}>
          <Icon name="logout" size={20} style={{ color: "rgba(255,255,255,0.5)" }} />
          Logout
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

// ─── Bottom Nav — FIX: now shows all 6 items (was previously sliced to 5,
// silently dropping "Notifications"), with tighter sizing so they all fit ──
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
              fontSize: 8, fontFamily: MONO, padding: "4px 2px",
              minWidth: 0,
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

function TopBar({ isMobile, onMenu, onRefresh, refreshing }) {
  const navigate = useNavigate();
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 32px", position: "sticky", top: 0, zIndex: 40, background: "color-mix(in srgb, var(--color-background) 94%, transparent)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {isMobile && (
          <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurface, padding: 4, display: "flex" }}>
            <Icon name="menu" size={24} />
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Staff Dashboard</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onRefresh} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
          <Icon name="refresh" size={20} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
        </button>
        <button onClick={() => navigate("/staff/notifications")} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
          <Icon name="notifications" size={22} />
        </button>
      </div>
    </header>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, loading, onClick }) {
  return (
    <div onClick={onClick} style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 20, cursor: onClick ? "pointer" : "default", display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow 0.15s" }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ width: 42, height: 42, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={21} filled style={{ color: iconColor }} />
      </div>
      {loading
        ? <div style={{ width: 44, height: 26, background: C.surfaceContainerHigh, borderRadius: 6 }} />
        : <h3 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.onSurface }}>{value}</h3>}
      <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffDashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    unreadNotifs: 0,
  });

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  const fetchDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: pending }, { count: approvedCount }, { count: rejectedCount }, { count: unreadNotifs }] = await Promise.all([
        supabase
          .from("requests")
          .select(`
            id, title, category, priority, location, created_at,
            requester:profiles!requests_created_by_fkey ( full_name, role )
          `)
          .eq("monitor_id", user.id)
          .eq("status", "Pending Monitor Approval")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("requests").select("id", { count: "exact", head: true }).eq("monitor_id", user.id).not("status", "eq", "Pending Monitor Approval").not("status", "eq", "Rejected by Monitor"),
        supabase.from("requests").select("id", { count: "exact", head: true }).eq("monitor_id", user.id).eq("status", "Rejected by Monitor"),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
      ]);

      setPendingApprovals((pending ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        priority: r.priority,
        location: r.location,
        requesterName: r.requester?.full_name ?? "Unknown",
        requesterRole: r.requester?.role === "hod" ? "HOD" : r.requester?.role === "dean" ? "Dean" : r.requester?.role,
      })));

      setStats({
        pendingCount: pending?.length ?? 0,
        approvedCount: approvedCount ?? 0,
        rejectedCount: rejectedCount ?? 0,
        unreadNotifs: unreadNotifs ?? 0,
      });
    } catch (err) {
      console.error("Staff dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("staff-dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests", filter: `monitor_id=eq.${user.id}` }, () => fetchDashboard())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, fetchDashboard]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{ marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column", paddingBottom: isMobile ? 64 : 0, minWidth: 0 }}>
        <TopBar isMobile={isMobile} onMenu={() => setDrawerOpen(true)} onRefresh={handleRefresh} refreshing={refreshing} />

        <div style={{ flex: 1, padding: isMobile ? "20px 16px 40px" : "32px", maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

          <div style={{ marginBottom: 28 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700 }}>{getGreeting()}, {firstName}</h2>
            <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Here's what needs your attention as a monitor today.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 12 : 20, marginBottom: 32 }}>
            <StatCard
              icon="fact_check" iconBg={C.tertiaryFixed} iconColor={C.onTertiaryFixedVariant}
              label="Awaiting Your Review" value={stats.pendingCount} loading={loading}
              onClick={() => navigate("/staff/monitor-approvals")}
            />
            <StatCard
              icon="check_circle" iconBg="#DCFCE7" iconColor="#166534"
              label="Approved (Total)" value={stats.approvedCount} loading={loading}
              onClick={() => navigate("/staff/monitored-requests")}
            />
            <StatCard
              icon="cancel" iconBg={C.errorContainer} iconColor={C.error}
              label="Rejected (Total)" value={stats.rejectedCount} loading={loading}
              onClick={() => navigate("/staff/monitored-requests")}
            />
            <StatCard
              icon="notifications" iconBg={C.secondaryContainer} iconColor={C.secondary}
              label="Unread Notifications" value={stats.unreadNotifs} loading={loading}
              onClick={() => navigate("/staff/notifications")}
            />
          </div>

          <div style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Pending Your Review</h3>
              <button onClick={() => navigate("/staff/monitor-approvals")} style={{ background: "none", border: "none", cursor: "pointer", color: C.primaryContainer, fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
                View All →
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map((i) => <div key={i} style={{ height: 60, background: C.surfaceContainerLow, borderRadius: 8 }} />)}
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <Icon name="fact_check" size={36} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 10px" }} />
                <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant }}>No requests waiting on your review.</p>
              </div>
            ) : (
              <div>
                {pendingApprovals.map((r) => (
                  <div key={r.id} onClick={() => navigate("/staff/monitor-approvals")} style={{ padding: "14px 20px", borderBottom: `1px solid ${C.outlineVariant}`, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon name={CATEGORY_ICONS[r.category] || "build"} size={19} style={{ color: C.primaryContainer }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onSurfaceVariant }}>{r.requesterName} ({r.requesterRole}) · {r.location}</p>
                    </div>
                    <Icon name="chevron_right" size={18} style={{ color: C.onSurfaceVariant, flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Quick Links</h3>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
              {[
                { icon: "fact_check", label: "Monitor Approvals", path: "/staff/monitor-approvals" },
                { icon: "history",    label: "Request History",   path: "/staff/monitored-requests" },
                { icon: "list_alt",   label: "Maintenance Requests", path: "/staff/maintenance-requests" },
                { icon: "domain",     label: "Departmental History", path: "/staff/departmental-history" },
              ].map((a) => (
                <button key={a.label} onClick={() => navigate(a.path)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", color: C.onSurface, fontSize: 13, fontFamily: SANS, textAlign: "left" }}>
                  <Icon name={a.icon} size={18} style={{ color: C.primaryContainer }} />
                  {a.label}
                  <Icon name="chevron_right" size={16} style={{ color: C.onSurfaceVariant, marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}