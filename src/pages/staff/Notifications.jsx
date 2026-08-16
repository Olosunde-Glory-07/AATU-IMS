import { useState, useEffect, useMemo, useCallback } from "react";
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
  surfaceContainerLow:  "var(--color-surface-container-low)",
  surfaceContainerHigh: "var(--color-surface-container-high)",
  onSurface:            "var(--color-on-surface)",
  onSurfaceVariant:     "var(--color-on-surface-variant)",
  outlineVariant:        "var(--color-outline-variant)",
  outline:               "var(--color-outline)",
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

// Notification type styling — matches the types actually inserted elsewhere
// in the app (MonitorApprovals uses StatusUpdate/NewRequest; admin/create-user
// use Memo; job assignment flows use Assigned/Completed/Emergency).
const TYPE_CFG = {
  StatusUpdate: { iconBg: "#EEF2FF",          iconColor: "#4338ca", icon: "update",             dotColor: "#6366f1" },
  NewRequest:   { iconBg: C.tertiaryFixed,    iconColor: C.onTertiaryFixedVariant, icon: "inbox", dotColor: "#f59e0b" },
  Assigned:     { iconBg: C.secondaryContainer, iconColor: C.secondary, icon: "assignment",       dotColor: C.secondary },
  Completed:    { iconBg: "#DCFCE7",          iconColor: "#166534", icon: "check_circle",       dotColor: C.secondary },
  Emergency:    { iconBg: C.errorContainer,   iconColor: C.error,   icon: "priority_high",      dotColor: C.error },
  Memo:         { iconBg: C.surfaceContainerHigh, iconColor: C.onSurfaceVariant, icon: "info",  dotColor: C.outline },
};
const DEFAULT_TYPE_CFG = TYPE_CFG.Memo;

function timeAgo(iso) {
  if (!iso) return "—";
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

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
              fontSize: 9, fontFamily: MONO, padding: "4px 2px", minWidth: 0,
            }}
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
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 440, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notifications…"
          style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9, background: C.surfaceContainerLow, border: "none", borderRadius: 8, fontSize: 14, outline: "none", color: C.onSurface, fontFamily: SANS, boxSizing: "border-box" }}
        />
      </div>
    </header>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────
function NotifItem({ notif, onMarkRead, isMobile }) {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CFG[notif.type] || DEFAULT_TYPE_CFG;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => notif.unread && onMarkRead(notif.id)}
      style={{
        padding: isMobile ? "16px" : "20px 24px",
        borderBottom: `1px solid ${C.outlineVariant}`,
        display: "flex", gap: isMobile ? 12 : 16,
        background: hov ? C.surfaceContainerLow : "transparent",
        transition: "background 0.15s", cursor: "pointer", position: "relative",
      }}
    >
      {notif.unread && (
        <div style={{ position: "absolute", left: isMobile ? 6 : 8, top: isMobile ? 22 : "50%", transform: isMobile ? "none" : "translateY(-50%)", width: 7, height: 7, borderRadius: "50%", background: cfg.dotColor }} />
      )}

      <div style={{ width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: "50%", flexShrink: 0, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: notif.unread ? 6 : 0 }}>
        <Icon name={cfg.icon} size={isMobile ? 17 : 20} filled style={{ color: cfg.iconColor }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <h4 style={{ margin: 0, fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{notif.title}</h4>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, opacity: 0.7, whiteSpace: "nowrap" }}>{timeAgo(notif.created_at)}</span>
            {notif.unread && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, fontFamily: MONO, fontWeight: 700, color: C.primaryContainer, padding: 0, opacity: isMobile || hov ? 1 : 0, transition: "opacity 0.15s", whiteSpace: "nowrap" }}
              >
                Mark read
              </button>
            )}
          </div>
        </div>
        <p style={{ margin: "5px 0 0", fontSize: isMobile ? 12 : 13, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{notif.body}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffNotifications() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // ── Fetch real notifications for this staff member ────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setNotifications((data ?? []).map((n) => ({ ...n, unread: !n.read })));
    } catch (err) {
      console.error("Notifications fetch error:", err);
      showToast(`Failed to load notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── Real-time: new notifications appear instantly ─────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("staff-notifications-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [{ ...payload.new, unread: !payload.new.read }, ...prev]);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false, read: true } : n)));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) {
      console.error("Mark read error:", error.message);
      fetchNotifications();
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => n.unread).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false, read: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    if (error) {
      console.error("Mark all read error:", error.message);
      fetchNotifications();
      return;
    }
    showToast("All notifications marked as read.");
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notifications.filter((n) => {
      const tabOk = tab === "All" || (tab === "Unread" && n.unread);
      const searchOk = !q || [n.title, n.body, n.type].some((f) => f?.toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [notifications, tab, search]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{ marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column", paddingBottom: isMobile ? 64 : 0, minWidth: 0 }}>
        <TopBar onMenuClick={() => setDrawerOpen(true)} search={search} setSearch={setSearch} isMobile={isMobile} />

        <div style={{ flex: 1, padding: isMobile ? "20px 16px 40px" : "32px", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: 14, marginBottom: 24 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700 }}>Notifications</h1>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Alerts about requests assigned to you and your monitoring activity.</p>
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              style={{ padding: "9px 18px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: CARD, color: C.onSurface, cursor: unreadCount === 0 ? "default" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, opacity: unreadCount === 0 ? 0.5 : 1, flexShrink: 0 }}
            >
              <Icon name="done_all" size={15} />
              Mark all read
              {unreadCount > 0 && (
                <span style={{ background: C.primaryContainer, color: C.white, borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "1px 6px", fontFamily: MONO }}>{unreadCount}</span>
              )}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {["All", "Unread"].map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700, fontFamily: MONO, border: "none", cursor: "pointer", background: tab === t ? C.primaryContainer : C.surfaceContainerHigh, color: tab === t ? C.white : C.onSurfaceVariant }}>
                {t}{t === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            ))}
          </div>

          <div style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map((i) => <div key={i} style={{ height: 70, background: C.surfaceContainerLow, borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: isMobile ? 40 : 60, textAlign: "center", color: C.onSurfaceVariant, fontSize: 14 }}>
                <Icon name="notifications_off" size={36} style={{ display: "block", margin: "0 auto 12px", color: C.outlineVariant }} />
                {notifications.length === 0 ? "No notifications yet." : "No notifications match your filters."}
              </div>
            ) : (
              <div>
                {filtered.map((notif) => (
                  <NotifItem key={notif.id} notif={notif} onMarkRead={markRead} isMobile={isMobile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 76 : 24, left: "50%", transform: "translateX(-50%)", background: "var(--color-inverse-surface)", color: "var(--color-inverse-on-surface)", padding: "12px 24px", borderRadius: 30, fontSize: 13, fontFamily: MONO, zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxWidth: "90vw", textAlign: "center" }}>
          {toast}
        </div>
      )}
    </div>
  );
}