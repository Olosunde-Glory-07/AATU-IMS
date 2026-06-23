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
  onPrimaryFixedVariant:  "#7e2b23",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
  secondaryFixed:         "#bbefc1",
  secondaryFixedDim:      "#a0d3a6",
  tertiaryFixed:          "#ffdcc3",
  onTertiaryFixed:        "#2f1500",
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

// ─── Static config (badge styling, not log records) ───────────────────────────
const ACTION_STATUS = {
  SUCCESS: { bg: "#dcfce7", text: C.secondary },
  PENDING: { bg: "#fef3c7", text: C.onTertiaryFixedVariant },
  FAILED:  { bg: C.errorContainer, text: C.error },
};

const MODULE_CFG = {
  Maintenance: { bg: C.secondaryContainer,      text: C.onSecondaryContainer, icon: "build"      },
  Assets:      { bg: C.primaryFixed,            text: C.onPrimaryFixed,       icon: "inventory"  },
  HR:          { bg: C.surfaceContainerHigh,    text: C.primary,              icon: "person_add" },
  Security:    { bg: C.errorContainer,          text: C.error,                icon: "warning"    },
  System:      { bg: C.surfaceContainerHighest, text: C.onSurfaceVariant,     icon: "settings"   },
  Finance:     { bg: C.secondaryContainer,      text: C.secondary,            icon: "payments"   },
  Requests:    { bg: "#EEF2FF",                 text: "#3730A3",             icon: "list_alt"   },
};

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",      path: "/admin/dashboard"      },
  { icon: "history",       label: "System History", path: "/admin/system-history" },
  { icon: "list_alt",      label: "Requests",       path: "/admin/requests"       },
  { icon: "engineering",   label: "Job Orders",     path: "/admin/job-orders"     },
  { icon: "inventory_2",   label: "Assets",         path: "/admin/assets"         },
  { icon: "group",         label: "Users",          path: "/admin/users"          },
  { icon: "domain",        label: "Departments",    path: "/admin/departments"    },
  { icon: "notifications", label: "Notifications",  path: "/admin/notifications"  },
];

const TIME_FILTERS    = ["All Time", "Today", "This Week"];
const MODULE_OPTIONS  = ["All Modules", "Maintenance", "Assets", "HR", "Security", "System", "Finance", "Requests"];
const STATUS_OPTIONS  = ["Any Status", "SUCCESS", "PENDING", "FAILED"];

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

function StatusBadge({ status }) {
  const cfg = ACTION_STATUS[status] || ACTION_STATUS.PENDING;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 99,
      background: cfg.bg, color: cfg.text,
      fontSize: 11, fontWeight: 700, fontFamily: MONO,
      letterSpacing: "0.06em",
    }}>{status}</span>
  );
}

function SelectFilter({ label, options, value, onChange }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.outlineVariant}`,
      borderRadius: 12, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "transparent", border: "none", padding: 0,
          fontSize: 15, fontWeight: 700, color: C.onSurface,
          fontFamily: SANS, outline: "none", cursor: "pointer",
          appearance: "none", WebkitAppearance: "none",
        }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
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
      <div style={{ padding: "24px 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color: C.white, letterSpacing: "-0.02em" }}>AATU</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 2 }}>
            Infrastructure Mgmt
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4 }}>
            <Icon name="close" size={22} />
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: "8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 24px",
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
            </button>
          );
        })}
      </nav>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 16px" }}>
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 8px", background: "transparent",
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
            background: C.primaryFixedDim, color: C.primary,
            border: "none", borderRadius: 6, cursor: "pointer",
            fontSize: 12, fontFamily: MONO, fontWeight: 700,
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
  const quickNav = [NAV_ITEMS[0], NAV_ITEMS[2], NAV_ITEMS[3], NAV_ITEMS[4], NAV_ITEMS[5]]; // Dashboard, Requests, Job Orders, Assets, Users

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
function TopBar({ onMenuClick, search, setSearch, onReportIssue }) {
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
        <div style={{ position: "relative", flex: 1, maxWidth: isMobile ? "100%" : 340 }}>
          <Icon name="search" size={20} style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: C.onSurfaceVariant,
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search system logs..."
            style={{
              width: "100%", paddingLeft: 40, paddingRight: 20,
              paddingTop: 9, paddingBottom: 9,
              background: C.surfaceContainerLow,
              border: `1px solid ${C.outlineVariant}`,
              borderRadius: 99, fontSize: 14,
              outline: "none", color: C.onSurface,
              fontFamily: SANS, boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = C.primaryFixedDim}
            onBlur={(e) => e.target.style.borderColor = C.outlineVariant}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
        <button onClick={onReportIssue} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.primary, color: C.white,
          border: "none", cursor: "pointer", padding: isMobile ? "8px 12px" : "8px 18px",
          borderRadius: 8, fontSize: 12, fontFamily: MONO,
          fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0,
        }}>
          <Icon name="report" size={16} style={{ color: C.white }} />
          {!isMobile && "Report Issue"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 2, paddingLeft: isMobile ? 0 : 12, borderLeft: isMobile ? "none" : `1px solid ${C.outlineVariant}` }}>
          <button onClick={() => navigate("/admin/notifications")} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 8, color: C.onSurfaceVariant, display: "flex", borderRadius: "50%",
          }}>
            <Icon name="notifications" size={22} />
          </button>
          {!isMobile && (
            <button style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 8, color: C.onSurfaceVariant, display: "flex", borderRadius: "50%",
            }}>
              <Icon name="settings" size={22} />
            </button>
          )}
          <div style={{
            width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, borderRadius: "50%",
            background: C.surfaceDim, border: `1px solid ${C.outlineVariant}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: C.onSurface, fontSize: 14, marginLeft: 4, flexShrink: 0,
          }}>A</div>
        </div>
      </div>
    </header>
  );
}

// ─── Stats Panel — derived live from logs, not hardcoded ──────────────────────
function StatsPanel({ logs }) {
  const successCount = logs.filter((l) => l.status === "SUCCESS").length;
  const pendingCount  = logs.filter((l) => l.status === "PENDING").length;
  const failedCount   = logs.filter((l) => l.status === "FAILED").length;

  return (
    <div style={{
      background: C.primary, color: C.white,
      borderRadius: 14, padding: "24px 22px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 10, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>
          Total Logged Actions
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
          <h3 style={{ margin: 0, fontSize: 36, fontWeight: 700, fontFamily: SANS }}>{logs.length}</h3>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {[
            [`${successCount} Success`, "rgba(255,255,255,0.12)"],
            [`${pendingCount} Pending`, "rgba(255,255,255,0.12)"],
            [`${failedCount} Failed`, "rgba(186,26,26,0.35)"],
          ].map(([label, bg]) => (
            <div key={label} style={{
              background: bg, borderRadius: 6,
              padding: "4px 12px", fontSize: 11, fontFamily: MONO,
              fontWeight: 600, letterSpacing: "0.04em",
            }}>{label}</div>
          ))}
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: -16, right: -12,
        opacity: 0.15, color: C.white, fontSize: 110,
        fontFamily: "Material Symbols Outlined",
        fontVariationSettings: "'FILL' 0,'wght' 300",
        lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>query_stats</div>
    </div>
  );
}

// ─── Activity Timeline — built from the most recent real logs ─────────────────
function ActivityTimeline({ logs, onViewArchive }) {
  const items = logs.slice(0, 4);
  const dotColors = [C.primaryFixedDim, C.surfaceContainerHigh, C.secondaryFixedDim, C.errorContainer];

  return (
    <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 24 }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: C.onSurface }}>Activity Stream</h2>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: C.onSurfaceVariant }}>
          <Icon name="history" size={32} style={{ display: "block", margin: "0 auto 8px", color: C.outlineVariant }} />
          <p style={{ margin: 0, fontSize: 13 }}>No activity recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((log, i) => (
            <div key={log.id} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: i < items.length - 1 ? 28 : 0 }}>
              {i < items.length - 1 && (
                <div style={{ position: "absolute", left: 11, top: 24, bottom: 0, width: 2, background: C.outlineVariant, zIndex: 0 }} />
              )}
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: dotColors[i % dotColors.length],
                border: `4px solid ${C.white}`,
                boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
                flexShrink: 0, zIndex: 1,
              }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurface, display: "block", marginBottom: 3 }}>
                  {log.action}
                </span>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
                  {log.module} module &bull; {log.actor}
                </p>
                <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, opacity: 0.65 }}>
                  {log.datetime}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onViewArchive}
        style={{
          width: "100%", marginTop: 24, padding: "12px 0",
          border: `2px dashed ${C.outlineVariant}`,
          borderRadius: 10, background: "none", cursor: "pointer",
          color: C.onSurfaceVariant, fontSize: 12, fontFamily: MONO,
          fontWeight: 700, letterSpacing: "0.04em",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainerLow}
        onMouseLeave={(e) => e.currentTarget.style.background = "none"}
      >
        View Full Archive
      </button>
    </div>
  );
}

// ─── Campus Map Placeholder (decorative — no live data source yet) ────────────
function CampusMapCard() {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.outlineVariant}`,
      borderRadius: 14, overflow: "hidden", height: 200,
      position: "relative",
    }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke={C.outlineVariant} strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={C.surfaceDim} />
        <rect width="100%" height="100%" fill="url(#grid)" />
        {[
          { x: 20,  y: 20,  w: 60, h: 40 },
          { x: 100, y: 15,  w: 80, h: 55 },
          { x: 200, y: 25,  w: 50, h: 35 },
          { x: 25,  y: 90,  w: 70, h: 60 },
          { x: 115, y: 95,  w: 55, h: 45 },
          { x: 190, y: 80,  w: 90, h: 50 },
          { x: 20,  y: 165, w: 100,h: 30 },
          { x: 140, y: 155, w: 65, h: 40 },
          { x: 220, y: 145, w: 60, h: 45 },
        ].map((b, i) => (
          <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h}
            fill={i === 1 || i === 5 ? `${C.primaryContainer}30` : `${C.surfaceContainerHigh}80`}
            stroke={C.outlineVariant} strokeWidth="1" rx="2" />
        ))}
      </svg>
      <div style={{
        position: "absolute", bottom: 12, left: 12,
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
        padding: "5px 12px", borderRadius: 6, fontSize: 11,
        fontWeight: 700, border: `1px solid ${C.outlineVariant}`,
        fontFamily: MONO, color: C.onSurface,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.outline }} />
        Campus Activity Map
      </div>
    </div>
  );
}

// ─── Actions Table ────────────────────────────────────────────────────────────
function ActionsTable({ logs, search, onExport, isMobile }) {
  const [hovRow, setHovRow] = useState(null);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return !q || [l.action, l.actor, l.module, l.status, l.datetime].some((f) => f.toLowerCase().includes(q));
  });

  return (
    <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{
        padding: isMobile ? "16px 18px" : "18px 24px",
        borderBottom: `1px solid ${C.outlineVariant}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 700, color: C.onSurface }}>Recent Actions</h2>
        <button
          onClick={onExport}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.primary, fontWeight: 700, fontSize: 12, fontFamily: MONO,
            letterSpacing: "0.04em",
          }}
        >
          Export CSV →
        </button>
      </div>

      {isMobile ? (
        <div>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.onSurfaceVariant }}>
              <Icon name="manage_search" size={34} style={{ display: "block", margin: "0 auto 10px", color: C.outlineVariant }} />
              {logs.length === 0 ? "No system actions logged yet." : "No matching log entries found."}
            </div>
          ) : filtered.map((log) => {
            const modCfg = MODULE_CFG[log.module] || MODULE_CFG.System;
            return (
              <div key={log.id} style={{ padding: "14px 18px", borderTop: `1px solid ${C.outlineVariant}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: modCfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={modCfg.icon} size={15} style={{ color: modCfg.text }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.onSurface, flex: 1 }}>{log.action}</span>
                  <StatusBadge status={log.status} />
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, paddingLeft: 38 }}>
                  <span>{log.actor}</span>
                  <span>&bull;</span>
                  <span>{log.datetime}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
            <thead>
              <tr style={{ background: C.surfaceContainerLow }}>
                {["ACTION", "MODULE", "PERFORMED BY", "DATE & TIME", "STATUS"].map((h, i) => (
                  <th key={i} style={{
                    padding: "12px 24px", textAlign: i === 4 ? "right" : "left",
                    fontSize: 10, fontWeight: 500, fontFamily: MONO,
                    color: C.onSurfaceVariant, letterSpacing: "0.1em",
                    textTransform: "uppercase", opacity: 0.7, whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: "center", color: C.onSurfaceVariant }}>
                    <Icon name="manage_search" size={34} style={{ display: "block", margin: "0 auto 10px", color: C.outlineVariant }} />
                    {logs.length === 0 ? "No system actions logged yet." : "No matching log entries found."}
                  </td>
                </tr>
              ) : filtered.map((log, i) => {
                const modCfg = MODULE_CFG[log.module] || MODULE_CFG.System;
                const isHov = hovRow === i;
                return (
                  <tr key={log.id}
                    onMouseEnter={() => setHovRow(i)}
                    onMouseLeave={() => setHovRow(null)}
                    style={{
                      borderTop: `1px solid ${C.outlineVariant}33`,
                      background: isHov ? C.surfaceContainerLow : "transparent",
                      cursor: "pointer", transition: "background 0.12s",
                    }}
                  >
                    <td style={{ padding: "14px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                          background: modCfg.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon name={modCfg.icon} size={18} style={{ color: modCfg.text }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: C.onSurface }}>{log.action}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 4,
                        background: modCfg.bg, color: modCfg.text,
                        fontSize: 10, fontWeight: 700, fontFamily: MONO,
                        letterSpacing: "0.06em", whiteSpace: "nowrap",
                      }}>{log.module}</span>
                    </td>
                    <td style={{ padding: "14px 24px", fontSize: 14, color: C.onSurface }}>{log.actor}</td>
                    <td style={{ padding: "14px 24px", fontSize: 13, color: C.onSurfaceVariant, fontFamily: MONO, whiteSpace: "nowrap" }}>
                      {log.datetime}
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Report Issue Modal ───────────────────────────────────────────────────────
function ReportIssueModal({ onClose, onSubmit }) {
  const [text, setText] = useState("");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 440, maxWidth: "calc(100vw - 32px)", background: C.white, borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.20)", zIndex: 201, fontFamily: SANS, padding: 24,
        boxSizing: "border-box",
      }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: C.primary }}>Report a System Issue</h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: C.onSurfaceVariant }}>
          Describe what's wrong — this will be logged for the technical team to review.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="e.g. The Job Orders table isn't loading after I assign a technician..."
          style={{
            width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`,
            borderRadius: 8, fontSize: 14, fontFamily: SANS, color: C.onSurface,
            background: C.surfaceContainerLow, outline: "none", resize: "vertical", boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8,
            border: `1px solid ${C.outlineVariant}`, background: "none",
            cursor: "pointer", fontSize: 13, fontFamily: MONO, color: C.onSurface,
          }}>Cancel</button>
          <button
            disabled={!text.trim()}
            onClick={() => onSubmit(text)}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 8, border: "none",
              background: text.trim() ? C.primaryContainer : C.outlineVariant,
              color: C.white, cursor: text.trim() ? "pointer" : "default",
              fontSize: 13, fontWeight: 700, fontFamily: MONO,
            }}
          >
            Submit Report
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSystemHistoryPage() {
  const isMobile = useIsMobile();

  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [search,          setSearch]          = useState("");
  const [timeFilter,      setTimeFilter]      = useState("All Time");
  const [moduleFilter,    setModuleFilter]    = useState("All Modules");
  const [statusFilter,    setStatusFilter]    = useState("Any Status");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [reportOpen,      setReportOpen]      = useState(false);
  const [toast,           setToast]           = useState(null);

  // Starts empty — populate from Supabase. No test data.
  const [logs, setLogs] = useState([]);

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

  // Apply module & status filters (time filter is a placeholder until real
  // timestamps can be bucketed against "today" / "this week" server-side)
  const filteredLogs = useMemo(() => logs.filter((l) => {
    const modOk  = moduleFilter === "All Modules" || l.module === moduleFilter;
    const statOk = statusFilter === "Any Status"  || l.status === statusFilter;
    return modOk && statOk;
  }), [logs, moduleFilter, statusFilter]);

  function exportCSV() {
    const header = ["ID", "Action", "Module", "Performed By", "Date & Time", "Status"];
    const rows   = filteredLogs.map((l) => [l.id, l.action, l.module, l.actor, l.datetime, l.status]);
    const csv    = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob   = new Blob([csv], { type: "text/csv" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = "system-history.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported system history as CSV.");
  }

  function handleReportSubmit(text) {
    setReportOpen(false);
    showToast("Issue reported to the technical team.");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{
        marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column",
        paddingBottom: isMobile ? 60 : 0, minWidth: 0,
      }}>
        <TopBar
          onMenuClick={() => setDrawerOpen(true)}
          search={search}
          setSearch={setSearch}
          onReportIssue={() => setReportOpen(true)}
        />

        <div style={{
          flex: 1, padding: isMobile ? "20px 16px 40px" : "32px 32px 48px",
          maxWidth: 1600, width: "100%", margin: "0 auto", boxSizing: "border-box",
        }}>

          {/* Page Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            marginBottom: isMobile ? 20 : 32, flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>System History</h1>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
                Audit trail for infrastructure maintenance, job updates, and administrative actions.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
              <div style={{
                display: "flex", background: C.surfaceContainer,
                border: `1px solid ${C.outlineVariant}`,
                borderRadius: 10, padding: 4, gap: 2, flex: isMobile ? 1 : "initial",
              }}>
                {TIME_FILTERS.map((tf) => {
                  const isActive = timeFilter === tf;
                  return (
                    <button key={tf} onClick={() => setTimeFilter(tf)} style={{
                      padding: "6px 16px", border: "none", cursor: "pointer",
                      borderRadius: 7, fontSize: 12, fontFamily: MONO, flex: isMobile ? 1 : "initial",
                      background: isActive ? C.white : "transparent",
                      color: isActive ? C.primary : C.onSurfaceVariant,
                      fontWeight: isActive ? 700 : 500,
                      boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                      transition: "all 0.15s",
                    }}>{tf}</button>
                  );
                })}
              </div>
              <button
                onClick={() => setMoreFiltersOpen((p) => !p)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", border: `1px solid ${moreFiltersOpen ? C.primaryContainer : C.outlineVariant}`,
                  borderRadius: 8, background: moreFiltersOpen ? C.surfaceContainerLow : C.white, cursor: "pointer",
                  fontSize: 12, fontFamily: MONO, color: C.onSurface, fontWeight: 700,
                }}
              >
                <Icon name="filter_list" size={16} style={{ color: C.onSurfaceVariant }} />
                More Filters
              </button>
            </div>
          </div>

          {/* Bento Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
            gap: 24, alignItems: "start",
          }}>

            {/* ── LEFT COLUMN ────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Filter Row — toggled by "More Filters" on mobile, always visible on desktop */}
              {(!isMobile || moreFiltersOpen) && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 16 }}>
                  <SelectFilter label="Portal Type" options={MODULE_OPTIONS} value={moduleFilter} onChange={setModuleFilter} />
                  <SelectFilter label="Action Status" options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
                  {!isMobile && (
                    <div style={{
                      background: C.white, border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 12, padding: "14px 16px",
                      display: "flex", flexDirection: "column", gap: 4,
                    }}>
                      <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
                        Date Range
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: C.onSurface }}>
                        <Icon name="calendar_today" size={16} style={{ color: C.onSurfaceVariant }} />
                        {logs.length === 0 ? "No data yet" : "All available records"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions Table */}
              <ActionsTable logs={filteredLogs} search={search} onExport={exportCSV} isMobile={isMobile} />
            </div>

            {/* ── RIGHT COLUMN ───────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, position: isMobile ? "static" : "sticky", top: 88 }}>
              <StatsPanel logs={logs} />
              <ActivityTimeline logs={logs} onViewArchive={() => showToast("Full archive view coming soon.")} />
              {!isMobile && <CampusMapCard />}
            </div>
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {reportOpen && <ReportIssueModal onClose={() => setReportOpen(false)} onSubmit={handleReportSubmit} />}

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