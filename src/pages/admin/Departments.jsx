import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  onPrimaryContainer:     "#d26a5f",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
  tertiaryFixed:          "#ffdcc3",
  onTertiaryFixed:        "#2f1500",
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

// ─── Static config (badge styling + faculty options — not department records) ──
const FACULTY_BADGE = {
  "Faculty of Science":     { bg: C.secondaryContainer,     text: C.onSecondaryContainer },
  "Faculty of Engineering": { bg: C.tertiaryFixed,           text: C.onTertiaryFixed      },
  "Faculty of Arts":        { bg: C.surfaceContainerHighest, text: C.onSurfaceVariant      },
  "Administration":         { bg: C.surfaceContainerHigh,    text: C.onSurface             },
};

const HEALTH_BADGE = {
  "Optimal":         { bg: "#DCFCE7", text: "#166534" },
  "Maintenance Due": { bg: "#FEF3C7", text: "#92400E" },
  "Critical":        { bg: C.errorContainer, text: C.onErrorContainer },
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

function FacultyBadge({ faculty }) {
  const cfg = FACULTY_BADGE[faculty] || FACULTY_BADGE["Administration"];
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 5,
      background: cfg.bg, color: cfg.text,
      fontSize: 11, fontWeight: 700, fontFamily: MONO,
      letterSpacing: "0.04em", whiteSpace: "nowrap",
    }}>{faculty}</span>
  );
}

function HealthBadge({ health }) {
  const cfg = HEALTH_BADGE[health] || HEALTH_BADGE["Optimal"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      borderRadius: 5, background: cfg.bg, color: cfg.text,
      fontSize: 11, fontWeight: 700, fontFamily: MONO,
    }}>{health}</span>
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
      {/* Brand */}
      <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 6,
            background: "rgba(255,255,255,0.14)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="account_balance" size={22} filled style={{ color: C.white }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontFamily: MONO }}>
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
                padding: "11px 16px",
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? C.white : "rgba(255,255,255,0.65)",
                fontWeight: isActive ? 700 : 400,
                borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
                transition: "background 0.15s", borderRadius: isActive ? 0 : 4,
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

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 16px", background: "transparent",
            color: "rgba(255,255,255,0.5)", border: "none",
            cursor: "pointer", fontSize: 12, fontFamily: MONO, borderRadius: 4,
          }}
        >
          <Icon name="account_circle" size={18} style={{ color: "rgba(255,255,255,0.5)" }} /> User Profile
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 16px", background: "transparent",
            color: "rgba(255,255,255,0.5)", border: "none",
            cursor: "pointer", fontSize: 12, fontFamily: MONO, borderRadius: 4,
          }}
        >
          <Icon name="logout" size={18} style={{ color: "rgba(255,255,255,0.5)" }} /> Logout
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
      background: "rgba(249,249,255,0.92)", backdropFilter: "blur(12px)",
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
            placeholder="Search departments, HODs, or locations…"
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16,
              paddingTop: 9, paddingBottom: 9,
              background: C.surfaceContainerLow, border: "none",
              borderRadius: 8, fontSize: 14, outline: "none",
              color: C.onSurface, boxSizing: "border-box", fontFamily: SANS,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10 }}>
        <button onClick={() => navigate("/admin/notifications")} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
          <Icon name="notifications" size={22} />
          <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, background: C.error, borderRadius: "50%" }} />
        </button>
        {!isMobile && (
          <>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
              <Icon name="settings" size={22} />
            </button>
            <div style={{ width: 1, height: 28, background: C.outlineVariant, margin: "0 6px" }} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.onSurface, lineHeight: 1.2 }}>Admin User</div>
              <div style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO }}>Estate Manager</div>
            </div>
          </>
        )}
        <div style={{
          width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: "50%",
          background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: C.onSurfaceVariant, fontSize: 15, flexShrink: 0,
        }}>A</div>
      </div>
    </header>
  );
}

// ─── Department Card ──────────────────────────────────────────────────────────
function DeptCard({ dept, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onSelect(dept)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.white,
        border: `1px solid ${C.outlineVariant}`,
        borderRadius: 12, padding: 24,
        cursor: "pointer", position: "relative", overflow: "hidden",
        boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "box-shadow 0.2s, transform 0.18s",
        fontFamily: SANS,
      }}
    >
      <div style={{
        position: "absolute", top: 10, right: 10,
        opacity: hov ? 0.18 : 0.09, transition: "opacity 0.2s",
        color: C.primaryContainer, fontSize: 64,
        lineHeight: 1, fontFamily: "Material Symbols Outlined",
        fontVariationSettings: "'FILL' 0,'wght' 300",
        userSelect: "none", pointerEvents: "none",
      }}>{dept.bgIcon}</div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: C.surfaceContainerHigh,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name={dept.icon} size={24} filled style={{ color: C.primaryContainer }} />
        </div>
        <FacultyBadge faculty={dept.faculty} />
      </div>

      <h4 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: C.onSurface }}>{dept.name}</h4>
      <p style={{ margin: "0 0 16px", fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.06em" }}>
        {dept.code}
      </p>

      <div style={{ borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: "person", label: "HOD Name", value: dept.hod },
          { icon: "location_on", label: "Location", value: dept.location },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Icon name={icon} size={18} style={{ color: C.primaryContainer, marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", opacity: 0.7 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.onSurface }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: C.surfaceDim, border: `2px solid ${C.white}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: C.onSurface,
          fontFamily: MONO,
        }}>+{dept.members}</div>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(dept); }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer",
            color: C.primaryContainer, fontWeight: 700,
            fontSize: 12, fontFamily: MONO,
          }}
        >
          View Details <Icon name="arrow_forward" size={14} style={{ color: C.primaryContainer }} />
        </button>
      </div>
    </div>
  );
}

// ─── Add Department Placeholder Card ─────────────────────────────────────────
function AddCard({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.surfaceContainerLow,
        border: `2px dashed ${hov ? C.primaryContainer : C.outlineVariant}`,
        borderRadius: 12, padding: 24,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", cursor: "pointer",
        transition: "border-color 0.18s, box-shadow 0.18s",
        boxShadow: hov ? "0 4px 16px rgba(74,4,4,0.10)" : "none",
        minHeight: 280, fontFamily: SANS,
      }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: hov ? C.primaryContainer : C.surfaceContainerHigh,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16, transition: "background 0.18s",
      }}>
        <Icon name="add_business" size={28} style={{ color: hov ? C.white : C.onSurfaceVariant }} />
      </div>
      <h4 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.onSurfaceVariant }}>Create New</h4>
      <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant, maxWidth: 180, lineHeight: 1.5 }}>
        Initialize a new academic or administrative department profile.
      </p>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ dept, onClose, onEdit, onDelete, onQuickAction }) {
  if (!dept) return null;
  const isMobile = useIsMobile();

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: isMobile ? "100%" : 440,
        background: C.white, zIndex: 101,
        boxShadow: "-6px 0 32px rgba(0,0,0,0.13)",
        display: "flex", flexDirection: "column",
        fontFamily: SANS, overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 10,
                background: C.surfaceContainerHigh,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={dept.icon} size={26} filled style={{ color: C.primaryContainer }} />
              </div>
              <div>
                <FacultyBadge faculty={dept.faculty} />
                <h2 style={{ margin: "6px 0 2px", fontSize: 20, fontWeight: 700, color: C.onSurface }}>{dept.name}</h2>
                <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.06em" }}>{dept.code}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${C.outlineVariant}` }}>
          {[
            { label: "Members",   value: `+${dept.members}`,  icon: "group" },
            { label: "Assets",    value: dept.assets,         icon: "inventory_2" },
            { label: "Open Reqs", value: dept.openRequests,   icon: "list_alt" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "16px 18px", borderRight: i < 2 ? `1px solid ${C.outlineVariant}` : "none", textAlign: "center" }}>
              <Icon name={s.icon} size={18} style={{ color: C.onSurfaceVariant, display: "block", margin: "0 auto 4px" }} />
              <div style={{ fontSize: 22, fontWeight: 700, color: C.onSurface }}>{s.value}</div>
              <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            ["HOD",      dept.hod,      "person"],
            ["Location", dept.location, "location_on"],
            ["Faculty",  dept.faculty,  "school"],
          ].map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: C.surfaceContainerHigh,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={icon} size={18} style={{ color: C.primaryContainer }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.onSurface }}>{value}</div>
              </div>
            </div>
          ))}

          {/* Health Status */}
          <div>
            <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Health Status</div>
            <HealthBadge health={dept.health} />
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Quick Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "request",  icon: "assignment_add", label: "File Maintenance Request", path: "/admin/requests" },
                { key: "assets",   icon: "inventory_2",    label: "View Department Assets",    path: "/admin/assets" },
                { key: "history",  icon: "history",        label: "View Request History",      path: "/admin/system-history" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => onQuickAction(a)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", background: C.surfaceContainerLow,
                    border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
                    cursor: "pointer", color: C.onSurface, fontSize: 13,
                    fontFamily: SANS, textAlign: "left",
                  }}
                >
                  <Icon name={a.icon} size={18} style={{ color: C.primaryContainer }} />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={() => onEdit(dept)} style={{
            flex: 1, padding: "11px 16px", background: C.primaryContainer,
            color: C.white, border: "none", borderRadius: 8, cursor: "pointer",
            fontWeight: 700, fontSize: 12, fontFamily: MONO,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Icon name="edit" size={15} style={{ color: C.white }} />
            Edit Department
          </button>
          <button onClick={() => onDelete(dept.id)} style={{
            padding: "11px 14px",
            background: C.errorContainer, color: C.onErrorContainer,
            border: "none", borderRadius: 8, cursor: "pointer",
            fontWeight: 700, fontSize: 12, fontFamily: MONO,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <Icon name="delete" size={15} style={{ color: C.onErrorContainer }} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Add / Edit Department Modal ──────────────────────────────────────────────
function DeptFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ?? { name: "", code: "", faculty: "Faculty of Science", hod: "", location: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
    fontSize: 14, fontFamily: SANS, color: C.onSurface,
    background: C.surfaceContainerLow, outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant,
    letterSpacing: "0.08em", textTransform: "uppercase",
    display: "block", marginBottom: 5,
  };

  function handleSubmit() {
    if (!form.name.trim() || !form.code.trim()) return;
    onSave(form);
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
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${C.outlineVariant}`,
          background: C.surfaceContainerLow,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>
              {isEdit ? "Edit Department" : "Add Department"}
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>
              {isEdit ? `Updating ${initial.code}` : "Initialize a new university department profile"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={labelStyle}>Department Name</label>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Physics" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Dept. Code</label>
              <input value={form.code} onChange={set("code")} placeholder="e.g. PHY-SCI-05" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Faculty</label>
            <select value={form.faculty} onChange={set("faculty")} style={{ ...inputStyle, cursor: "pointer" }}>
              {Object.keys(FACULTY_BADGE).map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Head of Department (HOD)</label>
            <input value={form.hod} onChange={set("hod")} placeholder="e.g. Dr. Jane Doe" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input value={form.location} onChange={set("location")} placeholder="e.g. Science Complex, Wing C" style={inputStyle} />
          </div>
        </div>

        <div style={{
          padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`,
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
            disabled={!form.name.trim() || !form.code.trim()}
            style={{
              padding: "9px 20px",
              background: form.name.trim() && form.code.trim() ? C.primaryContainer : C.outlineVariant,
              color: C.white, border: "none", borderRadius: 8,
              cursor: form.name.trim() && form.code.trim() ? "pointer" : "default",
              fontSize: 12, fontFamily: MONO, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Icon name={isEdit ? "save" : "add"} size={15} style={{ color: C.white }} />
            {isEdit ? "Save Changes" : "Add Department"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Summary Table ────────────────────────────────────────────────────────────
function SummaryTable({ departments, onExport, onPrint, onSelect, isMobile }) {
  return (
    <div style={{ marginTop: 48, background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Table Header */}
      <div style={{
        padding: "16px 24px",
        borderBottom: `1px solid ${C.outlineVariant}`,
        background: C.surfaceContainerLow,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.primaryContainer }}>
          Department Status Summary
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onExport} style={{
            padding: "6px 14px", fontSize: 11, fontFamily: MONO,
            border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
            background: "none", cursor: "pointer", color: C.onSurface,
          }}>Export CSV</button>
          <button onClick={onPrint} style={{
            padding: "6px 14px", fontSize: 11, fontFamily: MONO,
            border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
            background: "none", cursor: "pointer", color: C.onSurface,
          }}>Print Layout</button>
        </div>
      </div>

      {/* Table / mobile cards */}
      {departments.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: C.onSurfaceVariant }}>
          <Icon name="domain" size={36} style={{ display: "block", margin: "0 auto 10px", color: C.outlineVariant }} />
          No departments to summarize yet.
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => onSelect(dept)}
              style={{ padding: "14px 20px", borderTop: `1px solid ${C.outlineVariant}33`, cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.onSurface }}>{dept.name}</span>
                <HealthBadge health={dept.health} />
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 12, color: C.onSurfaceVariant }}>
                <span>{dept.assets} assets</span>
                <span style={{ color: dept.openRequests > 5 ? C.error : C.onSurfaceVariant, fontWeight: dept.openRequests > 5 ? 700 : 400 }}>
                  {dept.openRequests} open reqs
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
            <thead>
              <tr style={{ background: C.white }}>
                {["Department", "Faculty", "Assets Count", "Open Requests", "Health Status", ""].map((h, i) => (
                  <th key={i} style={{
                    padding: "12px 24px", textAlign: i === 5 ? "right" : "left",
                    fontSize: 10, fontWeight: 500, fontFamily: MONO,
                    color: C.onSurfaceVariant, letterSpacing: "0.1em",
                    textTransform: "uppercase", opacity: 0.7, whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <SummaryRow key={dept.id} dept={dept} onSelect={onSelect} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ dept, onSelect }) {
  const [hov, setHov] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderTop: `1px solid ${C.outlineVariant}33`,
        background: hov ? C.surfaceContainerLow : "transparent",
        transition: "background 0.12s", cursor: "pointer",
      }}
      onClick={() => onSelect(dept)}
    >
      <td style={{ padding: "14px 24px", fontWeight: 700, fontSize: 14, color: C.onSurface }}>{dept.name}</td>
      <td style={{ padding: "14px 24px" }}><FacultyBadge faculty={dept.faculty} /></td>
      <td style={{ padding: "14px 24px", fontSize: 14, color: C.onSurface }}>{dept.assets}</td>
      <td style={{ padding: "14px 24px" }}>
        <span style={{ fontSize: 14, fontWeight: dept.openRequests > 5 ? 700 : 400, color: dept.openRequests > 5 ? C.error : C.onSurface }}>
          {dept.openRequests}
        </span>
      </td>
      <td style={{ padding: "14px 24px" }}><HealthBadge health={dept.health} /></td>
      <td style={{ padding: "14px 24px", textAlign: "right", position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((p) => !p)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: C.onSurfaceVariant, display: "flex",
            opacity: hov || menuOpen ? 1 : 0.4, transition: "opacity 0.12s", marginLeft: "auto",
          }}
        >
          <Icon name="more_vert" size={20} />
        </button>
        {menuOpen && (
          <div style={{
            position: "absolute", top: "100%", right: 24, marginTop: 4,
            background: C.white, border: `1px solid ${C.outlineVariant}`,
            borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 30, width: 170, overflow: "hidden", textAlign: "left",
          }}>
            <button onClick={() => { onSelect(dept); setMenuOpen(false); }} style={menuItemStyle}>
              <Icon name="visibility" size={16} /> View Details
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

const menuItemStyle = {
  width: "100%", display: "flex", alignItems: "center", gap: 10,
  padding: "10px 14px", background: "none", border: "none",
  cursor: "pointer", fontSize: 13, fontFamily: SANS, color: C.onSurface, textAlign: "left",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDepartmentsPage() {
  const isMobile = useIsMobile();
  const navigate  = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [adding, setAdding]         = useState(false);
  const [editing, setEditing]       = useState(null);
  const [toast, setToast]           = useState(null);

  // Starts empty — populate from Supabase. No test data.
  const [departments, setDepartments] = useState([]);

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

  // Search filter
  const filtered = useMemo(() => departments.filter((d) => {
    const q = search.toLowerCase();
    return !q || [d.name, d.code, d.faculty, d.hod, d.location].some((f) => f.toLowerCase().includes(q));
  }), [departments, search]);

  // Live totals — no hardcoded "412" faculty count
  const totalMembers = departments.reduce((sum, d) => sum + (d.members || 0), 0);
  const optimalCount  = departments.filter((d) => d.health === "Optimal").length;
  const attnCount     = departments.filter((d) => d.health !== "Optimal").length;

  function handleAdd(form) {
    const newDept = {
      id: Date.now(),
      ...form,
      icon: "domain",
      bgIcon: "corporate_fare",
      members: 0,
      assets: 0,
      openRequests: 0,
      health: "Optimal",
    };
    setDepartments((prev) => [...prev, newDept]);
    setAdding(false);
    showToast(`${newDept.name} added.`);
  }

  function handleSaveEdit(form) {
    setDepartments((prev) => prev.map((d) => (d.id === editing.id ? { ...d, ...form } : d)));
    setEditing(null);
    setSelected(null);
    showToast(`${form.name} updated.`);
  }

  function handleDelete(id) {
    const dept = departments.find((d) => d.id === id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    setSelected(null);
    showToast(`${dept?.name ?? "Department"} removed.`);
  }

  function handleQuickAction(action) {
    setSelected(null);
    navigate(action.path);
  }

  function exportCSV() {
    const header = ["Name", "Code", "Faculty", "HOD", "Location", "Members", "Assets", "Open Requests", "Health"];
    const rows   = filtered.map((d) => [d.name, d.code, d.faculty, d.hod, d.location, d.members, d.assets, d.openRequests, d.health]);
    const csv    = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob   = new Blob([csv], { type: "text/csv" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = "departments.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported departments as CSV.");
  }

  function printLayout() {
    window.print();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{
        marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column",
        paddingBottom: isMobile ? 60 : 0, minWidth: 0,
      }}>
        <TopBar onMenuClick={() => setDrawerOpen(true)} search={search} setSearch={setSearch} />

        <div style={{
          flex: 1, padding: isMobile ? "20px 16px" : 32,
          maxWidth: 1600, width: "100%", margin: "0 auto", boxSizing: "border-box",
        }}>

          {/* Page Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            gap: 16, marginBottom: isMobile ? 20 : 32,
          }}>
            <div>
              <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO }}>Infrastructure</span>
                <Icon name="chevron_right" size={14} style={{ color: C.onSurfaceVariant }} />
                <span style={{ fontSize: 12, color: C.primaryContainer, fontWeight: 700, fontFamily: MONO }}>Departments</span>
              </nav>
              <h2 style={{ margin: "0 0 6px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.primary }}>Departments</h2>
              <p style={{ margin: 0, fontSize: isMobile ? 13 : 15, color: C.onSurfaceVariant, maxWidth: 600, lineHeight: 1.6 }}>
                Manage administrative units, faculty departments, and facility oversight centers within the university infrastructure.
              </p>
            </div>
            <button onClick={() => setAdding(true)} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 22px", background: C.primaryContainer, color: C.white,
              border: "none", borderRadius: 10, cursor: "pointer",
              fontWeight: 700, fontSize: 14, fontFamily: SANS,
              boxShadow: "0 2px 10px rgba(74,4,4,0.25)",
              width: isMobile ? "100%" : "auto", justifyContent: "center",
            }}>
              <Icon name="add" size={18} style={{ color: C.white }} />
              Add Department
            </button>
          </div>

          {/* Hero Banner */}
          <div style={{
            position: "relative", width: "100%", height: isMobile ? 170 : 220,
            borderRadius: 16, overflow: "hidden", marginBottom: isMobile ? 20 : 32,
            border: `1px solid ${C.outlineVariant}`,
            background: `linear-gradient(135deg, ${C.primaryContainer} 0%, #7e2b23 60%, #a03c34 100%)`,
          }}>
            {!isMobile && [200, 280, 360, 440].map((size, i) => (
              <div key={i} style={{
                position: "absolute", right: -60 + i * 20, top: "50%",
                transform: "translateY(-50%)",
                width: size, height: size, borderRadius: "50%",
                border: "1px solid rgba(255,180,170,0.15)",
                pointerEvents: "none",
              }} />
            ))}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(33,0,0,0.75) 0%, rgba(33,0,0,0.15) 60%, transparent 100%)",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              padding: isMobile ? 20 : 32,
            }}>
              <h3 style={{ margin: "0 0 6px", fontSize: isMobile ? 17 : 22, fontWeight: 700, color: C.white }}>
                Main Campus Hierarchy
              </h3>
              <p style={{ margin: 0, fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.8)" }}>
                Total active departments: {departments.length} &nbsp;|&nbsp; Total members: {totalMembers}
              </p>
            </div>
            <div style={{ position: "absolute", top: isMobile ? 14 : 20, right: isMobile ? 14 : 24, display: "flex", gap: isMobile ? 6 : 10 }}>
              {[
                { icon: "check_circle", label: "Optimal", count: optimalCount, color: "#DCFCE7", text: "#166534" },
                { icon: "warning",      label: "Needs Attn", count: attnCount, color: C.errorContainer, text: C.onErrorContainer },
              ].map((chip) => (
                <div key={chip.label} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: isMobile ? "5px 9px" : "6px 12px", borderRadius: 20,
                  background: chip.color, color: chip.text,
                  fontSize: isMobile ? 10 : 11, fontWeight: 700, fontFamily: MONO,
                }}>
                  <Icon name={chip.icon} size={isMobile ? 12 : 14} filled style={{ color: chip.text }} />
                  {chip.count}{!isMobile && ` ${chip.label}`}
                </div>
              ))}
            </div>
          </div>

          {/* Search result count */}
          {search && (
            <p style={{ fontSize: 13, color: C.onSurfaceVariant, marginBottom: 16, fontFamily: MONO }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
            </p>
          )}

          {/* Department Cards Grid */}
          {departments.length === 0 && !search ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: isMobile ? 16 : 24,
            }}>
              <AddCard onClick={() => setAdding(true)} />
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
              gap: isMobile ? 16 : 24,
            }}>
              {filtered.map((dept) => (
                <DeptCard key={dept.id} dept={dept} onSelect={setSelected} />
              ))}
              {!search && <AddCard onClick={() => setAdding(true)} />}
              {search && filtered.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: C.onSurfaceVariant }}>
                  No departments match "{search}".
                </div>
              )}
            </div>
          )}

          {/* Status Summary Table */}
          <SummaryTable
            departments={filtered}
            onExport={exportCSV}
            onPrint={printLayout}
            onSelect={setSelected}
            isMobile={isMobile}
          />
        </div>
      </main>

      {isMobile && <BottomNav />}

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          dept={selected}
          onClose={() => setSelected(null)}
          onEdit={(d) => { setEditing(d); setSelected(null); }}
          onDelete={handleDelete}
          onQuickAction={handleQuickAction}
        />
      )}

      {/* Add Modal */}
      {adding && <DeptFormModal onClose={() => setAdding(false)} onSave={handleAdd} />}

      {/* Edit Modal */}
      {editing && <DeptFormModal initial={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} />}

      {/* Toast */}
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