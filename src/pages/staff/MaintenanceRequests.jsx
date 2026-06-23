import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

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

const PRIORITY_CFG = {
  Emergency: { bg: "#FEE2E2", text: "#991B1B" },
  High:      { bg: "#FEF3C7", text: "#92400E" },
  Medium:    { bg: "#FEF3C7", text: "#92400E" },
  Low:       { bg: C.surfaceContainerHighest, text: C.onSurfaceVariant },
};

// IMPORTANT: status values must match the canonical set used across
// student/admin pages: "Pending" → "Assigned" → "Completed" (+ "Cancelled").
const STATUS_BADGE_CFG = {
  Assigned:   { bg: "#EEF2FF",              text: "#3730A3"              },
  Completed:  { bg: C.secondaryContainer,   text: C.onSecondaryContainer },
  Pending:    { bg: "#FEF3C7",              text: "#92400E"              },
  Cancelled:  { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant     },
};

const TABS = ["All", "Emergency", "Assigned", "Pending", "Completed", "Cancelled"];
const PER_PAGE = 5;
const CATEGORY_ICONS = {
  Electrical: "bolt", HVAC: "ac_unit", Plumbing: "water_drop",
  "IT Services": "wifi_off", Furniture: "chair", Lighting: "lightbulb",
  Structural: "domain", Elevator: "elevator", Other: "build",
};
const EMPTY_FORM = { title: "", location: "", department: "", priority: "Medium", details: "", category: "Other" };

// Maps a raw Supabase 'requests' row into the shape this page's UI expects.
function formatRequest(r, currentUserId) {
  return {
    id: r.id,
    title: r.title,
    icon: CATEGORY_ICONS[r.category] || "build",
    reporter: r.created_by === currentUserId ? "You" : (r.reporter_name || "Staff member"),
    location: r.location || "",
    department: r.department || "—",
    date: r.created_at
      ? new Date(r.created_at).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "",
    priority: r.priority || "Medium",
    status: r.status || "Pending",
    details: r.description || "",
    category: r.category || "Other",
  };
}

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

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Low;
  return (
    <span style={{
      padding: "2px 9px", borderRadius: 4,
      background: cfg.bg, color: cfg.text,
      fontSize: 10, fontWeight: 700, fontFamily: MONO,
      letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{priority}</span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_BADGE_CFG[status] || STATUS_BADGE_CFG.Pending;
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 4,
      background: cfg.bg, color: cfg.text,
      fontSize: 10, fontWeight: 700, fontFamily: MONO,
      letterSpacing: "0.06em", whiteSpace: "nowrap",
    }}>{status}</span>
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
            background: "rgba(255,255,255,0.10)",
            color: C.white, border: "none", borderRadius: 6,
            cursor: "pointer", fontSize: 12, fontFamily: MONO,
            letterSpacing: "0.04em", transition: "background 0.15s",
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
        <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 460, position: "relative" }}>
          <Icon name="search" size={20} style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: C.onSurfaceVariant,
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isMobile ? "Search requests..." : "Search requests, assets, or technicians..."}
            style={{
              width: "100%", paddingLeft: 40, paddingRight: 16,
              paddingTop: 9, paddingBottom: 9,
              background: C.surfaceContainerLow,
              border: "none", borderRadius: 8,
              fontSize: 14, outline: "none",
              color: C.onSurface, fontFamily: SANS, boxSizing: "border-box",
              transition: "box-shadow 0.15s",
            }}
            onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${C.primaryFixedDim}`}
            onBlur={(e) => e.target.style.boxShadow = "none"}
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12 }}>
        {!isMobile && (
          <div style={{ display: "flex", gap: 2 }}>
            {["notifications", "settings"].map((ic) => (
              <button key={ic} style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 8, color: C.onSurfaceVariant,
                borderRadius: "50%", display: "flex", transition: "background 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainer}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Icon name={ic} size={22} />
              </button>
            ))}
          </div>
        )}
        {!isMobile && (
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: C.surfaceContainerHighest,
            border: `1px solid ${C.outlineVariant}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: C.onSurface, fontSize: 14, flexShrink: 0,
          }}>S</div>
        )}
      </div>
    </header>
  );
}

// ─── Analytics Row — live counts, no hardcoded numbers ────────────────────────
function AnalyticsRow({ requests, isMobile, loading }) {
  const emergencyCount  = requests.filter((r) => r.priority === "Emergency").length;
  const activeCount     = requests.filter((r) => r.status !== "Completed" && r.status !== "Cancelled").length;
  const pendingCount    = requests.filter((r) => r.status === "Pending").length;

  const statCards = [
    { icon: "emergency",       label: "Emergency",       value: String(emergencyCount).padStart(2, "0"), iconBg: `${C.errorContainer}55`,     iconColor: C.error },
    { icon: "pending_actions", label: "Active Requests", value: String(activeCount).padStart(2, "0"),     iconBg: `${C.secondaryContainer}55`, iconColor: C.secondary },
    { icon: "assignment_ind",  label: "Pending Review",  value: String(pendingCount).padStart(2, "0"),    iconBg: C.surfaceContainerHigh,       iconColor: C.primary },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr) 1.1fr",
      gap: isMobile ? 12 : 20,
    }}>
      {statCards.map((card, i) => (
        <div key={i} style={{
          background: C.surface, border: `1px solid ${C.outlineVariant}`,
          borderRadius: 12, padding: isMobile ? "16px 16px" : "22px 22px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMobile ? 10 : 16 }}>
            <div style={{
              width: isMobile ? 34 : 40, height: isMobile ? 34 : 40, borderRadius: 8,
              background: card.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={card.icon} size={isMobile ? 18 : 22} style={{ color: card.iconColor }} />
            </div>
            {!isMobile && <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, opacity: 0.75 }}>{card.label}</span>}
          </div>
          {isMobile && <p style={{ margin: "0 0 2px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, opacity: 0.75 }}>{card.label}</p>}
          {loading
            ? <div style={{ width: 40, height: isMobile ? 22 : 30, background: C.surfaceContainerHigh, borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
            : <p style={{ margin: 0, fontSize: isMobile ? 22 : 30, fontWeight: 700, color: C.primary, fontFamily: SANS }}>{card.value}</p>}
        </div>
      ))}

      {/* Staff Portal card */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: C.primaryContainer, borderRadius: 12, padding: isMobile ? "16px 16px" : "22px 22px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        gridColumn: isMobile ? "1 / -1" : "auto",
      }}>
        {!isMobile && [120, 180, 240].map((s, i) => (
          <div key={i} style={{
            position: "absolute", right: -40 + i * 10, bottom: -40 + i * 10,
            width: s, height: s, borderRadius: "50%",
            border: "1px solid rgba(255,180,170,0.15)", pointerEvents: "none",
          }} />
        ))}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: isMobile ? 15 : 18, fontWeight: 700, color: C.white }}>Staff Portal</h4>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.70)", lineHeight: 1.6 }}>
            Manage departmental facility guidelines and submit maintenance requests.
          </p>
        </div>
        <button
          onClick={() => window.open("https://docs.google.com", "_blank")}
          style={{
            position: "relative", zIndex: 1, marginTop: 16, background: "none", border: "none",
            fontSize: 12, fontFamily: MONO, color: C.primaryFixedDim, cursor: "pointer",
            fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 4, padding: 0, textAlign: "left",
          }}
        >
          View Guidelines →
        </button>
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
function TabBar({ active, setActive, isMobile }) {
  return (
    <div style={{
      display: "flex", gap: 2,
      background: C.surfaceContainer, padding: 4, borderRadius: 10,
      width: isMobile ? "100%" : "fit-content",
      overflowX: isMobile ? "auto" : "visible",
    }}>
      {TABS.map((tab) => {
        const isActive = active === tab;
        return (
          <button key={tab} onClick={() => setActive(tab)} style={{
            padding: "7px 16px", border: "none", cursor: "pointer",
            borderRadius: 7, fontSize: 12, fontFamily: MONO, letterSpacing: "0.04em",
            background: isActive ? C.white : "transparent",
            color: isActive ? C.onSurface : C.onSurfaceVariant,
            fontWeight: isActive ? 700 : 400,
            boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
            transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
          }}>{tab}</button>
        );
      })}
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────
function RequestCard({ req, view, onSelect }) {
  const [hov, setHov] = useState(false);

  const leftAccent =
    req.priority === "Emergency" ? C.error :
    req.status === "Completed"   ? C.secondary :
    req.status === "Assigned"    ? C.secondary :
    C.outlineVariant;

  if (view === "grid") {
    return (
      <div
        onClick={() => onSelect(req)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: C.surface, borderRadius: 12,
          border: `1px solid ${C.outlineVariant}`,
          borderTop: `4px solid ${leftAccent}`,
          padding: 20, cursor: "pointer",
          boxShadow: hov ? "0 4px 14px rgba(0,0,0,0.07)" : "none",
          transform: hov ? "translateY(-2px)" : "none",
          transition: "box-shadow 0.18s, transform 0.15s", fontFamily: SANS,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 8,
            background: C.surfaceContainerHigh,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={req.icon} size={22} style={{ color: C.primary }} />
          </div>
          <PriorityBadge priority={req.priority} />
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.primary, lineHeight: 1.3 }}>{req.title}</h3>
        <p style={{ margin: "0 0 14px", fontSize: 12, color: C.onSurfaceVariant }}>#{req.id?.toString().slice(0, 8)} • {req.reporter}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <StatusBadge status={req.status} />
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(req); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: C.onSurfaceVariant, padding: 4, display: "flex",
            }}
          >
            <Icon name="chevron_right" size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(req)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surface,
        border: `1px solid ${C.outlineVariant}`,
        borderLeft: `4px solid ${leftAccent}`,
        borderRadius: 12, padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 12,
        cursor: "pointer",
        boxShadow: hov ? "0 2px 10px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow 0.18s", fontFamily: SANS,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10, flexShrink: 0,
          background: C.surfaceContainerHigh,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={req.icon} size={24} style={{ color: C.primary }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.primary }}>{req.title}</h3>
            <PriorityBadge priority={req.priority} />
          </div>
          <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant }}>
            Request ID: #{req.id?.toString().slice(0, 8)} &bull; Reported by {req.reporter}
          </p>
        </div>

        <button
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: C.onSurfaceVariant, display: "flex",
            opacity: hov ? 1 : 0.3, transition: "opacity 0.15s", marginLeft: "auto",
          }}
        >
          <Icon name="chevron_right" size={20} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 20, paddingLeft: 64, flexWrap: "wrap" }}>
        {[["LOCATION", req.location], ["DATE", req.date], ["STATUS", null]].map(([label, value]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, opacity: 0.65 }}>{label}</span>
            {label === "STATUS" ? <StatusBadge status={req.status} /> : <span style={{ fontSize: 13, color: C.onSurface }}>{value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Drawer — Staff view (read-only, no assign) ────────────────────────
function DetailDrawer({ req, onClose, onCancelRequest, isMobile, canCancel }) {
  if (!req) return null;

  const statusCfg = STATUS_BADGE_CFG[req.status] || STATUS_BADGE_CFG.Pending;
  const isLocked = req.status === "Completed" || req.status === "Cancelled" || !canCancel;

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100,
      }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: isMobile ? "100%" : 420,
        background: C.white, zIndex: 101,
        boxShadow: "-6px 0 32px rgba(0,0,0,0.13)",
        display: "flex", flexDirection: "column",
        fontFamily: SANS, overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 18px",
          borderBottom: `1px solid ${C.outlineVariant}`,
          background: C.surfaceContainerLow,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.primaryContainer, fontWeight: 700, letterSpacing: "0.06em" }}>
                  #{req.id?.toString().slice(0, 8)}
                </span>
                <PriorityBadge priority={req.priority} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: C.surfaceContainerHigh,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={req.icon} size={24} style={{ color: C.primary }} />
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>
                  {req.title}
                </h2>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, color: C.onSurfaceVariant, display: "flex", flexShrink: 0,
            }}>
              <Icon name="close" size={20} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusCfg.text }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: statusCfg.text, fontFamily: MONO }}>
              {req.status}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            ["Reporter",   req.reporter,   "person"     ],
            ["Location",   req.location,   "location_on"],
            ["Department", req.department, "domain"     ],
            ["Date Filed", req.date,       "calendar_today"],
          ].map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: C.surfaceContainerLow,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={icon} size={18} style={{ color: C.onSurfaceVariant }} />
              </div>
              <div>
                <div style={{
                  fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant,
                  letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3,
                }}>{label}</div>
                <div style={{ fontSize: 14, color: C.onSurface, fontWeight: 500 }}>{value}</div>
              </div>
            </div>
          ))}

          {req.details && (
            <div>
              <div style={{ fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                Additional Details
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.onSurface, lineHeight: 1.6, background: C.surfaceContainerLow, padding: "10px 14px", borderRadius: 8 }}>
                {req.details}
              </p>
            </div>
          )}

          {/* Assignment status — read-only notice for staff */}
          <div style={{
            background: C.surfaceContainerLow,
            border: `1px solid ${C.outlineVariant}`,
            borderRadius: 10, padding: "14px 16px",
            display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <Icon name="info" size={20} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 13, color: C.onSurface, fontWeight: 600 }}>
                Technician assignment is managed by admin
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
                A technician will be assigned to this request by the administrator. You will be notified once assigned.
              </p>
            </div>
          </div>
        </div>

        {/* Footer — staff can only cancel their own request */}
        {canCancel && (
          <div style={{
            padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`,
            display: "flex", gap: 10,
          }}>
            <button
              disabled={isLocked}
              onClick={() => !isLocked && onCancelRequest(req.id)}
              style={{
                flex: 1, padding: "11px 0",
                background: isLocked ? C.surfaceContainerHigh : C.errorContainer,
                color: isLocked ? C.onSurfaceVariant : C.onErrorContainer,
                border: "none", borderRadius: 8,
                cursor: isLocked ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: 12, fontFamily: MONO,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                opacity: isLocked ? 0.55 : 1,
              }}
            >
              <Icon name="cancel" size={15} style={{ color: isLocked ? C.onSurfaceVariant : C.onErrorContainer }} />
              {req.status === "Cancelled" ? "Request Cancelled" : "Cancel Request"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── New Request Modal ────────────────────────────────────────────────────────
function NewRequestModal({ onClose, onSubmit, isMobile }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
    fontSize: 14, fontFamily: SANS, color: C.onSurface,
    background: C.surfaceContainerLow, outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", fontSize: 10, fontFamily: MONO,
    color: C.onSurfaceVariant, letterSpacing: "0.08em",
    textTransform: "uppercase", marginBottom: 5,
  };

  async function handleSubmit() {
    if (!form.title.trim() || !form.location.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 500, maxWidth: "calc(100vw - 32px)", background: C.white, borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
        zIndex: 201, fontFamily: SANS, overflow: "hidden",
        maxHeight: "calc(100vh - 32px)", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${C.outlineVariant}`,
          background: C.surfaceContainerLow,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>New Maintenance Request</h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>
              Submit a facility issue to the infrastructure team
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 6, color: C.onSurfaceVariant, display: "flex",
          }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ padding: "9px 12px", background: C.errorContainer, color: C.onErrorContainer, borderRadius: 8, fontSize: 13 }}>{error}</div>}
          <div>
            <label style={labelStyle}>Issue Title</label>
            <input value={form.title} onChange={set("title")} placeholder="e.g. AC Unit Malfunction – Room 402" style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input value={form.location} onChange={set("location")} placeholder="e.g. Block B, Floor 3" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input value={form.department} onChange={set("department")} placeholder="e.g. Facility Ops" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={set("category")} style={{ ...inputStyle, cursor: "pointer" }}>
                {Object.keys(CATEGORY_ICONS).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority Level</label>
              <select value={form.priority} onChange={set("priority")} style={{ ...inputStyle, cursor: "pointer" }}>
                {["Emergency", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Additional Details</label>
            <textarea
              value={form.details}
              onChange={set("details")}
              placeholder="Describe the issue in detail so the admin team can respond quickly..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
          </div>

          <div style={{
            display: "flex", gap: 10, padding: "10px 14px",
            background: C.surfaceContainerLow,
            border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
          }}>
            <Icon name="info" size={16} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
              Technician assignment will be handled by the admin team. You'll receive a notification once your request is reviewed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${C.outlineVariant}`,
          display: "flex", justifyContent: "flex-end", gap: 10,
          background: C.surfaceContainerLow,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", border: `1px solid ${C.outlineVariant}`,
            borderRadius: 8, background: "none", cursor: "pointer",
            fontSize: 12, fontFamily: MONO, color: C.onSurface,
          }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.location.trim() || submitting}
            style={{
              padding: "9px 20px",
              background: (form.title.trim() && form.location.trim() && !submitting) ? C.primaryContainer : C.outlineVariant,
              color: C.white, border: "none", borderRadius: 8,
              cursor: (form.title.trim() && form.location.trim() && !submitting) ? "pointer" : "default",
              fontSize: 12, fontFamily: MONO, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Icon name="send" size={14} style={{ color: C.white }} />
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, setPage, shownCount, total, isMobile }) {
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  return (
    <div style={{
      marginTop: 28, display: "flex", justifyContent: "space-between",
      alignItems: "center", borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 20,
      fontFamily: SANS, flexWrap: "wrap", gap: 12,
    }}>
      <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>
        Showing {shownCount} of {total} requests
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{
          padding: "7px 14px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
          background: "none", cursor: page === 1 ? "default" : "pointer",
          opacity: page === 1 ? 0.4 : 1, fontSize: 13, fontFamily: SANS, fontWeight: 600,
        }}>{isMobile ? "‹" : "Previous"}</button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} style={{
            padding: "7px 14px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
            background: page === p ? C.primaryContainer : "none",
            color: page === p ? C.white : C.onSurface,
            cursor: "pointer", fontSize: 13,
            fontWeight: page === p ? 700 : 600, fontFamily: MONO,
          }}>{p}</button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
          padding: "7px 14px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
          background: "none", cursor: page === totalPages ? "default" : "pointer",
          opacity: page === totalPages ? 0.4 : 1, fontSize: 13, fontFamily: SANS, fontWeight: 600,
        }}>{isMobile ? "›" : "Next"}</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffMaintenanceRequestsPage() {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [view, setView]           = useState("list");
  const [selected, setSelected]   = useState(null);
  const [creating, setCreating]   = useState(false);
  const [page, setPage]           = useState(1);
  const [sortDesc, setSortDesc]   = useState(true);
  const [toast, setToast]         = useState(null);
  const [loading, setLoading]     = useState(true);

  const [requests, setRequests] = useState([]);

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

  // ── Fetch the staff member's own requests ──────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error.message);
        showToast("Failed to load requests.");
        return;
      }

      setRequests((data || []).map((r) => formatRequest(r, user.id)));
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── Filter + sort ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = requests.filter((r) => {
      const tabOk = activeTab === "All" || r.priority === activeTab || r.status === activeTab;
      const q = search.toLowerCase();
      const searchOk = !q || [r.id, r.title, r.reporter, r.location, r.department, r.priority, r.status]
        .some((f) => f?.toString().toLowerCase().includes(q));
      return tabOk && searchOk;
    });
    return [...list].sort((a, b) => sortDesc ? (b.id > a.id ? 1 : -1) : (a.id > b.id ? 1 : -1));
  }, [requests, activeTab, search, sortDesc]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleSubmitRequest(form) {
    if (!user) {
      showToast("You must be signed in to submit a request.");
      return;
    }

    // Column shape must match the real 'requests' table exactly.
    const payload = {
      title: form.title.trim(),
      description: form.details.trim(),
      category: form.category,
      priority: form.priority,
      status: "Pending",                 // matches admin's "Unassigned/Pending" filter
      location: form.location.trim(),
      department: form.department.trim() || null,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from("requests")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      throw new Error(error.message);
    }

    const formatted = formatRequest(data, user.id);
    setRequests((prev) => [formatted, ...prev]);
    setCreating(false);
    showToast(`Request submitted.`);
  }

  async function handleCancelRequest(id) {
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status: "Cancelled" })
        .eq("id", id)
        .eq("created_by", user.id); // safety: only ever cancel your own

      if (error) throw error;

      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "Cancelled" } : r));
      setSelected((prev) => prev && prev.id === id ? { ...prev, status: "Cancelled" } : prev);
      showToast(`Request cancelled.`);
    } catch (err) {
      console.error("Cancel error:", err);
      showToast("Failed to cancel request.");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
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
                Maintenance Requests
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
                Track and manage facility maintenance across campus departments.
              </p>
            </div>
            <button
              onClick={() => setCreating(true)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: C.primaryContainer, color: C.white,
                border: "none", cursor: "pointer",
                padding: "11px 22px", borderRadius: 12,
                fontSize: 14, fontFamily: SANS, fontWeight: 700,
                boxShadow: "0 2px 8px rgba(74,4,4,0.25)",
                transition: "opacity 0.15s", width: isMobile ? "100%" : "auto",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.90"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >
              <Icon name="add" size={18} style={{ color: C.white }} />
              New Request
            </button>
          </div>

          {/* Analytics Row */}
          <div style={{ marginBottom: isMobile ? 20 : 28 }}>
            <AnalyticsRow requests={requests} isMobile={isMobile} loading={loading} />
          </div>

          {/* Toolbar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: 12, marginBottom: 20, flexWrap: "wrap",
            flexDirection: isMobile ? "column" : "row",
          }}>
            <TabBar active={activeTab} setActive={(t) => { setActiveTab(t); setPage(1); }} isMobile={isMobile} />
            <div style={{ display: "flex", gap: 8, marginLeft: isMobile ? 0 : "auto", width: isMobile ? "100%" : "auto" }}>
              {!isMobile && (
                <button
                  onClick={() => showToast("Use the search bar or status tabs above to filter requests.")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 14px", background: C.white,
                    border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
                    cursor: "pointer", fontSize: 13, fontWeight: 600,
                    color: C.onSurface, fontFamily: SANS,
                  }}
                >
                  <Icon name="filter_list" size={16} style={{ color: C.onSurfaceVariant }} />
                  Filter
                </button>
              )}
              <button
                onClick={() => setSortDesc((p) => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 14px", background: C.white,
                  border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                  color: C.onSurface, fontFamily: SANS, flex: isMobile ? 1 : "initial",
                  justifyContent: "center",
                }}
              >
                <Icon name="sort" size={16} style={{ color: C.onSurfaceVariant }} />
                {sortDesc ? "Newest First" : "Oldest First"}
              </button>
              <div style={{ display: "flex", background: C.surfaceContainer, borderRadius: 8, padding: 3, gap: 2 }}>
                {[["list", "view_list"], ["grid", "grid_view"]].map(([v, icon]) => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: "6px 10px", border: "none", borderRadius: 6, cursor: "pointer",
                    background: view === v ? C.white : "transparent",
                    boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                    color: view === v ? C.onSurface : C.onSurfaceVariant,
                    display: "flex", alignItems: "center", transition: "all 0.12s",
                  }}>
                    <Icon name={icon} size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Request List / Grid */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 96, background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : paged.length === 0 ? (
            <div style={{
              padding: isMobile ? 36 : 60, textAlign: "center",
              color: C.onSurfaceVariant, fontSize: 15,
              border: `1px dashed ${C.outlineVariant}`, borderRadius: 12,
            }}>
              <Icon name="inbox" size={40} style={{ display: "block", margin: "0 auto 12px", color: C.outlineVariant }} />
              {requests.length === 0
                ? "You haven't filed any maintenance requests yet."
                : "No requests match your filters."}
            </div>
          ) : view === "list" || isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {paged.map((req) => (
                <RequestCard key={req.id} req={req} view="list" onSelect={setSelected} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {paged.map((req) => (
                <RequestCard key={req.id} req={req} view="grid" onSelect={setSelected} />
              ))}
            </div>
          )}

          <Pagination page={page} setPage={setPage} shownCount={paged.length} total={filtered.length} isMobile={isMobile} />
        </div>
      </main>

      {isMobile && <BottomNav />}

      {selected && (
        <DetailDrawer
          req={selected}
          onClose={() => setSelected(null)}
          onCancelRequest={handleCancelRequest}
          isMobile={isMobile}
          canCancel={selected.reporter === "You"}
        />
      )}
      {creating && (
        <NewRequestModal
          onClose={() => setCreating(false)}
          onSubmit={handleSubmitRequest}
          isMobile={isMobile}
        />
      )}

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