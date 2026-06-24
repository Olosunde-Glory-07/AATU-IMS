import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  onPrimaryContainer:     "#d26a5f",
  primaryFixedDim:        "#ffb4aa",
  onPrimaryFixed:         "#410001",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
  onSecondaryFixed:       "#00210b",
  secondaryFixed:         "#bbefc1",
  tertiaryFixed:          "#ffdcc3",
  onTertiaryFixed:        "#2f1500",
  tertiaryFixedDim:       "#ffb77d",
  onTertiaryFixedVariant: "#6e3900",
  errorContainer:         "#ffdad6",
  onErrorContainer:       "#93000a",
  error:                  "#ba1a1a",
  surface:                "#f9f9ff",
  surfaceContainer:       "#e7eefe",
  surfaceContainerLow:    "#f0f3ff",
  surfaceContainerHigh:   "#e2e8f8",
  surfaceContainerHighest:"#dce2f3",
  onSurface:              "#151c27",
  onSurfaceVariant:       "#554240",
  outlineVariant:         "#dcc0bd",
  outline:                "#89726f",
  white:                  "#ffffff",
};
const MONO = "'JetBrains Mono', monospace";
const SANS = "'Hanken Grotesk', sans-serif";

// ─── Notification type config (styling only — not records) ───────────────────
const TYPE_CFG = {
  CRITICAL:        { bg: C.errorContainer,          text: C.onErrorContainer,       iconBg: C.errorContainer,          iconColor: C.error,                  dotColor: C.error,    icon: "report"               },
  ALERT:           { bg: C.tertiaryFixed,            text: C.onTertiaryFixedVariant, iconBg: C.tertiaryFixed,           iconColor: C.onTertiaryFixedVariant, dotColor: "#cf7000",  icon: "warning"               },
  COMPLETED:       { bg: C.secondaryContainer,       text: C.onSecondaryContainer,   iconBg: C.secondaryContainer,      iconColor: C.secondary,              dotColor: C.secondary,icon: "assignment_turned_in" },
  INFO:            { bg: C.surfaceContainerHighest,  text: C.onSurfaceVariant,       iconBg: C.surfaceContainerHighest, iconColor: C.onSurfaceVariant,       dotColor: C.outline,  icon: "info"                  },
  "USER ACTIVITY": { bg: C.onSecondaryFixed,         text: C.secondaryFixed,         iconBg: C.onSecondaryFixed,        iconColor: C.secondaryFixed,         dotColor: C.secondary,icon: "person_add"           },
};

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/admin/dashboard"     },
  { icon: "list_alt",      label: "Requests",      path: "/admin/requests"      },
  { icon: "engineering",   label: "Job Orders",    path: "/admin/job-orders"    },
  { icon: "inventory_2",   label: "Assets",        path: "/admin/assets"        },
  { icon: "group",         label: "Users",         path: "/admin/users"         },
  { icon: "domain",        label: "Departments",   path: "/admin/departments"   },
  { icon: "notifications", label: "Notifications", path: "/admin/notifications" },
];

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

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
function Sidebar({ open, onClose, unreadCount }) {
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
      {/* Brand */}
      <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: C.onPrimaryContainer,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: C.white, fontFamily: SANS }}>A</span>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontFamily: MONO }}>
              Infrastructure Mgmt
            </div>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4 }}>
            <Icon name="close" size={22} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 16px", position: "relative",
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? C.white : "rgba(255,255,255,0.65)",
                fontWeight: isActive ? 700 : 400,
                borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.65)" }} />
              {item.label}
              {item.label === "Notifications" && unreadCount > 0 && (
                <span style={{
                  marginLeft: "auto", background: C.error, color: C.white,
                  borderRadius: 99, fontSize: 9, fontWeight: 700,
                  padding: "1px 6px", fontFamily: MONO,
                }}>{unreadCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => navigate("/admin/profile")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 16px", background: "transparent",
            color: "rgba(255,255,255,0.6)", border: "none",
            cursor: "pointer", fontSize: 12, fontFamily: MONO,
          }}
        >
          <Icon name="account_circle" size={18} style={{ color: "rgba(255,255,255,0.6)" }} />
          User Profile
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%", marginTop: 8, padding: "8px 16px",
            border: "1px solid rgba(255,255,255,0.2)", background: "transparent",
            color: C.white, cursor: "pointer",
            fontSize: 12, fontFamily: MONO, letterSpacing: "0.04em",
          }}
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
  const quickNav = NAV_ITEMS.slice(0, 5);

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: C.white, borderTop: `1px solid ${C.outlineVariant}`,
      display: "flex", height: 60,
    }}>
      {quickNav.map((item) => {
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
  const navigate = useNavigate();
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
          <Icon name="search" size={18} style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: C.onSurfaceVariant,
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search system activities..."
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16,
              paddingTop: 9, paddingBottom: 9,
              background: C.surfaceContainerLow,
              border: "none", borderRadius: 8, fontSize: 14,
              outline: "none", color: C.onSurface,
              boxSizing: "border-box", fontFamily: SANS,
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10 }}>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 2, paddingRight: 16, borderRight: `1px solid ${C.outlineVariant}` }}>
            <button
              onClick={() => navigate("/admin/profile")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 8, color: C.onSurface, borderRadius: "50%", display: "flex",
              }}
            >
              <Icon name="settings" size={22} />
            </button>
          </div>
        )}
        {!isMobile && (
          <button
            onClick={() => navigate("/admin/requests")}
            style={{
              background: C.primaryContainer, color: C.white,
              border: "none", cursor: "pointer", padding: "8px 18px",
              borderRadius: 6, fontSize: 12, fontFamily: MONO,
              fontWeight: 500, letterSpacing: "0.04em",
            }}
          >
            Report Issue
          </button>
        )}
        <div style={{
          width: isMobile ? 32 : 34, height: isMobile ? 32 : 34, borderRadius: "50%",
          background: C.surfaceContainerHigh,
          border: `1px solid ${C.outlineVariant}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: C.onSurfaceVariant, fontSize: 14, flexShrink: 0,
        }}>A</div>
      </div>
    </header>
  );
}

// ─── Stat Cards — derived live from notifications, not hardcoded ──────────────
function StatCards({ notifications, isMobile }) {
  const criticalCount = notifications.filter((n) => n.type === "CRITICAL").length;
  const activeCount   = notifications.filter((n) => n.type === "ALERT").length;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 2fr",
      gap: isMobile ? 12 : 24, marginBottom: isMobile ? 20 : 32,
    }}>
      <div style={{
        background: C.white, padding: isMobile ? 16 : 20,
        border: `1px solid ${C.outlineVariant}`, borderRadius: 12,
        display: "flex", alignItems: "center", gap: isMobile ? 10 : 16,
      }}>
        <div style={{
          width: isMobile ? 38 : 48, height: isMobile ? 38 : 48, borderRadius: "50%",
          background: C.errorContainer, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="error" size={isMobile ? 19 : 24} style={{ color: C.error }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", opacity: 0.7 }}>CRITICAL</p>
          <h4 style={{ margin: "4px 0 0", fontSize: isMobile ? 20 : 26, fontWeight: 700, color: C.onSurface, fontFamily: SANS }}>
            {String(criticalCount).padStart(2, "0")}
          </h4>
        </div>
      </div>

      <div style={{
        background: C.white, padding: isMobile ? 16 : 20,
        border: `1px solid ${C.outlineVariant}`, borderRadius: 12,
        display: "flex", alignItems: "center", gap: isMobile ? 10 : 16,
      }}>
        <div style={{
          width: isMobile ? 38 : 48, height: isMobile ? 38 : 48, borderRadius: "50%",
          background: C.tertiaryFixed, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="warning" size={isMobile ? 19 : 24} style={{ color: C.onTertiaryFixedVariant }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", opacity: 0.7 }}>ACTIVE</p>
          <h4 style={{ margin: "4px 0 0", fontSize: isMobile ? 20 : 26, fontWeight: 700, color: C.onSurface, fontFamily: SANS }}>
            {String(activeCount).padStart(2, "0")}
          </h4>
        </div>
      </div>

      <div style={{
        background: C.white, padding: isMobile ? 16 : 20,
        border: `1px solid ${C.outlineVariant}`, borderRadius: 12,
        position: "relative", overflow: "hidden", gridColumn: isMobile ? "1 / -1" : "auto",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
      }}>
        {!isMobile && [120, 180, 240].map((s, i) => (
          <div key={i} style={{
            position: "absolute", right: -40 + i * 10, top: "50%",
            transform: "translateY(-50%)",
            width: s, height: s, borderRadius: "50%",
            border: `1px solid ${C.outlineVariant}`,
            opacity: 0.4, pointerEvents: "none",
          }} />
        ))}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", opacity: 0.7 }}>SYSTEM HEALTH</p>
          <h4 style={{ margin: "4px 0 0", fontSize: isMobile ? 16 : 22, fontWeight: 700, color: C.secondary, fontFamily: SANS }}>
            {notifications.length === 0 ? "No issues detected" : "Monitoring active"}
          </h4>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Bar — counts derived live ─────────────────────────────────────────────
function TabBar({ active, setActive, notifications, isMobile }) {
  const tabs = [
    { label: "All",      key: "ALL",      count: notifications.length,                                                                          countBg: C.primaryFixedDim,        countText: C.onPrimaryFixed       },
    { label: "Critical", key: "CRITICAL", count: notifications.filter((n) => n.type === "CRITICAL").length,                                       countBg: C.errorContainer,          countText: C.onErrorContainer     },
    { label: "Alerts",   key: "ALERT",    count: notifications.filter((n) => n.type === "ALERT").length,                                          countBg: C.tertiaryFixed,           countText: C.onTertiaryFixed      },
    { label: "Info",     key: "INFO",     count: notifications.filter((n) => ["INFO", "COMPLETED", "USER ACTIVITY"].includes(n.type)).length,    countBg: C.surfaceContainerHighest, countText: C.onSurfaceVariant     },
  ];
  return (
    <div style={{
      display: "flex", gap: isMobile ? 16 : 32,
      borderBottom: `1px solid ${C.outlineVariant}`,
      marginBottom: isMobile ? 16 : 24, overflowX: "auto",
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button key={tab.key} onClick={() => setActive(tab.key)} style={{
            display: "flex", alignItems: "center", gap: 8,
            paddingBottom: 14, border: "none", background: "none",
            cursor: "pointer", fontFamily: MONO, fontSize: 12,
            fontWeight: isActive ? 700 : 500, letterSpacing: "0.04em",
            color: isActive ? C.primary : C.onSurfaceVariant,
            borderBottom: isActive ? `2px solid ${C.primary}` : "2px solid transparent",
            marginBottom: -1, transition: "color 0.15s, border-color 0.15s",
            whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {tab.label}
            <span style={{
              background: tab.countBg, color: tab.countText,
              padding: "1px 7px", borderRadius: 99,
              fontSize: 10, fontWeight: 700,
            }}>{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Notification Item ────────────────────────────────────────────────────────
function NotificationItem({ notif, onMarkRead, onAction, isMobile }) {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CFG[notif.type] || TYPE_CFG.INFO;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        background: notif.unread ? C.white : `${C.surfaceContainerLow}80`,
        border: `1px solid ${notif.unread ? C.outlineVariant : C.outlineVariant + "80"}`,
        borderRadius: 12,
        padding: isMobile ? "16px 16px 16px 20px" : "20px 24px",
        display: "flex", gap: isMobile ? 14 : 20,
        boxShadow: hov ? "0 4px 16px rgba(0,0,0,0.07)" : "none",
        transition: "box-shadow 0.2s, background 0.15s",
        fontFamily: SANS, flexDirection: isMobile ? "column" : "row",
      }}
    >
      {notif.unread && (
        <div style={{
          position: "absolute", left: isMobile ? 6 : 10, top: isMobile ? 20 : "50%",
          transform: isMobile ? "none" : "translateY(-50%)",
          width: 8, height: 8, borderRadius: "50%",
          background: cfg.dotColor, flexShrink: 0,
        }} />
      )}

      <div style={{ display: "flex", gap: isMobile ? 12 : 20, flex: 1, minWidth: 0 }}>
        <div style={{
          width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 10, flexShrink: 0,
          background: cfg.iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginLeft: notif.unread ? 8 : 0,
        }}>
          <Icon name={cfg.icon} size={isMobile ? 18 : 22} style={{ color: cfg.iconColor }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: "inline-block", marginBottom: 6,
                padding: "2px 9px", borderRadius: 4,
                background: cfg.bg, color: cfg.text,
                fontSize: 10, fontWeight: 700, fontFamily: MONO,
                letterSpacing: "0.08em",
              }}>{notif.type}</span>

              <h3 style={{ margin: "0 0 5px", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: C.onSurface }}>{notif.title}</h3>
              <p style={{ margin: 0, fontSize: isMobile ? 13 : 14, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{notif.body}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, opacity: 0.7, whiteSpace: "nowrap" }}>
                {notif.time}
              </span>
              {notif.unread && (
                <button
                  onClick={() => onMarkRead(notif.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 11, fontFamily: MONO, color: C.primaryContainer,
                    fontWeight: 700, opacity: isMobile || hov ? 1 : 0,
                    transition: "opacity 0.15s", padding: 0,
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          </div>

          {notif.collaborators && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
              <div style={{ display: "flex" }}>
                {notif.collaborators.map((c, i) => (
                  <div key={i} style={{
                    marginLeft: i > 0 ? -6 : 0, zIndex: 10 - i,
                    width: 26, height: 26, borderRadius: "50%",
                    background: i === 0 ? C.surfaceContainerHigh : C.surfaceContainerHighest,
                    border: `2px solid ${C.white}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, color: C.onSurface, fontFamily: MONO,
                  }}>{c}</div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, fontStyle: "italic" }}>
                {notif.collaboratorNote}
              </p>
            </div>
          )}

          {notif.actions && notif.actions.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {notif.actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onAction(notif, action)}
                  style={{
                    padding: "7px 16px",
                    background: action.primary ? C.primaryContainer : "none",
                    color: action.primary ? C.white : C.onSurface,
                    border: action.primary ? "none" : `1px solid ${C.outline}`,
                    borderRadius: 6, cursor: "pointer",
                    fontSize: 11, fontFamily: MONO, fontWeight: 700,
                    letterSpacing: "0.04em",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, setPage, total, perPage }) {
  const totalPages = Math.ceil(total / perPage);
  return (
    <div style={{
      marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12,
      justifyContent: "space-between", alignItems: "center",
      fontFamily: MONO, fontSize: 12, color: C.onSurfaceVariant,
    }}>
      <span>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total} notifications</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
          background: "none", cursor: page === 1 ? "default" : "pointer",
          opacity: page === 1 ? 0.4 : 1,
        }}>
          <Icon name="chevron_left" size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} style={{
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
            background: page === p ? C.primaryContainer : "none",
            color: page === p ? C.white : C.onSurface,
            cursor: "pointer", fontWeight: page === p ? 700 : 400,
            fontSize: 12, fontFamily: MONO,
          }}>{p}</button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
          width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
          background: "none", cursor: page === totalPages ? "default" : "pointer",
          opacity: page === totalPages ? 0.4 : 1,
        }}>
          <Icon name="chevron_right" size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminNotificationsPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("ALL");
  const [page, setPage]             = useState(1);
  const [toast, setToast]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const PER_PAGE = 6;

  // Loaded for real from Supabase — starts empty until the fetch resolves.
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

  // ── Fetch this admin's own notifications ────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data ?? []).map((n) => ({
        ...n,
        unread: !n.read,
        time: formatTime(n.created_at),
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Realtime: new notifications pop in immediately ─────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new;
          setNotifications((prev) => [{ ...n, unread: !n.read, time: formatTime(n.created_at) }, ...prev]);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  // ── Mark read / mark all read — real DB updates ─────────────────────────────
  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false, read: true } : n)));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) {
      console.error("Mark read error:", error);
      showToast("Could not update notification.");
      fetchNotifications();
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => n.unread).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false, read: true })));
    const { error } = await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    if (error) {
      console.error("Mark all read error:", error);
      showToast("Could not update notifications.");
      fetchNotifications();
      return;
    }
    showToast("All notifications marked as read.");
  }

  function handleAction(notif, action) {
    markRead(notif.id);
    showToast(`"${action.label}" acknowledged for "${notif.title}".`);
  }

  // Filter
  const filtered = useMemo(() => notifications.filter((n) => {
    const tabOk = activeTab === "ALL" || n.type === activeTab ||
      (activeTab === "ALERT" && n.type === "ALERT") ||
      (activeTab === "INFO" && (n.type === "INFO" || n.type === "COMPLETED" || n.type === "USER ACTIVITY"));
    const q = search.toLowerCase();
    const searchOk = !q || [n.title, n.body, n.type].some((f) => f?.toLowerCase().includes(q));
    return tabOk && searchOk;
  }), [notifications, activeTab, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} unreadCount={unreadCount} />

      <main style={{
        marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column",
        paddingBottom: isMobile ? 60 : 0, minWidth: 0,
      }}>
        <TopBar onMenuClick={() => setDrawerOpen(true)} search={search} setSearch={setSearch} />

        <div style={{
          flex: 1, padding: isMobile ? "20px 16px 40px" : "32px 32px 48px",
          maxWidth: 1400, width: "100%", margin: "0 auto", boxSizing: "border-box",
        }}>

          {/* Page Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            gap: 16, marginBottom: isMobile ? 20 : 28,
          }}>
            <div>
              <nav style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>
                <span>Admin</span>
                <span>/</span>
                <span style={{ color: C.onSurface, fontWeight: 700 }}>Notifications</span>
              </nav>
              <h2 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>System Notifications</h2>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
                Manage and track administrative updates and infrastructure alerts.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, width: isMobile ? "100%" : "auto" }}>
              <button
                onClick={markAllRead}
                disabled={unreadCount === 0}
                style={{
                  display: "flex", alignItems: "center", gap: 8, flex: isMobile ? 1 : "initial",
                  justifyContent: "center",
                  padding: "9px 18px",
                  border: `1px solid ${C.outline}`,
                  borderRadius: 8, background: "none", cursor: unreadCount === 0 ? "default" : "pointer",
                  fontSize: 12, fontFamily: MONO, color: C.onSurface,
                  fontWeight: 500, letterSpacing: "0.04em",
                  opacity: unreadCount === 0 ? 0.5 : 1,
                }}
              >
                <Icon name="done_all" size={16} />
                {!isMobile && "Mark All as Read"}
                {unreadCount > 0 && (
                  <span style={{
                    background: C.primaryContainer, color: C.white,
                    borderRadius: 99, fontSize: 9, fontWeight: 700,
                    padding: "1px 6px", fontFamily: MONO,
                  }}>{unreadCount}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab((t) => (t === "CRITICAL" ? "ALL" : "CRITICAL"))}
                style={{
                  display: "flex", alignItems: "center", gap: 8, flex: isMobile ? 1 : "initial",
                  justifyContent: "center",
                  padding: "9px 18px",
                  background: activeTab === "CRITICAL" ? C.error : C.onSurface, color: C.white,
                  border: "none", borderRadius: 8, cursor: "pointer",
                  fontSize: 12, fontFamily: MONO, fontWeight: 500, letterSpacing: "0.04em",
                }}
              >
                <Icon name="filter_list" size={16} style={{ color: C.white }} />
                {!isMobile && (activeTab === "CRITICAL" ? "Showing Critical" : "Filters")}
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <StatCards notifications={notifications} isMobile={isMobile} />

          {/* Tabs */}
          <TabBar active={activeTab} setActive={(k) => { setActiveTab(k); setPage(1); }} notifications={notifications} isMobile={isMobile} />

          {/* Notification List */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 90, background: C.surfaceContainerLow, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
            </div>
          ) : paged.length === 0 ? (
            <div style={{
              padding: isMobile ? 40 : 60, textAlign: "center",
              color: C.onSurfaceVariant, fontSize: 15,
              border: `1px dashed ${C.outlineVariant}`, borderRadius: 12,
            }}>
              <Icon name="notifications_off" size={40} style={{ display: "block", margin: "0 auto 12px", color: C.outlineVariant }} />
              {notifications.length === 0
                ? "No notifications yet. System and admin alerts will appear here."
                : "No notifications match your filters."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paged.map((notif) => (
                <NotificationItem key={notif.id} notif={notif} onMarkRead={markRead} onAction={handleAction} isMobile={isMobile} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {filtered.length > PER_PAGE && (
            <Pagination page={page} setPage={setPage} total={filtered.length} perPage={PER_PAGE} />
          )}
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