import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  onPrimaryContainer:     "#d26a5f",
  primaryFixed:           "#ffdad5",
  primaryFixedDim:        "#ffb4aa",
  onPrimaryFixed:         "#410001",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
  secondaryFixed:         "#bbefc1",
  tertiaryFixed:          "#ffdcc3",
  onTertiaryFixedVariant: "#6e3900",
  errorContainer:         "#ffdad6",
  onErrorContainer:       "#93000a",
  error:                  "#ba1a1a",
  surface:                "#f9f9ff",
  surfaceContainer:       "#e7eefe",
  surfaceContainerLow:    "#f0f3ff",
  surfaceContainerHigh:   "#e2e8f8",
  surfaceContainerHighest:"#dce2f3",
  surfaceContainerLowest: "#ffffff",
  surfaceDim:             "#d3daea",
  onSurface:              "#151c27",
  onSurfaceVariant:       "#554240",
  outlineVariant:         "#dcc0bd",
  outline:                "#89726f",
  white:                  "#ffffff",
};
const MONO = "'JetBrains Mono', monospace";
const SANS = "'Hanken Grotesk', sans-serif";

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/staff/dashboard" },
  { icon: "list_alt",      label: "Requests",      path: "/staff/maintenance-requests" },
  { icon: "history",       label: "Dept. History", path: "/staff/departmental-history" },
  { icon: "notifications", label: "Notifications", path: "/staff/notifications" },
];

// ─── Notification type config (styling only — not records) ───────────────────
const TYPE_CFG = {
  Emergency:   { iconBg: C.errorContainer,      iconColor: C.error,               icon: "priority_high", dotColor: C.error     },
  Completed:   { iconBg: "#DCFCE7",             iconColor: "#166534",             icon: "check_circle",  dotColor: C.secondary },
  Maintenance: { iconBg: C.tertiaryFixed,        iconColor: C.onTertiaryFixedVariant, icon: "calendar_month", dotColor: "#f59e0b" },
  Assigned:    { iconBg: C.surfaceContainerHigh, iconColor: C.primaryContainer,    icon: "assignment",    dotColor: "#6366f1"   },
  Info:        { iconBg: C.surfaceContainerHigh, iconColor: C.onSurfaceVariant,    icon: "info",          dotColor: C.outline   },
};

const TAG_CFG = {
  Emergency:   { bg: C.errorContainer,    text: C.onErrorContainer    },
  Completed:   { bg: "#DCFCE7",           text: "#166534"             },
  Maintenance: { bg: "#FEF3C7",           text: "#92400E"             },
  Assigned:    { bg: "#EEF2FF",           text: "#3730A3"             },
  Info:        { bg: C.surfaceContainer,  text: C.onSurfaceVariant    },
};

const TABS = ["All Alerts", "Requests", "Maintenance"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Icon({ name, size = 22, filled = false, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size, lineHeight: 1, verticalAlign: "middle",
        fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400",
        ...style,
      }}
    >{name}</span>
  );
}

// ─── Responsive hook ──────────────────────────────────────────────────────────
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
    <aside style={{
      width: 260, background: C.primaryContainer, color: C.white,
      display: "flex", flexDirection: "column", height: "100%",
      overflowY: "auto", borderRight: `1px solid ${C.outlineVariant}`,
      fontFamily: SANS,
    }}>
      <div style={{ padding: "24px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.white, letterSpacing: "-0.02em" }}>AATU</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: MONO, letterSpacing: "0.04em" }}>
            Infrastructure Mgmt
          </p>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4 }}>
            <Icon name="close" size={22} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: "16px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px",
                background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                color: isActive ? C.white : "rgba(255,255,255,0.7)",
                fontWeight: isActive ? 700 : 400,
                borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
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
        <button
          onClick={() => navigate("/staff/dashboard")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", background: "transparent",
            color: "rgba(255,255,255,0.7)", border: "none",
            cursor: "pointer", fontSize: 12, fontFamily: MONO,
            transition: "background 0.15s",
          }}
        >
          <Icon name="account_circle" size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          User Profile
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%", marginTop: 8, padding: "8px 16px",
            background: "rgba(255,255,255,0.10)", color: C.white,
            border: "none", borderRadius: 6, cursor: "pointer",
            fontSize: 12, fontFamily: MONO, letterSpacing: "0.04em", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.10)"}
        >
          Logout
        </button>
      </div>
    </aside>
  );

  if (!isMobile) {
    return <div style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50 }}>{content}</div>;
  }

  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, zIndex: 101, boxShadow: "4px 0 20px rgba(0,0,0,0.2)" }}>
        {content}
      </div>
    </>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: C.white, borderTop: `1px solid ${C.outlineVariant}`,
      display: "flex", height: 60,
    }}>
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer",
              color: isActive ? C.primaryContainer : C.onSurfaceVariant,
              fontSize: 9, fontFamily: MONO, letterSpacing: "0.06em",
            }}
          >
            <Icon name={item.icon} size={22} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
function TopBar({ onMenuClick, search, setSearch }) {
  const isMobile = useIsMobile();
  return (
    <header style={{
      height: 64, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 32px",
      position: "sticky", top: 0, zIndex: 40,
      background: "rgba(249,249,255,0.94)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {isMobile && (
          <button onClick={onMenuClick} style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurface, padding: 4, flexShrink: 0, display: "flex" }}>
            <Icon name="menu" size={24} />
          </button>
        )}
        <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 440, position: "relative" }}>
          <Icon name="search" size={20} style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: C.onSurfaceVariant,
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            style={{
              width: "100%", paddingLeft: 40, paddingRight: 16,
              paddingTop: 9, paddingBottom: 9,
              background: C.surfaceContainerLow,
              border: "none", borderRadius: 99,
              fontSize: 14, outline: "none",
              color: C.onSurface, fontFamily: SANS, boxSizing: "border-box",
              transition: "box-shadow 0.15s",
            }}
            onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${C.primaryFixedDim}`}
            onBlur={(e) => e.target.style.boxShadow = "none"}
          />
        </div>
      </div>

      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 8, color: C.onSurfaceVariant, borderRadius: "50%", display: "flex",
            transition: "background 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainer}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <Icon name="settings" size={22} />
          </button>
          <div style={{ width: 1, height: 28, background: C.outlineVariant }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.onSurface, lineHeight: 1.2 }}>Staff Services</p>
            <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO }}>Infrastructure Mgmt</p>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: C.surfaceContainerHighest,
            border: `1px solid ${C.outlineVariant}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: C.onSurface, fontSize: 14,
          }}>S</div>
        </div>
      )}
    </header>
  );
}

// ─── Pulse Dot ────────────────────────────────────────────────────────────────
function PulseDot({ color = C.secondaryFixed, size = 8 }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, flexShrink: 0,
      opacity: on ? 1 : 0.3, transition: "opacity 0.5s ease",
    }} />
  );
}

// ─── Overview Panel — live counts, no hardcoded numbers ───────────────────────
function OverviewPanel({ notifications, isMobile }) {
  const critical = notifications.filter((n) => n.type === "Emergency").length;
  const pending  = notifications.filter((n) => n.unread).length;

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: 16, flexWrap: "wrap" }}>
      {/* Metrics card */}
      <div style={{
        background: C.white, border: `1px solid ${C.outlineVariant}`,
        borderRadius: 14, padding: 24, flex: isMobile ? "1 1 100%" : "initial",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <span style={{
            fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant,
            letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7,
          }}>Overview</span>
          <Icon name="analytics" size={20} style={{ color: C.primaryContainer }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: C.errorContainer, borderRadius: 10, padding: "16px 14px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: C.onErrorContainer, fontFamily: SANS }}>
              {String(critical).padStart(2, "0")}
            </p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onErrorContainer, opacity: 0.8 }}>Critical</p>
          </div>
          <div style={{ background: C.secondaryContainer, borderRadius: 10, padding: "16px 14px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: C.onSecondaryContainer, fontFamily: SANS }}>
              {String(pending).padStart(2, "0")}
            </p>
            <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSecondaryContainer, opacity: 0.8 }}>Unread</p>
          </div>
        </div>
      </div>

      {/* Monitoring status card — desktop only, decorative */}
      {!isMobile && (
        <div style={{
          background: C.primaryContainer, borderRadius: 14,
          padding: 24, position: "relative", overflow: "hidden",
          minHeight: 180, display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          {[160, 220, 280].map((s, i) => (
            <div key={i} style={{
              position: "absolute", right: -60 + i * 10, bottom: -60 + i * 10,
              width: s, height: s, borderRadius: "50%",
              border: "1px solid rgba(255,180,170,0.12)", pointerEvents: "none",
            }} />
          ))}
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <PulseDot />
              <span style={{ fontSize: 10, fontFamily: MONO, fontWeight: 700, color: C.secondaryFixed, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Active Monitoring
              </span>
            </div>
            <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: C.white }}>
              Departmental Dashboard Visualizer
            </h4>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.70)", lineHeight: 1.5 }}>
              Real-time tracking of infrastructure health and notification streams.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────
function NotifItem({ notif, onMarkRead, searchTerm, isMobile }) {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CFG[notif.type] || TYPE_CFG.Info;

  const highlighted = searchTerm && (
    notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notif.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => notif.unread && onMarkRead(notif.id)}
      style={{
        padding: isMobile ? "16px 16px" : "20px 24px",
        borderBottom: `1px solid ${C.outlineVariant}`,
        display: "flex", gap: isMobile ? 12 : 16,
        background: highlighted
          ? `${C.surfaceContainer}60`
          : hov ? C.surfaceContainerLow : "transparent",
        transition: "background 0.15s",
        cursor: "pointer",
        position: "relative",
      }}
    >
      {notif.unread && (
        <div style={{
          position: "absolute", left: isMobile ? 6 : 8, top: isMobile ? 22 : "50%", transform: isMobile ? "none" : "translateY(-50%)",
          width: 7, height: 7, borderRadius: "50%",
          background: cfg.dotColor,
        }} />
      )}

      <div style={{
        width: isMobile ? 36 : 42, height: isMobile ? 36 : 42, borderRadius: "50%", flexShrink: 0,
        background: cfg.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginLeft: notif.unread ? 6 : 0,
      }}>
        <Icon name={cfg.icon} size={isMobile ? 17 : 20} filled style={{ color: cfg.iconColor }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <h4 style={{ margin: 0, fontSize: isMobile ? 13 : 14, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>
            {notif.title}
          </h4>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, opacity: 0.7, whiteSpace: "nowrap" }}>
              {notif.time}
            </span>
            {notif.unread && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkRead(notif.id); }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 10, fontFamily: MONO, fontWeight: 700,
                  color: C.primaryContainer, padding: 0,
                  opacity: isMobile || hov ? 1 : 0, transition: "opacity 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                Mark read
              </button>
            )}
          </div>
        </div>

        <p style={{ margin: "5px 0 10px", fontSize: isMobile ? 12 : 13, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
          {notif.body}
        </p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {notif.tags.map((tag, i) => {
            const tagCfg = TAG_CFG[tag.type] || TAG_CFG.Info;
            return (
              <span key={i} style={{
                padding: "2px 9px", borderRadius: 4,
                background: tagCfg.bg, color: tagCfg.text,
                fontSize: 10, fontWeight: 700, fontFamily: MONO,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>{tag.label}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Automated Maintenance Banner ─────────────────────────────────────────────
function MaintenanceBanner({ onReviewSchedule, isMobile }) {
  return (
    <section style={{
      background: C.primaryContainer, borderRadius: 14,
      padding: isMobile ? "24px 20px" : "36px 40px", position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", gap: isMobile ? 24 : 40, flexWrap: "wrap",
    }}>
      {!isMobile && (
        <div style={{
          position: "absolute", right: -80, bottom: -80,
          width: 320, height: 320,
          background: "rgba(255,255,255,0.05)",
          borderRadius: "50%", filter: "blur(40px)",
          pointerEvents: "none",
        }} />
      )}

      <div style={{ flex: 1, minWidth: 220, position: "relative", zIndex: 1 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.white }}>
          Automated Maintenance Schedule
        </h3>
        <p style={{ margin: "0 0 24px", fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.80)", lineHeight: 1.65, maxWidth: 540 }}>
          Our predictive maintenance engine analyses asset health data and adds scheduled tasks to your queue to help prevent infrastructure degradation. New tasks will appear here once generated.
        </p>
        <button onClick={onReviewSchedule} style={{
          padding: "11px 24px", background: C.white,
          color: C.primaryContainer, border: "none", borderRadius: 8,
          cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: SANS,
          transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.90"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          Review Schedule
        </button>
      </div>

      {!isMobile && (
        <div style={{
          width: 220, flexShrink: 0, position: "relative", zIndex: 1,
          background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <PulseDot />
            <span style={{ fontSize: 9, fontFamily: MONO, fontWeight: 700, color: C.secondaryFixed, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Active Monitoring
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
            Asset health metrics will appear here once monitoring data is connected.
          </p>
          <div style={{
            marginTop: 12, background: "rgba(255,255,255,0.08)", borderRadius: 4,
            padding: "4px 8px", fontSize: 9, fontFamily: MONO, color: "rgba(255,255,255,0.75)",
          }}>
            SYS_ID: AWAITING_DATA
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffNotificationsPage() {
  const isMobile = useIsMobile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("All Alerts");
  const [toast, setToast]         = useState(null);

  // Starts empty — populate from Supabase. No test data.
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    ["aatu-fonts", "aatu-icons"].forEach((id, i) => {
      if (!document.getElementById(id)) {
        const el = document.createElement("link");
        el.id  = id;
        el.rel = "stylesheet";
        el.href = i === 0
          ? "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          : "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
        document.head.appendChild(el);
      }
    });
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const markRead    = (id) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast("All notifications marked as read.");
  };

  const filtered = useMemo(() => notifications.filter((n) => {
    const tabOk    = activeTab === "All Alerts" || n.tab === activeTab;
    const q        = search.toLowerCase();
    const searchOk = !q || [n.title, n.body, n.type].some((f) => f.toLowerCase().includes(q));
    return tabOk && searchOk;
  }), [notifications, activeTab, search]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{
        marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column",
        paddingBottom: isMobile ? 60 : 0, minWidth: 0,
      }}>
        <TopBar onMenuClick={() => setDrawerOpen(true)} search={search} setSearch={setSearch} />

        <div style={{
          flex: 1, padding: isMobile ? "20px 16px 40px" : "32px 32px 48px",
          maxWidth: 1600, width: "100%", margin: "0 auto", boxSizing: "border-box",
        }}>

          {/* Page Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            gap: 16, marginBottom: isMobile ? 20 : 28,
          }}>
            <div>
              <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.primary }}>
                System Notifications
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
                Stay updated with facility requests, asset health, and administrative approvals.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto" }}>
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                style={{
                  padding: "9px 18px",
                  border: `1px solid ${C.outlineVariant}`,
                  borderRadius: 8, background: C.white,
                  color: C.onSurface, cursor: unreadCount === 0 ? "default" : "pointer",
                  fontSize: 12, fontFamily: MONO, fontWeight: 700,
                  display: "flex", alignItems: "center", gap: 6,
                  opacity: unreadCount === 0 ? 0.5 : 1, flex: isMobile ? 1 : "initial",
                  justifyContent: "center",
                }}
              >
                <Icon name="done_all" size={15} />
                {!isMobile && "Mark all as read"}
                {unreadCount > 0 && (
                  <span style={{
                    background: C.primaryContainer, color: C.white,
                    borderRadius: 99, fontSize: 9, fontWeight: 700,
                    padding: "1px 6px", fontFamily: MONO,
                  }}>{unreadCount}</span>
                )}
              </button>
              <button
                onClick={() => showToast("Use the search bar and tabs above to filter notifications.")}
                style={{
                  padding: "9px 18px", background: C.primaryContainer, color: C.white,
                  border: "none", borderRadius: 8, cursor: "pointer",
                  fontSize: 12, fontFamily: MONO, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  flex: isMobile ? 1 : "initial",
                }}
              >
                <Icon name="filter_list" size={15} style={{ color: C.white }} />
                {isMobile ? "Filter" : "Filter View"}
              </button>
            </div>
          </div>

          {/* Bento Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "300px 1fr",
            gap: 24, alignItems: "start",
          }}>

            {/* ── Overview Panel ───── */}
            <div style={isMobile ? {} : { position: "sticky", top: 88 }}>
              <OverviewPanel notifications={notifications} isMobile={isMobile} />
            </div>

            {/* ── Notifications List ─ */}
            <div style={{
              background: C.surfaceContainerLowest,
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 14, overflow: "hidden",
            }}>
              {/* Tab bar */}
              <div style={{
                padding: isMobile ? "0 16px" : "0 24px",
                borderBottom: `1px solid ${C.outlineVariant}`,
                display: "flex", gap: isMobile ? 16 : 28,
                background: C.surfaceContainerLowest, overflowX: "auto",
              }}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      padding: "16px 0", border: "none", background: "none",
                      cursor: "pointer", fontSize: 12, fontFamily: MONO,
                      fontWeight: isActive ? 700 : 500, letterSpacing: "0.04em",
                      color: isActive ? C.primary : C.onSurfaceVariant,
                      borderBottom: isActive ? `2px solid ${C.primary}` : "2px solid transparent",
                      marginBottom: -1, transition: "color 0.15s, border-color 0.15s",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>{tab}</button>
                  );
                })}
              </div>

              {/* Notification items */}
              {filtered.length === 0 ? (
                <div style={{
                  padding: isMobile ? 40 : 60, textAlign: "center",
                  color: C.onSurfaceVariant, fontSize: 14,
                }}>
                  <Icon name="notifications_off" size={36} style={{ display: "block", margin: "0 auto 12px", color: C.outlineVariant }} />
                  {notifications.length === 0 ? "No notifications yet." : "No notifications match your filters."}
                </div>
              ) : (
                <div>
                  {filtered.map((notif) => (
                    <NotifItem
                      key={notif.id}
                      notif={notif}
                      onMarkRead={markRead}
                      searchTerm={search}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
              )}

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{
                  padding: "16px 24px",
                  borderTop: `1px solid ${C.outlineVariant}`,
                  display: "flex", justifyContent: "center",
                  background: C.surfaceContainerLowest,
                }}>
                  <button
                    onClick={() => showToast("You're viewing all available notifications.")}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, fontFamily: MONO, fontWeight: 700,
                      color: C.onSurfaceVariant, display: "flex", alignItems: "center", gap: 6,
                      transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = C.primary}
                    onMouseLeave={(e) => e.currentTarget.style.color = C.onSurfaceVariant}
                  >
                    View all past notifications
                    <Icon name="arrow_forward" size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Automated Maintenance Banner */}
          <div style={{ marginTop: isMobile ? 20 : 28 }}>
            <MaintenanceBanner
              isMobile={isMobile}
              onReviewSchedule={() => showToast("Maintenance schedule review coming soon.")}
            />
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {toast && (
        <div style={{
          position: "fixed", bottom: isMobile ? 76 : 24, left: "50%", transform: "translateX(-50%)",
          background: C.onSurface, color: C.white, padding: "12px 24px",
          borderRadius: 30, fontSize: 13, fontFamily: MONO, zIndex: 300,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}