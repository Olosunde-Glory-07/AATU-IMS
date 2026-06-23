import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  primaryFixedDim:        "#ffb4aa",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
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

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/student/dashboard"     },
  { icon: "list_alt",      label: "My Requests",   path: "/student/my-requests"   },
  { icon: "history",       label: "My History",    path: "/student/my-history"    },
  { icon: "notifications", label: "Notifications", path: "/student/notifications" },
];

// ─── Status / category config ─────────────────────────────────────────────────
const STATUS_CFG = {
  Completed: { bg: "#DCFCE7", text: "#166534", dot: C.secondary,  icon: "check_circle"  },
  Emergency: { bg: C.errorContainer, text: C.error, dot: C.error, icon: "priority_high" },
  Cancelled: { bg: C.surfaceContainerHighest, text: C.onSurfaceVariant, dot: C.outline, icon: "cancel" },
};

const CATEGORY_ICONS = {
  Electrical:         "bolt",
  Plumbing:           "water_drop",
  HVAC:               "hvac",
  Structural:         "domain",
  "IT Services":      "router",
  Furniture:          "chair",
  Lighting:           "light_mode",
  Elevator:           "elevator",
  Carpentry:          "handyman",
  "Carpentry / Glazing": "window",
  Other:              "build",
};

const REQUEST_TYPES = [
  "All Types","Electrical","Plumbing","HVAC","Structural",
  "IT Services","Furniture","Lighting","Elevator","Carpentry","Carpentry / Glazing","Other",
];

const STATUS_KEYS = ["Completed", "Cancelled"];

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mob;
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function Icon({ name, size = 22, filled = false, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size, lineHeight: 1, verticalAlign: "middle",
      fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400",
      ...style,
    }}>{name}</span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ currentPath, onNavigate, onLogout, firstName }) {
  return (
    <aside style={{
      width: 260, background: C.primaryContainer, color: C.white,
      display: "flex", flexDirection: "column", height: "100vh",
      position: "fixed", left: 0, top: 0, zIndex: 50, overflowY: "auto", fontFamily: SANS,
    }}>
      <div style={{ padding: "24px 24px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="school" size={20} filled style={{ color: C.white }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>Student Portal</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "8px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          return (
            <button key={item.label} onClick={() => onNavigate(item.path)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
              background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
              color: isActive ? C.white : "rgba(255,255,255,0.70)",
              fontWeight: isActive ? 700 : 400,
              borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent",
              border: "none", cursor: "pointer", textAlign: "left",
              fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO, transition: "background 0.15s",
            }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryFixedDim, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.primary, fontSize: 13 }}>
            {firstName[0]}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.white }}>{firstName}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, textTransform: "uppercase" }}>Student</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, borderRadius: 6 }}>
          <Icon name="logout" size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
          Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Drawer ────────────────────────────────────────────────────────────
function MobileDrawer({ open, onClose, currentPath, onNavigate, onLogout, firstName }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 70 }} />
      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, background: C.primaryContainer, zIndex: 71, display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU Student</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.7)", display: "flex" }}>
            <Icon name="close" size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "4px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            return (
              <button key={item.label} onClick={() => { onNavigate(item.path); onClose(); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400,
                borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
              }}>
                <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
            <Icon name="logout" size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────────────────────
function MobileBottomNav({ currentPath, onNavigate }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: C.white, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 62 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath.startsWith(item.path);
        return (
          <button key={item.label} onClick={() => onNavigate(item.path)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 3, background: "none", border: "none",
            cursor: "pointer", color: isActive ? C.primaryContainer : C.onSurfaceVariant,
            fontFamily: MONO, fontSize: 9, fontWeight: isActive ? 700 : 400,
            borderTop: isActive ? `2px solid ${C.primaryContainer}` : "2px solid transparent",
          }}>
            <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ search, setSearch, onMenu, isMobile, onNavigate, firstName }) {
  return (
    <header style={{
      height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 16px 0 20px", position: "sticky", top: 0, zIndex: 40,
      background: "rgba(249,249,255,0.94)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 10,
    }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurface, display: "flex", flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 360, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search history…"
          style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 8, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {!isMobile && (
          <>
            <button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
              <Icon name="settings" size={22} />
            </button>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryFixedDim, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.primary, fontSize: 13 }}>
              {firstName[0]}
            </div>
          </>
        )}
        <button onClick={() => onNavigate("/student/my-requests")} style={{
          background: C.primary, color: C.white, border: "none", cursor: "pointer",
          padding: isMobile ? "7px 12px" : "8px 18px", borderRadius: 8,
          fontSize: isMobile ? 11 : 12, fontWeight: 700, fontFamily: MONO,
          display: "flex", alignItems: "center", gap: 5, transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <Icon name="add" size={15} style={{ color: C.white }} />
          New Request
        </button>
      </div>
    </header>
  );
}

// ─── Filters Panel ────────────────────────────────────────────────────────────
function FiltersPanel({ typeFilter, setTypeFilter, statusFilters, toggleStatus, dateFrom, setDateFrom, dateTo, setDateTo, onReset, totalCount }) {
  const inp = {
    width: "100%", padding: "8px 12px",
    border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
    fontSize: 13, fontFamily: SANS, color: C.onSurface,
    background: C.surfaceContainerLow, outline: "none", boxSizing: "border-box",
  };
  const lbl = { display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters Card */}
      <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.onSurface }}>Filters</h3>
          <button onClick={onReset} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontFamily: MONO, color: C.primaryContainer, fontWeight: 700 }}>
            Reset
          </button>
        </div>
        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Request Type */}
          <div>
            <label style={lbl}>Request Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
              {REQUEST_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={lbl}>Status</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STATUS_KEYS.map((s) => {
                const cfg = STATUS_CFG[s];
                return (
                  <label key={s} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div
                      onClick={() => toggleStatus(s)}
                      style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${statusFilters[s] ? C.primaryContainer : C.outlineVariant}`,
                        background: statusFilters[s] ? C.primaryContainer : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      {statusFilters[s] && <Icon name="check" size={12} style={{ color: C.white }} />}
                    </div>
                    <span style={{ fontSize: 13, color: C.onSurface, display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                      {s}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label style={lbl}>Date Range</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={inp} />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={inp} />
            </div>
          </div>

          <button onClick={onReset} style={{ width: "100%", padding: "10px 0", background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface, transition: "background 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainerHighest}
            onMouseLeave={(e) => e.currentTarget.style.background = C.surfaceContainerHigh}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Champion card */}
      <div style={{ position: "relative", overflow: "hidden", background: C.primaryContainer, borderRadius: 14, padding: "24px 20px", color: C.white }}>
        {[100, 160, 220].map((s, i) => (
          <div key={i} style={{ position: "absolute", right: -40 + i * 10, bottom: -40 + i * 10, width: s, height: s, borderRadius: "50%", border: "1px solid rgba(255,180,170,0.12)", pointerEvents: "none" }} />
        ))}
        <div style={{ position: "relative", zIndex: 1 }}>
          <Icon name="verified_user" size={32} style={{ color: C.primaryFixedDim, display: "block", marginBottom: 12 }} filled />
          <h4 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: C.white }}>Facility Champion</h4>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            You've helped identify <strong style={{ color: C.primaryFixedDim }}>{totalCount}</strong> infrastructure issue{totalCount !== 1 ? "s" : ""}. Your reports keep the campus safe.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ item, onClose }) {
  if (!item) return null;
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.Completed;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0, width: "min(420px, 100vw)",
        background: C.white, zIndex: 101, boxShadow: "-6px 0 32px rgba(0,0,0,0.12)",
        display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", borderRadius: 99, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700, fontFamily: MONO, display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name={cfg.icon} size={13} filled style={{ color: cfg.text }} />
                  {item.status}
                </span>
                {item.emergency && (
                  <span style={{ padding: "3px 10px", borderRadius: 99, background: C.errorContainer, color: C.error, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>
                    Emergency
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={CATEGORY_ICONS[item.category] || "build"} size={22} style={{ color: C.primaryContainer }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>{item.id}</p>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{item.title}</h3>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex", flexShrink: 0 }}>
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            ["Category",  item.category, "category"       ],
            ["Date Filed",item.date,     "calendar_today" ],
          ].filter(([,v]) => v).map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: C.surfaceContainerLow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={icon} size={17} style={{ color: C.onSurfaceVariant }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500, color: C.onSurface }}>{value}</p>
              </div>
            </div>
          ))}

          {/* Description */}
          {item.description && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</p>
              <div style={{ padding: "12px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: C.onSurface, lineHeight: 1.6 }}>{item.description}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          {item.timeline && item.timeline.length > 0 && (
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Request Timeline
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {item.timeline.map((step, i) => {
                  const isDone = step.state === "done";
                  return (
                    <div key={i} style={{ display: "flex", gap: 14, position: "relative", paddingBottom: i < item.timeline.length - 1 ? 20 : 0 }}>
                      {i < item.timeline.length - 1 && (
                        <div style={{ position: "absolute", left: 10, top: 24, bottom: 0, width: 2, background: isDone ? C.secondary : C.outlineVariant }} />
                      )}
                      <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: isDone ? C.secondary : C.surfaceContainerHigh, border: `2px solid ${isDone ? C.secondary : C.outlineVariant}` }}>
                        {isDone && <Icon name="check" size={12} style={{ color: C.white }} />}
                      </div>
                      <div style={{ flex: 1, paddingTop: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDone ? C.onSurface : C.onSurfaceVariant }}>{step.label}</p>
                          <span style={{ fontSize: 10, fontFamily: MONO, color: C.outline, flexShrink: 0 }}>{step.time}</span>
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.4 }}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}` }}>
          <button onClick={onClose} style={{ width: "100%", padding: "10px 0", background: C.surfaceContainerHigh, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, color: C.onSurface }}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
function TimelineItem({ item, onSelect }) {
  const [hov, setHov] = useState(false);
  const cfg = STATUS_CFG[item.status] || STATUS_CFG.Completed;
  const catIcon = CATEGORY_ICONS[item.category] || "build";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onSelect(item)}
      style={{ position: "relative", paddingLeft: 48, cursor: "pointer" }}
    >
      {/* Timeline dot */}
      <div style={{
        position: "absolute", left: 0, top: 22,
        width: 20, height: 20, borderRadius: "50%",
        background: cfg.dot,
        border: `3px solid ${C.surface}`,
        boxShadow: `0 0 0 2px ${cfg.dot}40`,
        zIndex: 1,
        transform: hov ? "scale(1.2)" : "scale(1)",
        transition: "transform 0.18s",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={cfg.icon} size={10} filled style={{ color: C.white }} />
      </div>

      {/* Card */}
      <div style={{
        background: C.white, borderRadius: 14, padding: "18px 20px",
        border: `1px solid ${hov ? C.outlineVariant : C.outlineVariant}`,
        boxShadow: hov ? "0 6px 18px rgba(0,0,0,0.09)" : "0 1px 4px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "box-shadow 0.18s, transform 0.15s",
      }}>
        {/* Top row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name={catIcon} size={20} style={{ color: C.primaryContainer }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant }}>{item.id}</span>
                {item.emergency && (
                  <span style={{ padding: "1px 7px", borderRadius: 4, background: C.errorContainer, color: C.error, fontSize: 9, fontWeight: 700, fontFamily: MONO, textTransform: "uppercase" }}>Emergency</span>
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{item.title}</h3>
            </div>
          </div>
          <span style={{
            padding: "3px 10px", borderRadius: 99, flexShrink: 0,
            background: cfg.bg, color: cfg.text,
            fontSize: 10, fontWeight: 700, fontFamily: MONO,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Icon name={cfg.icon} size={12} filled style={{ color: cfg.text }} />
            {item.status}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.description}
          </p>
        )}

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", borderRadius: 4, background: C.surfaceContainerHigh, color: C.onSurfaceVariant, fontSize: 11, fontFamily: MONO }}>
              {item.category}
            </span>
            <span style={{ fontSize: 12, color: C.outline, fontFamily: MONO }}>
              {item.date}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.primaryContainer, fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: hov ? 1 : 0, transition: "opacity 0.15s" }}>
            View details <Icon name="arrow_forward" size={15} style={{ color: C.primaryContainer }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyHistory() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();

  const [search,        setSearch]        = useState("");
  const [typeFilter,    setTypeFilter]    = useState("All Types");
  const [statusFilters, setStatusFilters] = useState({ Completed: true, Cancelled: true });
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [showFilters,   setShowFilters]   = useState(false);
  const [visibleCount,  setVisibleCount]  = useState(6);
  const [loading,       setLoading]       = useState(true);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [history,    setHistory]   = useState([]);
  const [firstName,  setFirstName] = useState("Student");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        // TODO: Replace with real Supabase queries:
        //
        // const { data: profile } = await supabase
        //   .from('profiles').select('full_name').eq('id', user.id).single();
        // setFirstName(profile?.full_name?.split(' ')[0] ?? 'Student');
        //
        // const { data: reqs } = await supabase
        //   .from('requests')
        //   .select('id, title, description, category, status, created_at, emergency')
        //   .eq('created_by', user.id)
        //   .in('status', ['Completed', 'Cancelled'])
        //   .order('created_at', { ascending: false });
        //
        // const formatted = (reqs ?? []).map(r => ({
        //   ...r,
        //   date: new Date(r.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }),
        //   month: new Date(r.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' }),
        //   timeline: [], // populate from request_events table
        // }));
        // setHistory(formatted);

        // ── Placeholder ─────────────────────────────────────────────────────
        setFirstName("Student");
        setHistory([]);
      } catch (err) {
        console.error("MyHistory fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const toggleStatus = (key) =>
    setStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const resetFilters = () => {
    setSearch(""); setTypeFilter("All Types");
    setStatusFilters({ Completed: true, Cancelled: true });
    setDateFrom(""); setDateTo("");
    setVisibleCount(6);
  };

  const go = useCallback((path) => navigate(path), [navigate]);

  // ── Filtered & grouped ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return history.filter((h) => {
      const matchSearch  = !q || [h.title, h.id, h.category].some((f) => f?.toLowerCase().includes(q));
      const matchType    = typeFilter === "All Types" || h.category === typeFilter || h.category?.includes(typeFilter.replace(" / Glazing",""));
      const matchStatus  = statusFilters[h.status] ?? false;
      let   matchDate    = true;
      if (dateFrom || dateTo) {
        const d = new Date(h.date);
        if (dateFrom && d < new Date(dateFrom)) matchDate = false;
        if (dateTo   && d > new Date(dateTo))   matchDate = false;
      }
      return matchSearch && matchType && matchStatus && matchDate;
    });
  }, [history, search, typeFilter, statusFilters, dateFrom, dateTo]);

  const visible = filtered.slice(0, visibleCount);

  const grouped = useMemo(() => {
    const map = {};
    visible.forEach((h) => {
      if (!map[h.month]) map[h.month] = [];
      map[h.month].push(h);
    });
    return map;
  }, [visible]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const completedCount = history.filter((h) => h.status === "Completed").length;
  const cancelledCount = history.filter((h) => h.status === "Cancelled").length;
  const emergencyCount = history.filter((h) => h.emergency).length;

  const STAT_CARDS = [
    { icon: "check_circle", iconBg: "#DCFCE7", iconColor: C.secondary,         label: "Completed", value: completedCount },
    { icon: "cancel",       iconBg: C.surfaceContainerHighest, iconColor: C.onSurfaceVariant, label: "Cancelled", value: cancelledCount },
    { icon: "priority_high",iconBg: C.errorContainer, iconColor: C.error,      label: "Emergency", value: emergencyCount },
  ];

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box}`}</style>

      {/* Sidebar */}
      {!isMobile && <Sidebar currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} firstName={firstName} />}
      {isMobile && (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
          currentPath={location.pathname} onNavigate={go}
          onLogout={() => navigate("/login")} firstName={firstName} />
      )}

      <div style={{ marginLeft: isMobile ? 0 : 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar search={search} setSearch={setSearch} onMenu={() => setDrawerOpen(true)} isMobile={isMobile} onNavigate={go} firstName={firstName} />

        <main style={{ flex: 1, padding: isMobile ? "20px 14px 80px" : "32px", maxWidth: 1600, width: "100%", alignSelf: "center" }}>

          {/* ── Page Header + Stat Cards ──────────────────── */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", marginBottom: isMobile ? 20 : 28, gap: 16 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>My History</h1>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Comprehensive timeline of your facility maintenance requests.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, flexShrink: 0 }}>
              {STAT_CARDS.map((s) => (
                <div key={s.label} style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={s.icon} size={18} filled style={{ color: s.iconColor }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 9, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
                    {loading
                      ? <div style={{ width: 28, height: 20, background: C.surfaceContainerHigh, borderRadius: 4, marginTop: 2, animation: "pulse 1.5s ease-in-out infinite" }} />
                      : <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>{String(s.value).padStart(2, "0")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Mobile filter toggle ───────────────────────── */}
          {isMobile && (
            <button onClick={() => setShowFilters((p) => !p)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface, marginBottom: 16 }}>
              <Icon name="filter_list" size={18} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          )}

          {/* ── Main Layout ───────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: isMobile ? 16 : 28, alignItems: "start" }}>

            {/* ── Filters Panel ─────────────────────────── */}
            {(!isMobile || showFilters) && (
              <div style={{ position: isMobile ? "static" : "sticky", top: 88 }}>
                <FiltersPanel
                  typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                  statusFilters={statusFilters} toggleStatus={toggleStatus}
                  dateFrom={dateFrom} setDateFrom={setDateFrom}
                  dateTo={dateTo} setDateTo={setDateTo}
                  onReset={resetFilters}
                  totalCount={history.length}
                />
              </div>
            )}

            {/* ── Timeline ──────────────────────────────── */}
            <div style={{ position: "relative" }}>
              {/* Vertical line (desktop only) */}
              {!isMobile && (
                <div style={{ position: "absolute", left: 9, top: 0, bottom: 0, width: 2, background: C.outlineVariant, zIndex: 0 }} />
              )}

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ height: 120, background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite", marginLeft: isMobile ? 0 : 48 }} />
                  ))}
                </div>
              ) : Object.keys(grouped).length === 0 ? (
                <div style={{ padding: "56px 24px", textAlign: "center", background: C.white, borderRadius: 14, border: `1px solid ${C.outlineVariant}`, marginLeft: isMobile ? 0 : 48 }}>
                  <Icon name="history_toggle_off" size={48} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                    {history.length === 0 ? "No history yet" : "No results match your filters"}
                  </p>
                  <p style={{ margin: "6px 0 14px", fontSize: 13, color: C.onSurfaceVariant }}>
                    {history.length === 0
                      ? "Completed and cancelled requests will appear here."
                      : "Try adjusting your search or filter options."}
                  </p>
                  {(search || typeFilter !== "All Types" || dateFrom || dateTo) && (
                    <button onClick={resetFilters} style={{ padding: "7px 18px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {Object.entries(grouped).map(([month, items]) => (
                    <div key={month} style={{ marginBottom: 28 }}>
                      {/* Month label */}
                      <div style={{ position: "sticky", top: 64, zIndex: 20, paddingBottom: 14, paddingLeft: isMobile ? 0 : 48, background: `${C.surface}e0`, backdropFilter: "blur(8px)" }}>
                        <span style={{ display: "inline-block", background: C.primary, color: C.white, padding: "4px 14px", borderRadius: 99, fontSize: 10, fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
                          {month}
                        </span>
                      </div>

                      {/* Items */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {items.map((item) => (
                          isMobile ? (
                            // Mobile: no timeline offset
                            <div key={item.id} onClick={() => setSelected(item)} style={{ cursor: "pointer" }}>
                              <div style={{ background: C.white, borderRadius: 14, padding: "16px 18px", border: `1px solid ${C.outlineVariant}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                                  <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, minWidth: 0 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Icon name={CATEGORY_ICONS[item.category] || "build"} size={19} style={{ color: C.primaryContainer }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant }}>{item.id}</p>
                                      <h3 style={{ margin: "1px 0 0", fontSize: 14, fontWeight: 700, color: C.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h3>
                                    </div>
                                  </div>
                                  <span style={{ padding: "2px 8px", borderRadius: 99, background: (STATUS_CFG[item.status] || STATUS_CFG.Completed).bg, color: (STATUS_CFG[item.status] || STATUS_CFG.Completed).text, fontSize: 10, fontWeight: 700, fontFamily: MONO, flexShrink: 0 }}>{item.status}</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                  <span style={{ padding: "2px 8px", borderRadius: 4, background: C.surfaceContainerHigh, color: C.onSurfaceVariant, fontSize: 11, fontFamily: MONO }}>{item.category}</span>
                                  <span style={{ fontSize: 12, color: C.outline, fontFamily: MONO }}>{item.date}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <TimelineItem key={item.id} item={item} onSelect={setSelected} />
                          )
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Load more */}
                  {filtered.length > visibleCount && (
                    <div style={{ paddingLeft: isMobile ? 0 : 48, paddingTop: 8 }}>
                      <button onClick={() => setVisibleCount((p) => p + 6)} style={{
                        width: "100%", padding: "12px 0",
                        background: C.white, border: `2px dashed ${C.outlineVariant}`,
                        borderRadius: 12, cursor: "pointer",
                        fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurfaceVariant,
                        transition: "background 0.15s",
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainerLow}
                        onMouseLeave={(e) => e.currentTarget.style.background = C.white}
                      >
                        Load more ({filtered.length - visibleCount} remaining)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && <MobileBottomNav currentPath={location.pathname} onNavigate={go} />}

      {/* Detail Drawer */}
      {selected && <DetailDrawer item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}