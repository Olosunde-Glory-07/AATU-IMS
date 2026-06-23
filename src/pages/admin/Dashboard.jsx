import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  onPrimaryContainer:     "#d26a5f",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
  tertiaryFixedDim:       "#ffb77d",
  errorContainer:         "#ffdad6",
  onErrorContainer:       "#93000a",
  error:                  "#ba1a1a",
  surface:                "#f9f9ff",
  surfaceContainer:       "#e7eefe",
  surfaceContainerLow:    "#f0f3ff",
  surfaceContainerHigh:   "#e2e8f8",
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
  { icon: "dashboard",     label: "Dashboard",     path: "/admin/dashboard"     },
  { icon: "list_alt",      label: "Requests",      path: "/admin/requests"      },
  { icon: "engineering",   label: "Job Orders",    path: "/admin/job-orders"    },
  { icon: "inventory_2",   label: "Assets",        path: "/admin/assets"        },
  { icon: "group",         label: "Users",         path: "/admin/users"         },
  { icon: "domain",        label: "Departments",   path: "/admin/departments"   },
  { icon: "notifications", label: "Notifications", path: "/admin/notifications" },
];

// ─── Donut chart categories ───────────────────────────────────────────────────
const CATEGORY_COLORS = [C.primaryContainer, C.secondary, C.tertiaryFixedDim, C.outline];

// ─── Status / priority config ─────────────────────────────────────────────────
const STATUS_CFG = {
  Emergency: { bg: C.errorContainer,      text: C.onErrorContainer      },
  Completed: { bg: C.secondaryContainer,  text: C.onSecondaryContainer  },
  Assigned:  { bg: "#EEF2FF",             text: "#4338ca"               },
  Pending:   { bg: C.surfaceContainerHigh,text: C.onSurfaceVariant      },
};

// ─── Helper: material icon span ───────────────────────────────────────────────
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

// ─── Greeting helper ──────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose }) {
  const navigate   = useNavigate();
  const location   = useLocation();
  const isMobile   = useIsMobile();

  const content = (
    <aside style={{
      width: 260,
      background: C.primaryContainer,
      color: C.white,
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflowY: "auto",
      borderRight: `1px solid ${C.outlineVariant}`,
      fontFamily: SANS,
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 24px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 18, color: C.white }}>
            <Icon name="account_balance" size={22} filled style={{ color: C.white }} />
            AATU
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2, letterSpacing: "0.05em", fontFamily: MONO }}>
            Infrastructure Mgmt
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4 }}>
            <Icon name="close" size={22} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 12 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 24px", position: "relative",
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

      {/* Footer */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "10px 8px", background: "transparent",
          color: "rgba(255,255,255,0.65)", border: "none", cursor: "pointer",
          fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
        }}>
          <Icon name="account_circle" size={20} />
          User Profile
        </button>
        <button style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "10px 8px", background: "transparent",
          color: "rgba(255,255,255,0.4)", border: "none", cursor: "pointer",
          fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
        }}>
          <Icon name="logout" size={20} />
          Logout
        </button>
      </div>
    </aside>
  );

  // Desktop: fixed sidebar
  if (!isMobile) {
    return (
      <div style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50 }}>
        {content}
      </div>
    );
  }

  // Mobile: slide-over drawer
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }}
      />
      {/* Drawer */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 260,
        zIndex: 101, boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
      }}>
        {content}
      </div>
    </>
  );
}

// ─── Mobile bottom tab bar ────────────────────────────────────────────────────
function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const quickNav  = NAV_ITEMS.slice(0, 5); // Dashboard, Requests, Job Orders, Assets, users

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: C.white, borderTop: `1px solid ${C.outlineVariant}`,
      display: "flex", height: 60,
    }}>
      {quickNav.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
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
      justifyContent: "space-between",
      padding: isMobile ? "0 16px" : "0 32px",
      position: "sticky", top: 0, zIndex: 40,
      background: "rgba(249,249,255,0.92)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS,
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurface, padding: 4, flexShrink: 0, display: "flex" }}
          >
            <Icon name="menu" size={24} />
          </button>
        )}

        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: isMobile ? "100%" : 280 }}>
          <Icon name="search" size={18} style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: C.onSurfaceVariant,
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            style={{
              width: "100%", paddingLeft: 34, paddingRight: 12,
              paddingTop: 7, paddingBottom: 7,
              background: C.surfaceContainerLow, border: "none",
              borderRadius: 20, fontSize: 14, outline: "none",
              color: C.onSurface, boxSizing: "border-box", fontFamily: SANS,
            }}
          />
        </div>

        {/* Page title — desktop only */}
        {!isMobile && (
          <h1 style={{ fontSize: 20, fontWeight: 600, color: C.onSurface, margin: 0, whiteSpace: "nowrap" }}>
            Infrastructure Management
          </h1>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, flexShrink: 0 }}>
        <button style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurfaceVariant, display: "flex" }}>
          <Icon name="notifications" size={22} />
          <span style={{
            position: "absolute", top: 4, right: 4, width: 7, height: 7,
            background: C.error, borderRadius: "50%",
          }} />
        </button>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: C.surfaceContainer, border: `1px solid ${C.outlineVariant}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: C.onSurfaceVariant, fontSize: 14, flexShrink: 0,
        }}>A</div>
      </div>
    </header>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ card }) {
  return (
    <div style={{
      background: card.cardBg || C.white,
      border: card.border || `1px solid ${C.outlineVariant}`,
      borderRadius: 12, padding: 20,
      transition: "box-shadow 0.2s, transform 0.15s",
      cursor: "default",
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={card.icon} size={20} filled style={{ color: card.iconColor }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: card.badgeColor, fontFamily: MONO }}>
          {card.badge}
        </span>
      </div>
      <div style={{ marginTop: 16 }}>
        <p style={{
          fontSize: 10, color: card.isError ? C.error : C.onSurfaceVariant,
          textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, fontFamily: MONO,
        }}>{card.label}</p>
        <h3 style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 0", color: C.onSurface }}>
          {card.value ?? "—"}
        </h3>
      </div>
    </div>
  );
}

// ─── Custom donut chart ───────────────────────────────────────────────────────
function CustomDonut({ data }) {
  const [active, setActive] = useState(null);
  if (!data || data.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, color: C.onSurfaceVariant, fontSize: 13, fontFamily: MONO }}>
        <Icon name="pie_chart" size={36} style={{ color: C.outlineVariant, marginBottom: 8 }} />
        No category data yet
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = 80, cx = 110, cy = 110, thickness = 28;
  let startAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const slice = { ...d, startAngle, endAngle };
    startAngle = endAngle;
    return slice;
  });

  function describeArc(cx, cy, r, s, e) {
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${e - s > Math.PI ? 1 : 0} 1 ${x2} ${y2}`;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <svg width={220} height={220} style={{ display: "block", margin: "0 auto" }}>
        {slices.map((s, i) => {
          const isAct = active === i;
          const r = radius + (isAct ? 6 : 0);
          const inner = r - thickness;
          const op = describeArc(cx, cy, r, s.startAngle, s.endAngle);
          const ip = describeArc(cx, cy, inner, s.endAngle, s.startAngle);
          return (
            <path
              key={i}
              d={`${op} L ${cx + inner * Math.cos(s.endAngle)} ${cy + inner * Math.sin(s.endAngle)} ${ip} Z`}
              fill={s.color}
              style={{ transition: "all 0.2s", cursor: "pointer" }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: C.onSurface }}>
          {active !== null ? `${data[active].value}%` : `${total}%`}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 11, fill: C.onSurfaceVariant, fontFamily: MONO }}>
          {active !== null ? data[active].name : "Total"}
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, fontFamily: MONO }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
              <span style={{ color: C.onSurface }}>{d.name}</span>
            </div>
            <span style={{ color: C.onSurfaceVariant }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Request row (table) ──────────────────────────────────────────────────────
function RequestRow({ req }) {
  const [hov, setHov] = useState(false);
  const statusCfg = STATUS_CFG[req.status] || STATUS_CFG.Pending;
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ borderTop: `1px solid ${C.outlineVariant}`, background: hov ? C.surfaceContainerLow : "transparent", transition: "background 0.1s", cursor: "pointer" }}
    >
      <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: MONO, color: C.onSurface, whiteSpace: "nowrap" }}>{req.id}</td>
      <td style={{ padding: "14px 20px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.onSurface }}>{req.title}</div>
        <div style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>{req.location}</div>
      </td>
      <td style={{ padding: "14px 20px", fontSize: 14, color: C.onSurface, whiteSpace: "nowrap" }}>{req.department}</td>
      <td style={{ padding: "14px 20px", fontSize: 13, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>{req.date}</td>
      <td style={{ padding: "14px 20px" }}>
        <span style={{
          padding: "3px 10px", borderRadius: 20,
          background: statusCfg.bg, color: statusCfg.text,
          fontSize: 11, fontWeight: 700, fontFamily: MONO, whiteSpace: "nowrap",
        }}>{req.status}</span>
      </td>
      <td style={{ padding: "14px 20px" }}>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          fontFamily: MONO, color: req.priority === "High" ? C.error : C.onSurfaceVariant,
        }}>{req.priority}</span>
      </td>
      <td style={{ padding: "14px 20px", textAlign: "right" }}>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant, padding: 4, display: "flex", opacity: hov ? 1 : 0.4 }}>
          <Icon name="more_vert" size={20} />
        </button>
      </td>
    </tr>
  );
}

// ─── Request card (mobile) ────────────────────────────────────────────────────
function RequestCard({ req }) {
  const statusCfg = STATUS_CFG[req.status] || STATUS_CFG.Pending;
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.outlineVariant}`,
      borderLeft: `4px solid ${req.priority === "High" ? C.error : req.status === "Completed" ? C.secondary : C.outlineVariant}`,
      borderRadius: 12, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 8, fontFamily: SANS,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO }}>{req.id}</p>
          <h4 style={{ margin: "2px 0", fontSize: 15, fontWeight: 700, color: C.onSurface }}>{req.title}</h4>
          <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>{req.location}</p>
        </div>
        <span style={{
          padding: "2px 8px", borderRadius: 20, flexShrink: 0,
          background: statusCfg.bg, color: statusCfg.text,
          fontSize: 10, fontWeight: 700, fontFamily: MONO,
        }}>{req.status}</span>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO }}>
        <span>{req.department}</span>
        <span>•</span>
        <span>{req.date}</span>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const isMobile = useIsMobile();

  // UI state
  const [drawerOpen,      setDrawerOpen]      = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [search,          setSearch]          = useState("");

  // Data state — starts empty, populate from Supabase
  const [stats, setStats] = useState({
    totalRequests:   null,
    pending:         null,
    completed:       null,
    emergency:       null,
    totalUsers:      null,
    activeJobs:      null,
    totalAssets:     null,
    damagedAssets:   null,
  });
  const [monthlyData,   setMonthlyData]   = useState([]);
  const [categoryData,  setCategoryData]  = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading]             = useState(true);

  // TODO: replace with real Supabase fetches
  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        // Example pattern (uncomment and fill in):
        // const { data: requests } = await supabase.from("requests").select("*").order("created_at", { ascending: false }).limit(3)
        // setRecentRequests(requests ?? [])
        // const { count: total } = await supabase.from("requests").select("*", { count: "exact", head: true })
        // setStats(s => ({ ...s, totalRequests: total }))
        // ... etc

        // For now leave as empty — UI shows empty states
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Filtered recent requests by search
  const filteredRequests = recentRequests.filter((r) => {
    const q = search.toLowerCase();
    return !q || [r.id, r.title, r.location, r.department, r.status, r.priority]
      .some((f) => f?.toLowerCase().includes(q));
  });

  // Derived metric cards
  const metricCards = [
    {
      icon: "inbox", label: "Total Requests", value: stats.totalRequests,
      badge: "All time", badgeColor: C.secondary,
      iconBg: C.surfaceContainerHigh, iconColor: C.primaryContainer,
    },
    {
      icon: "pending_actions", label: "Pending", value: stats.pending,
      badge: "Awaiting review", badgeColor: C.onSurfaceVariant,
      iconBg: "#ffdcc3", iconColor: "#2f1500",
    },
    {
      icon: "check_circle", label: "Completed", value: stats.completed,
      badge: "Resolved", badgeColor: C.secondary,
      iconBg: C.secondaryContainer, iconColor: C.onSecondaryContainer,
    },
    {
      icon: "emergency_home", label: "Emergency Requests", value: stats.emergency,
      badge: "Urgent", badgeColor: C.error,
      iconBg: C.error, iconColor: C.white,
      cardBg: C.errorContainer, border: `1px solid ${C.error}33`, isError: true,
    },
  ];

  const secondaryStats = [
    { icon: "group",        label: "Total Users",    value: stats.totalUsers,    iconColor: C.onSurfaceVariant },
    { icon: "work_history", label: "Active Jobs",    value: stats.activeJobs,    iconColor: C.onSurfaceVariant },
    { icon: "inventory",    label: "Total Assets",   value: stats.totalAssets,   iconColor: C.onSurfaceVariant },
    { icon: "heart_broken", label: "Damaged Assets", value: stats.damagedAssets, iconColor: C.error            },
  ];

  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: C.surface, fontFamily: SANS, color: C.onSurface,
    }}>
      {/* Sidebar */}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main */}
      <main style={{
        marginLeft: isMobile ? 0 : 260,
        flex: 1, display: "flex", flexDirection: "column",
        paddingBottom: isMobile ? 60 : 0,
        minWidth: 0,
      }}>
        <TopBar
          onMenuClick={() => setDrawerOpen(true)}
          search={search}
          setSearch={setSearch}
          onReportIssue={() => setReportModalOpen(true)}
        />

        <div style={{ flex: 1, padding: isMobile ? "20px 16px" : "32px", boxSizing: "border-box" }}>

          {/* ── Greeting ── */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            gap: 16, marginBottom: 28,
          }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, margin: 0 }}>
                {getGreeting()}, Admin
              </h2>
              <p style={{ fontSize: 14, color: C.onSurfaceVariant, margin: "4px 0 0" }}>
                Here's what's happening across the campus infrastructure today.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
                background: C.white, cursor: "pointer", fontSize: 12, fontFamily: MONO,
              }}>
                <Icon name="calendar_today" size={15} />
                This Month
              </button>
              <button style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                border: `1px solid ${C.outlineVariant}`, borderRadius: 8,
                background: C.white, cursor: "pointer", fontSize: 12, fontFamily: MONO,
              }}>
                <Icon name="download" size={15} />
                {!isMobile && "Export"}
              </button>
            </div>
          </div>

          {/* ── Metric cards ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: isMobile ? 12 : 20,
            marginBottom: isMobile ? 16 : 20,
          }}>
            {metricCards.map((c, i) => <MetricCard key={i} card={c} />)}
          </div>

          {/* ── Secondary stats ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: isMobile ? 10 : 20,
            marginBottom: isMobile ? 24 : 32,
          }}>
            {secondaryStats.map((s, i) => (
              <div key={i} style={{
                background: C.white, border: `1px solid ${C.outlineVariant}`,
                borderRadius: 12, padding: isMobile ? "14px 16px" : 20,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Icon name={s.icon} size={20} style={{ color: s.iconColor, flexShrink: 0 }} />
                {!isMobile && <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>{s.label}</span>}
                <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: isMobile ? 16 : 18 }}>
                  {s.value ?? "—"}
                </span>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
            gap: isMobile ? 16 : 24,
            marginBottom: isMobile ? 24 : 32,
          }}>
            {/* Bar chart */}
            <div style={{
              background: C.white, border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Monthly Trends</h3>
                <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO }}>Requests Volume</span>
              </div>
              {monthlyData.length === 0 ? (
                <div style={{ height: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.onSurfaceVariant, gap: 8 }}>
                  <Icon name="bar_chart" size={36} style={{ color: C.outlineVariant }} />
                  <span style={{ fontSize: 13, fontFamily: MONO }}>No request data yet</span>
                </div>
              ) : (
                <div style={{ height: isMobile ? 180 : 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barSize={16}>
                      <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.04)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                        contentStyle={{ borderRadius: 8, border: `1px solid ${C.outlineVariant}`, fontFamily: SANS }}
                      />
                      <Bar dataKey="requests" fill={C.primaryContainer} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Donut chart */}
            <div style={{
              background: C.white, border: `1px solid ${C.outlineVariant}`,
              borderRadius: 12, padding: 20,
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>By Category</h3>
              <CustomDonut data={categoryData} />
            </div>
          </div>

          {/* ── Recent Requests ── */}
          <div style={{
            background: C.white, border: `1px solid ${C.outlineVariant}`,
            borderRadius: 12, overflow: "hidden", marginBottom: isMobile ? 24 : 32,
          }}>
            <div style={{
              padding: "18px 20px", borderBottom: `1px solid ${C.outlineVariant}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Recent Requests</h3>
              <button
                onClick={() => navigate("/admin/requests")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: C.primaryContainer, fontWeight: 700, fontSize: 12, fontFamily: MONO,
                }}
              >
                View All →
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: C.onSurfaceVariant, fontSize: 13 }}>
                <Icon name="hourglass_empty" size={28} style={{ display: "block", margin: "0 auto 8px", color: C.outlineVariant }} />
                Loading…
              </div>
            ) : filteredRequests.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <Icon name="inbox" size={36} style={{ display: "block", margin: "0 auto 10px", color: C.outlineVariant }} />
                <p style={{ margin: 0, color: C.onSurfaceVariant, fontSize: 14 }}>
                  {search ? "No requests match your search." : "No requests yet."}
                </p>
              </div>
            ) : isMobile ? (
              /* Mobile: card list */
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredRequests.map((req) => <RequestCard key={req.id} req={req} />)}
              </div>
            ) : (
              /* Desktop: table */
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.surfaceContainerLow }}>
                      {["ID", "Description", "Department", "Date", "Status", "Priority", ""].map((h, i) => (
                        <th key={i} style={{
                          padding: "12px 20px", textAlign: i === 6 ? "right" : "left",
                          fontSize: 10, fontWeight: 500, color: C.onSurfaceVariant,
                          fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((req) => <RequestRow key={req.id} req={req} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Banner ── */}
          <div style={{
            borderRadius: 12, overflow: "hidden", position: "relative",
            height: isMobile ? 160 : 220, marginBottom: 8,
            background: `linear-gradient(135deg, ${C.primaryContainer} 0%, #7e2b23 100%)`,
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(33,0,0,0.80) 0%, transparent 60%)",
              display: "flex", flexDirection: "column", justifyContent: "flex-end",
              padding: isMobile ? 20 : 32, color: C.white,
            }}>
              <h4 style={{ margin: "0 0 6px", fontSize: isMobile ? 16 : 20, fontWeight: 700 }}>
                Campus Monitoring Infrastructure
              </h4>
              {!isMobile && (
                <p style={{ margin: 0, fontSize: 14, maxWidth: 540, opacity: 0.85 }}>
                  A centralized view of all university assets, facility requests, and personnel workflows in real-time.
                </p>
              )}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                position: "absolute", borderRadius: "50%",
                width: 70 + i * 35, height: 70 + i * 35,
                border: "1px solid rgba(255,180,170,0.12)",
                top: "50%", right: 40 + i * 35, transform: "translateY(-50%)",
              }} />
            ))}
          </div>
        </div>
      </main>

      {/* Mobile bottom tab nav */}
      {isMobile && <BottomNav />}

      {/* Report Issue modal */}
      {reportModalOpen && <ReportIssueModal onClose={() => setReportModalOpen(false)} />}
    </div>
  );
}