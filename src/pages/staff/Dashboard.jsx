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

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/staff/dashboard" },
  { icon: "list_alt",      label: "Requests",      path: "/staff/maintenance-requests" },
  { icon: "history",       label: "Dept. History", path: "/staff/departmental-history" },
  { icon: "notifications", label: "Notifications", path: "/staff/notifications" },
];

const PRIORITY_CFG = {
  Emergency: { bg: C.errorContainer,         text: C.error            },
  High:      { bg: "#FEF3C7",                text: C.onTertiaryFixedVariant },
  Medium:    { bg: C.surfaceContainerHighest, text: C.onSurfaceVariant },
  Low:       { bg: C.surfaceContainerHigh,    text: C.onSurfaceVariant },
};

const STATUS_CFG = {
  "In Progress": { text: C.secondary,              dot: C.secondary              },
  "Completed":   { text: C.onTertiaryFixedVariant, dot: C.onTertiaryFixedVariant },
  "Pending":     { text: C.onSurfaceVariant,        dot: C.outline                },
  "Assigned":    { text: "#3730A3",                 dot: "#6366f1"                },
};

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
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

      {/* Nav */}
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

      {/* Footer */}
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
function TopBar({ onMenuClick, search, setSearch, onReportIssue }) {
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
            placeholder="Search infrastructure..."
            style={{
              width: "100%", paddingLeft: 40, paddingRight: 20,
              paddingTop: 9, paddingBottom: 9,
              background: C.surfaceContainerLow,
              border: "none", borderRadius: 99,
              fontSize: 14, outline: "none",
              color: C.onSurface, fontFamily: SANS, boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12 }}>
        <button onClick={onReportIssue} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: C.primaryContainer, color: C.white,
          border: "none", cursor: "pointer",
          padding: isMobile ? "8px 12px" : "8px 18px", borderRadius: 99,
          fontSize: 12, fontFamily: MONO, fontWeight: 700, letterSpacing: "0.04em", flexShrink: 0,
        }}>
          <Icon name="add_circle" size={16} style={{ color: C.white }} />
          {!isMobile && "Report Issue"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 2, paddingLeft: isMobile ? 0 : 12, borderLeft: isMobile ? "none" : `1px solid ${C.outlineVariant}` }}>
          {!isMobile && (
            <button style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 8, color: C.onSurfaceVariant, display: "flex",
              borderRadius: "50%", transition: "color 0.15s",
            }}>
              <Icon name="settings" size={22} />
            </button>
          )}
          <div style={{
            width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, borderRadius: "50%",
            background: C.surfaceDim, border: `1px solid ${C.outline}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: C.onSurface, fontSize: 14, marginLeft: isMobile ? 0 : 6, flexShrink: 0,
          }}>S</div>
        </div>
      </div>
    </header>
  );
}

// ─── Welcome Banner — live counts, no hardcoded numbers ───────────────────────
function WelcomeBanner({ requests, isMobile, onViewRequests, onFileRequest }) {
  const emergencyCount = requests.filter((r) => r.priority === "Emergency").length;
  const inProgressCount = requests.filter((r) => r.status === "In Progress").length;

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      borderRadius: 14,
      background: `linear-gradient(135deg, ${C.primary} 0%, #5a0808 60%, #7e2b23 100%)`,
      padding: isMobile ? "28px 20px" : "40px 40px",
      minHeight: isMobile ? 170 : 190,
      display: "flex", flexDirection: "column", justifyContent: "center",
      color: C.white,
    }}>
      {/* Decorative rings */}
      {!isMobile && [200, 280, 360, 440, 520].map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          right: -80 + i * 30, top: "50%",
          transform: "translateY(-50%)",
          width: s, height: s, borderRadius: "50%",
          border: "1px solid rgba(255,180,170,0.12)",
          pointerEvents: "none",
        }} />
      ))}

      {/* Emergency pulse pill — only shows when there actually is an emergency */}
      {emergencyCount > 0 && (
        <div style={{
          position: isMobile ? "static" : "absolute", top: 24, right: 28,
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(186,26,26,0.3)",
          padding: "6px 14px", borderRadius: 99,
          border: "1px solid rgba(255,180,170,0.25)",
          marginBottom: isMobile ? 14 : 0, alignSelf: isMobile ? "flex-start" : "auto",
        }}>
          <PulseDot color={C.primaryFixedDim} />
          <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: C.primaryFixedDim, letterSpacing: "0.06em" }}>
            {emergencyCount} EMERGENCY ALERT{emergencyCount !== 1 ? "S" : ""}
          </span>
        </div>
      )}

      {/* Text */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: isMobile ? 20 : 28, fontWeight: 700, lineHeight: 1.2 }}>
          {getGreeting()}, Staff Member
        </h2>
        <p style={{ margin: 0, fontSize: isMobile ? 13 : 15, color: "rgba(255,255,255,0.80)", maxWidth: 560, lineHeight: 1.65 }}>
          {requests.length === 0
            ? "You have no requests on file yet. File a new request to get started."
            : (
              <>
                You have <strong>{inProgressCount} request{inProgressCount !== 1 ? "s" : ""}</strong> currently in progress.
                {emergencyCount > 0 && (
                  <> Your department has <strong style={{ color: C.primaryFixedDim }}>{emergencyCount} emergency alert{emergencyCount !== 1 ? "s" : ""}</strong> that require immediate attention.</>
                )}
              </>
            )}
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <button onClick={onViewRequests} style={{
            padding: "9px 20px", background: C.white, color: C.primary,
            border: "none", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontFamily: MONO, fontWeight: 700, letterSpacing: "0.04em",
          }}>
            View Requests →
          </button>
          <button onClick={onFileRequest} style={{
            padding: "9px 20px", background: "rgba(255,255,255,0.12)", color: C.white,
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, cursor: "pointer",
            fontSize: 12, fontFamily: MONO, fontWeight: 500, letterSpacing: "0.04em",
          }}>
            File New Request
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Pulse Dot ────────────────────────────────────────────────────────────────
function PulseDot({ color = C.error, size = 8 }) {
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

// ─── Stat Card — values derived live, no hardcoded numbers ────────────────────
function StatCard({ card }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.white,
        border: `1px solid ${C.outlineVariant}`,
        borderLeft: card.borderLeft || `1px solid ${C.outlineVariant}`,
        borderRadius: 10, padding: "20px 20px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        boxShadow: hov ? "0 10px 20px rgba(0,0,0,0.06)" : "none",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "box-shadow 0.2s, transform 0.18s",
        fontFamily: SANS, minHeight: 130,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{
            fontSize: 10, fontFamily: MONO, letterSpacing: "0.1em",
            textTransform: "uppercase", color: card.labelColor || C.onSurfaceVariant,
            opacity: 0.7,
          }}>{card.label}</span>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: card.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={card.icon} size={18} style={{ color: card.iconColor }} />
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: card.valueColor || C.onSurface }}>
          {card.value}
        </div>
      </div>
      <div style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: card.trendColor, marginTop: 8 }}>
        {card.trend}
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function MiniBarChart({ monthlyData }) {
  const [chartRange, setChartRange] = useState("Last 6 Months");
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{
      background: C.white, border: `1px solid ${C.outlineVariant}`,
      borderRadius: 10, padding: "22px 24px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Monthly Trends</h3>
        <select
          value={chartRange}
          onChange={(e) => setChartRange(e.target.value)}
          style={{
            background: C.surfaceContainerLow, border: "none",
            padding: "4px 12px", borderRadius: 6,
            fontSize: 12, fontFamily: MONO, color: C.onSurface,
            cursor: "pointer", outline: "none",
          }}
        >
          <option>Last 6 Months</option>
          <option>Last Year</option>
        </select>
      </div>

      {monthlyData.length === 0 ? (
        <div style={{ height: 160, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: C.onSurfaceVariant }}>
          <Icon name="bar_chart" size={32} style={{ color: C.outlineVariant }} />
          <span style={{ fontSize: 12, fontFamily: MONO }}>No request data yet</span>
        </div>
      ) : (
        <>
          {/* Bar area */}
          <div style={{ height: 160, display: "flex", alignItems: "flex-end", gap: 8, padding: "0 8px", position: "relative" }}>
            {[0, 25, 50, 75, 100].map((pct) => (
              <div key={pct} style={{
                position: "absolute", left: 8, right: 8,
                bottom: `${pct}%`, height: 1,
                background: `${C.outlineVariant}60`,
                zIndex: 0,
              }} />
            ))}

            {monthlyData.map((bar, i) => (
              <div
                key={i}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", height: "100%", justifyContent: "flex-end" }}
                onMouseEnter={() => setTooltip(i)}
                onMouseLeave={() => setTooltip(null)}
              >
                {tooltip === i && (
                  <div style={{
                    position: "absolute", bottom: `${bar.pct}%`, left: "50%",
                    transform: "translate(-50%, -8px)",
                    background: C.primary, color: C.white,
                    fontSize: 10, fontFamily: MONO, fontWeight: 700,
                    padding: "3px 8px", borderRadius: 4,
                    whiteSpace: "nowrap", zIndex: 10,
                  }}>{bar.count} reqs</div>
                )}
                <div style={{
                  width: "100%",
                  height: `${bar.pct}%`,
                  background: bar.active ? C.primaryContainer : `${C.primaryFixedDim}40`,
                  borderRadius: "4px 4px 0 0",
                  transition: "background 0.2s",
                  cursor: "pointer",
                  zIndex: 1,
                }}
                  onMouseEnter={(e) => {
                    if (!bar.active) e.currentTarget.style.background = `${C.primaryFixedDim}70`;
                  }}
                  onMouseLeave={(e) => {
                    if (!bar.active) e.currentTarget.style.background = `${C.primaryFixedDim}40`;
                  }}
                />
              </div>
            ))}
          </div>

          {/* X axis labels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 8px" }}>
            {monthlyData.map((bar) => (
              <span key={bar.month} style={{
                flex: 1, textAlign: "center",
                fontSize: 11, fontFamily: MONO,
                color: bar.active ? C.primary : `${C.onSurfaceVariant}80`,
                fontWeight: bar.active ? 700 : 400,
              }}>{bar.month}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Recent Requests Table ────────────────────────────────────────────────────
function RecentRequests({ requests, search, onViewAll }) {
  const filtered = useMemo(() => requests.filter((r) => {
    const q = search.toLowerCase();
    return !q || [r.id, r.category, r.location, r.priority, r.status]
      .some((f) => f.toLowerCase().includes(q));
  }), [requests, search]);

  return (
    <section style={{
      background: C.white, border: `1px solid ${C.outlineVariant}`,
      borderRadius: 10, overflow: "hidden", fontFamily: SANS,
    }}>
      {/* Header */}
      <div style={{
        padding: "18px 24px", borderBottom: `1px solid ${C.outlineVariant}`,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
      }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Recent Requests</h3>
        <button onClick={onViewAll} style={{
          background: "none", border: "none", cursor: "pointer",
          color: C.primary, fontWeight: 700, fontSize: 12, fontFamily: MONO,
          letterSpacing: "0.04em",
        }}>
          View All Requests →
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: C.onSurfaceVariant }}>
          <Icon name="inbox" size={32} style={{ display: "block", margin: "0 auto 10px", color: C.outlineVariant }} />
          {requests.length === 0 ? "No requests filed yet." : "No requests match your search."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.surfaceContainerLow }}>
                {["Request ID", "Category", "Location", "Priority", "Status", "Actions"].map((h, i) => (
                  <th key={i} style={{
                    padding: "12px 24px",
                    textAlign: i === 5 ? "right" : "left",
                    fontSize: 10, fontWeight: 500, fontFamily: MONO,
                    color: C.onSurfaceVariant, letterSpacing: "0.1em",
                    textTransform: "uppercase", opacity: 0.7, whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => {
                const prCfg = PRIORITY_CFG[req.priority] || PRIORITY_CFG.Medium;
                const stCfg = STATUS_CFG[req.status]   || STATUS_CFG["Pending"];
                return (
                  <TableRow key={req.id} req={req} prCfg={prCfg} stCfg={stCfg} />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TableRow({ req, prCfg, stCfg }) {
  const [hov, setHov] = useState(false);
  const navigate = useNavigate();
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => navigate("/staff/maintenance-requests")}
      style={{
        borderTop: `1px solid ${C.outlineVariant}`,
        background: hov ? `${C.surfaceContainerLow}80` : "transparent",
        transition: "background 0.12s", cursor: "pointer",
      }}
    >
      <td style={{ padding: "16px 24px", fontSize: 12, fontFamily: MONO, color: C.primary, fontWeight: 600, whiteSpace: "nowrap" }}>
        {req.id}
      </td>
      <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 600, color: C.onSurface }}>
        {req.category}
      </td>
      <td style={{ padding: "16px 24px", fontSize: 14, color: C.onSurfaceVariant }}>
        {req.location}
      </td>
      <td style={{ padding: "16px 24px" }}>
        <span style={{
          padding: "2px 10px", borderRadius: 99,
          background: prCfg.bg, color: prCfg.text,
          fontSize: 10, fontWeight: 700, fontFamily: MONO,
          letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
        }}>{req.priority}</span>
      </td>
      <td style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {req.status === "In Progress" ? (
            <PulseDot color={stCfg.dot} size={7} />
          ) : (
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: stCfg.dot }} />
          )}
          <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 700, color: stCfg.text, whiteSpace: "nowrap" }}>
            {req.status}
          </span>
        </div>
      </td>
      <td style={{ padding: "16px 24px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => navigate("/staff/maintenance-requests")}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: C.onSurfaceVariant, display: "flex",
            marginLeft: "auto", opacity: hov ? 1 : 0.5, transition: "opacity 0.15s",
          }}
        >
          <Icon name="more_vert" size={20} />
        </button>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaffDashboardPage() {
  const isMobile = useIsMobile();
  const navigate  = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch]         = useState("");

  // Starts empty — populate from Supabase. No test data.
  const [requests, setRequests] = useState([]);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]); // [{ month, count, pct, active }]

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

  // ── Live-derived stats — no hardcoded numbers ──────────────────────────────
  const totalRequests = requests.length;
  const emergencyCount = requests.filter((r) => r.priority === "Emergency").length;
  const inProgressCount = requests.filter((r) => r.status === "In Progress").length;
  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const completedCount = requests.filter((r) => r.status === "Completed").length;

  const statCards = [
    {
      label: "Total Requests", value: totalRequests, icon: "analytics",
      trend: totalRequests === 0 ? "No requests yet" : "Across your department",
      trendColor: C.onSurfaceVariant,
      iconBg: C.surfaceContainerHigh, iconColor: C.primary,
      borderLeft: "none",
    },
    {
      label: "Emergency", value: emergencyCount, icon: "emergency",
      trend: emergencyCount > 0 ? "Critical attention needed" : "No active emergencies",
      trendColor: emergencyCount > 0 ? C.error : C.onSurfaceVariant,
      iconBg: C.errorContainer, iconColor: C.error,
      borderLeft: emergencyCount > 0 ? `4px solid ${C.error}` : "none",
      labelColor: emergencyCount > 0 ? C.error : undefined,
      valueColor: emergencyCount > 0 ? C.error : undefined,
    },
    {
      label: "In Progress", value: inProgressCount, icon: "sync",
      trend: "Live count", trendColor: C.onSurfaceVariant,
      iconBg: C.surfaceContainerHigh, iconColor: C.primary,
      borderLeft: "none",
    },
    {
      label: "Total Assets", value: totalAssets, icon: "category",
      trend: "Main Campus Hub", trendColor: C.onSurfaceVariant,
      iconBg: C.surfaceContainerHigh, iconColor: C.primary,
      borderLeft: "none",
    },
  ];

  const secondaryStats = [
    {
      label: "Pending Review", value: pendingCount,
      badge: pendingCount === 0 ? "Clear" : `${pendingCount} waiting`,
      badgeBg: pendingCount === 0 ? C.surfaceContainerLow : C.errorContainer,
      badgeText: pendingCount === 0 ? C.onSurfaceVariant : C.onErrorContainer,
    },
    {
      label: "Completed", value: completedCount,
      badge: completedCount > 0 ? "Resolved" : "None yet",
      badgeBg: C.secondaryContainer, badgeText: C.onSecondaryContainer,
    },
    {
      label: "Departments", value: departmentCount,
      badge: "Active", badgeBg: C.surfaceContainerLow, badgeText: C.onSurfaceVariant,
    },
  ];

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
          onReportIssue={() => navigate("/staff/maintenance-requests")}
        />

        <div style={{
          flex: 1, padding: isMobile ? "20px 16px 40px" : "32px 32px 48px",
          maxWidth: 1600, width: "100%", margin: "0 auto", boxSizing: "border-box",
          display: "flex", flexDirection: "column", gap: isMobile ? 20 : 28,
        }}>

          {/* Welcome Banner */}
          <WelcomeBanner
            requests={requests}
            isMobile={isMobile}
            onViewRequests={() => navigate("/staff/maintenance-requests")}
            onFileRequest={() => navigate("/staff/maintenance-requests")}
          />

          {/* Primary Stat Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: isMobile ? 12 : 20,
          }}>
            {statCards.map((c, i) => <StatCard key={i} card={c} />)}
          </div>

          {/* Secondary Stats + Bar Chart */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
            gap: isMobile ? 16 : 20,
          }}>
            {/* Secondary stats column */}
            <div style={{
              display: isMobile ? "grid" : "flex",
              gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : undefined,
              flexDirection: isMobile ? undefined : "column",
              gap: isMobile ? 10 : 16,
            }}>
              {secondaryStats.map((s, i) => (
                <div key={i} style={{
                  background: C.white, border: `1px solid ${C.outlineVariant}`,
                  borderRadius: 10, padding: isMobile ? "14px 12px" : "20px 22px",
                  display: "flex", alignItems: isMobile ? "flex-start" : "center",
                  justifyContent: "space-between", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 0,
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
                      {s.label}
                    </p>
                    <h3 style={{ margin: "4px 0 0", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: C.onSurface }}>{s.value}</h3>
                  </div>
                  <div style={{
                    padding: "4px 10px", background: s.badgeBg, color: s.badgeText,
                    borderRadius: 6, fontSize: 10, fontFamily: MONO, fontWeight: 700, whiteSpace: "nowrap",
                  }}>{s.badge}</div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <MiniBarChart monthlyData={monthlyData} />
          </div>

          {/* Recent Requests Table */}
          <RecentRequests
            requests={requests}
            search={search}
            onViewAll={() => navigate("/staff/maintenance-requests")}
          />

        </div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}