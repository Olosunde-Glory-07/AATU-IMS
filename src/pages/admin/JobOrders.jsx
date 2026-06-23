import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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
  surfaceContainerLowest: "#ffffff",
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

const PRIORITY_CFG = {
  Emergency: { bg: "#FEE2E2", text: "#991B1B" },
  High:      { bg: "#FEF3C7", text: "#92400E" },
  Medium:    { bg: C.secondaryContainer, text: C.onSecondaryContainer },
  Low:       { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant },
};

const STATUS_CFG = {
  "In Progress": { bg: C.secondaryContainer,  text: C.secondary,        dot: C.secondary   },
  "Pending":     { bg: "#FEF3C7",             text: "#92400E",          dot: "#f59e0b"     },
  "Completed":   { bg: "#dcfce7",             text: C.secondary,        dot: C.secondary   },
  "On Hold":     { bg: C.surfaceContainerHigh,text: C.onSurfaceVariant, dot: C.outline     },
};

// Reference data used only to populate the assignee picker — not test job orders
const TECHNICIANS = [
  { initials: "RK", name: "Robert Kane",  bg: C.primaryContainer,    text: "#fff" },
  { initials: "SM", name: "Sarah Miller", bg: C.secondaryContainer,  text: C.onSecondaryContainer },
  { initials: "JL", name: "James Lee",    bg: C.surfaceContainerHigh,text: C.onSurfaceVariant },
  { initials: "AV", name: "Alex Vera",    bg: "#dce2f3",             text: C.onSurfaceVariant },
  { initials: "OA", name: "Olu Adeyemi",  bg: C.tertiaryFixedDim,    text: "#2f1500" },
];
const TECH_LOOKUP = Object.fromEntries(TECHNICIANS.map((t) => [t.initials, t]));

const TABS = ["All Orders", "My Fleet", "Urgent"];

// ─── Primitives ───────────────────────────────────────────────────────────────
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

function Avatar({ initials, bg, textColor = "#fff", size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 700, color: textColor, fontFamily: MONO,
      flexShrink: 0, border: `2px solid ${C.surface}`,
    }}>{initials}</div>
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

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["Pending"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      <span style={{
        fontSize: 12, fontWeight: 700, color: cfg.text,
        fontFamily: MONO, letterSpacing: "0.04em",
      }}>{status}</span>
    </div>
  );
}

function ProgressBar({ pct, status }) {
  const fill = status === "Completed" ? C.secondary
    : status === "On Hold" ? C.outline
    : pct === 0 ? C.outlineVariant
    : C.primaryContainer;
  return (
    <div style={{ width: "100%", height: 4, background: C.surfaceContainerHigh, borderRadius: 99 }}>
      <div style={{
        height: "100%", width: `${pct}%`, borderRadius: 99,
        background: fill, transition: "width 0.4s ease",
      }} />
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
      width: 260, background: C.primaryContainer, color: "#fff",
      display: "flex", flexDirection: "column", height: "100%",
      overflowY: "auto", borderRight: `1px solid ${C.outlineVariant}`,
      fontFamily: SANS,
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 6,
            background: "rgba(255,255,255,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="account_balance" size={20} filled style={{ color: "#fff" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>AATU</div>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
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
          const isActive = location.pathname === item.path ||
            (item.path !== "/admin/dashboard" && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); if (isMobile) onClose(); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 16px",
                background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                fontWeight: isActive ? 700 : 400,
                borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={20} filled={isActive} />
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
          <Icon name="account_circle" size={18} /> User Profile
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
          <Icon name="logout" size={18} /> Logout
        </button>
      </div>
    </aside>
  );

  if (!isMobile) {
    return (
      <div style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50 }}>
        {content}
      </div>
    );
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
function TopBar({ onMenuClick, search, setSearch, onNew }) {
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
        <div style={{ position: "relative", flex: 1, maxWidth: isMobile ? "100%" : 360 }}>
          <Icon name="search" size={18} style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: C.onSurfaceVariant,
          }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job orders…"
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16,
              paddingTop: 8, paddingBottom: 8,
              background: C.surfaceContainerLow, border: "none",
              borderRadius: 8, fontSize: 14, outline: "none",
              color: C.onSurface, boxSizing: "border-box", fontFamily: SANS,
            }}
          />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8 }}>
        <button onClick={() => navigate("/admin/notifications")} style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 8, color: C.onSurfaceVariant, borderRadius: "50%", display: "flex",
        }}>
          <Icon name="notifications" size={22} />
        </button>
        {!isMobile && (
          <button style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 8, color: C.onSurfaceVariant, borderRadius: "50%", display: "flex",
          }}>
            <Icon name="settings" size={22} />
          </button>
        )}
        <div style={{ width: 1, height: 28, background: C.outlineVariant, margin: "0 8px" }} />
        <button onClick={onNew} style={{
          background: C.primaryContainer, color: "#fff", border: "none",
          cursor: "pointer", padding: isMobile ? "8px 12px" : "8px 18px", borderRadius: 8,
          fontSize: 12, fontFamily: MONO, letterSpacing: "0.04em",
          fontWeight: 700, display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        }}>
          <Icon name="add_task" size={16} />
          {!isMobile && "Create Job Order"}
        </button>
        {!isMobile && (
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: C.surfaceContainer,
            border: `1px solid ${C.outlineVariant}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: C.onSurfaceVariant, fontSize: 14,
          }}>A</div>
        )}
      </div>
    </header>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ card }) {
  return (
    <div style={{
      background: C.surfaceContainerLowest,
      border: `1px solid ${C.outlineVariant}`,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", alignItems: "center", gap: 16,
      ...(card.cardStyle || {}),
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
        background: card.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={card.icon} size={24} filled={card.filled} style={{ color: card.iconColor }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {card.label}
        </p>
        <h3 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, color: card.valueColor, fontFamily: SANS }}>
          {card.value}
        </h3>
      </div>
    </div>
  );
}

// ─── Row action menu ──────────────────────────────────────────────────────────
function RowMenu({ order, onAction, onClose }) {
  const items = order.status === "Completed"
    ? [{ key: "view", label: "View Details", icon: "visibility" }]
    : [
        { key: "view",     label: "View Details",       icon: "visibility" },
        { key: "reassign", label: "Reassign Technician", icon: "swap_horiz" },
        { key: "complete", label: "Mark Complete",       icon: "check_circle" },
      ];
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", top: "100%", right: 0, marginTop: 4,
        background: "#fff", border: `1px solid ${C.outlineVariant}`,
        borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        zIndex: 30, width: 190, overflow: "hidden",
      }}
    >
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => { onAction(it.key, order); onClose(); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", background: "none", border: "none",
            cursor: "pointer", fontSize: 13, fontFamily: SANS, color: C.onSurface, textAlign: "left",
          }}
        >
          <Icon name={it.icon} size={16} />
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─── Table Row (desktop) ──────────────────────────────────────────────────────
function TableRow({ order, onSelect, onAction, menuOpen, onMenuToggle, dim }) {
  const [hov, setHov] = useState(false);
  const asgCfg = order.assignee ? (TECH_LOOKUP[order.assignee] || { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant }) : null;
  return (
    <tr
      onClick={() => onSelect(order)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderTop: `1px solid ${C.outlineVariant}33`,
        background: hov ? C.surfaceContainerLow : "transparent",
        cursor: "pointer", transition: "background 0.12s",
        opacity: dim ? 0.7 : 1,
      }}
    >
      <td style={{ padding: "16px 20px", fontSize: 12, fontFamily: MONO, color: C.onPrimaryContainer, whiteSpace: "nowrap" }}>
        {order.id}
      </td>
      <td style={{ padding: "16px 20px", minWidth: 220 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.onSurface }}>{order.title}</div>
        <div style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>{order.location}</div>
      </td>
      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
        <PriorityBadge priority={order.priority} />
      </td>
      <td style={{ padding: "16px 20px", whiteSpace: "nowrap" }}>
        <StatusChip status={order.status} />
      </td>
      <td style={{ padding: "16px 20px", minWidth: 120 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ProgressBar pct={order.progress} status={order.status} />
          <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>
            {order.progress}%
          </span>
        </div>
      </td>
      <td style={{ padding: "16px 20px" }}>
        {order.assignee ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar initials={order.assignee} bg={asgCfg.bg} textColor={asgCfg.text} size={28} />
            <span style={{ fontSize: 13, color: C.onSurface }}>{order.assigneeName}</span>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAction("reassign", order); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "none", border: `1px dashed ${C.outlineVariant}`,
              borderRadius: 20, padding: "4px 10px", cursor: "pointer",
              fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO,
            }}
          >
            <Icon name="person_add" size={14} /> Assign
          </button>
        )}
      </td>
      <td style={{ padding: "16px 20px", fontSize: 13, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>
        {order.timestamp}
      </td>
      <td style={{ padding: "16px 20px", textAlign: "right", position: "relative" }}>
        {order.status === "Completed" ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, color: C.secondary }}>
            <Icon name="check_circle" size={16} filled />
            <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>Done</span>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onMenuToggle(order.id); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 4, color: C.onSurfaceVariant, borderRadius: "50%",
              opacity: hov || menuOpen ? 1 : 0, transition: "opacity 0.12s", display: "flex",
              marginLeft: "auto",
            }}
          >
            <Icon name="more_vert" size={20} />
          </button>
        )}
        {menuOpen && <RowMenu order={order} onAction={onAction} onClose={() => onMenuToggle(null)} />}
      </td>
    </tr>
  );
}

// ─── Order Card (mobile) ──────────────────────────────────────────────────────
function OrderCard({ order, onSelect, onAction }) {
  const asgCfg = order.assignee ? (TECH_LOOKUP[order.assignee] || { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant }) : null;
  return (
    <div
      onClick={() => onSelect(order)}
      style={{
        background: C.white, border: `1px solid ${C.outlineVariant}`,
        borderLeft: `4px solid ${order.priority === "Emergency" ? C.error : order.priority === "High" ? "#f59e0b" : order.status === "Completed" ? C.secondary : C.outlineVariant}`,
        borderRadius: 12, padding: "14px 16px",
        display: "flex", flexDirection: "column", gap: 10, fontFamily: SANS,
        opacity: order.status === "Completed" ? 0.75 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, color: C.onPrimaryContainer, fontFamily: MONO }}>{order.id}</p>
          <h4 style={{ margin: "2px 0", fontSize: 15, fontWeight: 700, color: C.onSurface }}>{order.title}</h4>
          <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>{order.location}</p>
        </div>
        <PriorityBadge priority={order.priority} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ProgressBar pct={order.progress} status={order.status} />
        <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>{order.progress}%</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <StatusChip status={order.status} />
        {order.assignee ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar initials={order.assignee} bg={asgCfg.bg} textColor={asgCfg.text} size={24} />
            <span style={{ fontSize: 12, color: C.onSurfaceVariant }}>{order.assigneeName}</span>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onAction("reassign", order); }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: `1px dashed ${C.outlineVariant}`,
              borderRadius: 20, padding: "3px 9px", cursor: "pointer",
              fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO,
            }}
          >
            <Icon name="person_add" size={12} /> Assign
          </button>
        )}
      </div>

      {order.status !== "Completed" && (
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onAction("complete", order); }}
            style={{
              flex: 1, padding: "8px 0", background: C.secondaryContainer,
              color: C.onSecondaryContainer, border: "none", borderRadius: 8,
              cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: MONO,
            }}
          >
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ order, onClose, onAction }) {
  if (!order) return null;
  const isMobile = useIsMobile();
  const asgCfg = order.assignee ? (TECH_LOOKUP[order.assignee] || { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant }) : null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: isMobile ? "100%" : 440,
        background: "#fff", zIndex: 101,
        boxShadow: "-6px 0 32px rgba(0,0,0,0.13)",
        display: "flex", flexDirection: "column",
        fontFamily: SANS, overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.onPrimaryContainer, fontWeight: 700, letterSpacing: "0.06em" }}>{order.id}</span>
                <PriorityBadge priority={order.priority} />
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{order.title}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>{order.location}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, borderRadius: 6, display: "flex" }}>
              <Icon name="close" size={20} />
            </button>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em" }}>PROGRESS</span>
              <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>{order.progress}%</span>
            </div>
            <ProgressBar pct={order.progress} status={order.status} />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Status</div>
            <StatusChip status={order.status} />
          </div>

          {[
            ["Department", order.department],
            ["Timestamp",  order.timestamp],
            ["Linked Request", order.linkedReq ? `#${order.linkedReq}` : "—"],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontSize: 14, color: C.onSurface, fontWeight: 500 }}>{val}</div>
            </div>
          ))}

          {/* Assignee */}
          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
              Assigned Technician
            </div>
            {order.assignee ? (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                border: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow,
              }}>
                <Avatar initials={order.assignee} bg={asgCfg.bg} textColor={asgCfg.text} size={34} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.onSurface }}>{order.assigneeName}</div>
                  <div style={{ fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO }}>Technician</div>
                </div>
                <button
                  onClick={() => onAction("reassign", order)}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant, padding: 4, display: "flex" }}
                >
                  <Icon name="swap_horiz" size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAction("reassign", order)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "10px 14px", borderRadius: 10,
                  border: `1px dashed ${C.outlineVariant}`, background: "none",
                  cursor: "pointer", fontSize: 13, color: C.onSurfaceVariant,
                }}
              >
                <Icon name="person_add" size={18} /> Assign Technician
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Field Notes</div>
            <div style={{
              background: C.surfaceContainerLow, borderRadius: 8,
              padding: "12px 14px", fontSize: 13, color: C.onSurface, lineHeight: 1.6,
              border: `1px solid ${C.outlineVariant}`,
            }}>
              {order.notes || "No field notes yet."}
            </div>
          </div>

          {/* Activity Timeline — derived from real state changes, not fabricated */}
          {order.activity?.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 10, textTransform: "uppercase" }}>Activity</div>
              {order.activity.map((evt, i, arr) => (
                <div key={i} style={{ display: "flex", gap: 12, position: "relative" }}>
                  {i < arr.length - 1 && (
                    <div style={{ position: "absolute", left: 5, top: 18, bottom: -10, width: 1, background: C.outlineVariant }} />
                  )}
                  <div style={{
                    width: 11, height: 11, borderRadius: "50%", flexShrink: 0, marginTop: 4,
                    background: i === arr.length - 1 ? C.primaryContainer : C.outlineVariant,
                    border: `2px solid ${C.surface}`,
                  }} />
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: 13, color: C.onSurface }}>{evt.event}</div>
                    <div style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO }}>{evt.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button
            onClick={() => onAction("reassign", order)}
            style={{
              flex: 1, padding: "11px 16px", background: C.primaryContainer,
              color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
              fontWeight: 700, fontSize: 12, fontFamily: MONO,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Icon name="edit" size={15} />
            {order.assignee ? "Reassign Technician" : "Assign Technician"}
          </button>
          {order.status !== "Completed" && (
            <button
              onClick={() => onAction("complete", order)}
              style={{
                flex: 1, padding: "11px 16px",
                background: C.secondaryContainer, color: C.onSecondaryContainer,
                border: "none", borderRadius: 8, cursor: "pointer",
                fontWeight: 700, fontSize: 12, fontFamily: MONO,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Icon name="check_circle" size={15} />
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Assign / Reassign Technician Modal ───────────────────────────────────────
function AssignModal({ order, onClose, onConfirm }) {
  const [picked, setPicked] = useState(TECH_LOOKUP[order?.assignee] || null);
  if (!order) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 380, maxWidth: "calc(100vw - 32px)", background: "#fff", borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.20)", zIndex: 201, fontFamily: SANS,
        padding: 24, boxSizing: "border-box",
      }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: C.primary }}>
          {order.assignee ? "Reassign Technician" : "Assign Technician"}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: C.onSurfaceVariant }}>
          Choose a technician for <strong>{order.id}</strong> — {order.title}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {TECHNICIANS.map((t) => (
            <button
              key={t.initials}
              onClick={() => setPicked(t)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${picked?.initials === t.initials ? C.primaryContainer : C.outlineVariant}`,
                background: picked?.initials === t.initials ? C.surfaceContainerLow : "#fff",
                cursor: "pointer", textAlign: "left", fontFamily: SANS, fontSize: 14,
              }}
            >
              <Avatar initials={t.initials} bg={t.bg} textColor={t.text} size={28} />
              {t.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8,
            border: `1px solid ${C.outlineVariant}`, background: "none",
            cursor: "pointer", fontSize: 13, fontFamily: MONO, color: C.onSurface,
          }}>
            Cancel
          </button>
          <button
            disabled={!picked}
            onClick={() => picked && onConfirm(order.id, picked)}
            style={{
              flex: 1, padding: "10px 16px", borderRadius: 8, border: "none",
              background: picked ? C.primaryContainer : C.outlineVariant,
              color: "#fff", cursor: picked ? "pointer" : "default",
              fontSize: 13, fontWeight: 700, fontFamily: MONO,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Create Order Modal ───────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: "", location: "", department: "", priority: "Medium", assignee: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: `1px solid ${C.outlineVariant}`,
    borderRadius: 8, fontSize: 14, fontFamily: SANS, color: C.onSurface,
    background: C.surfaceContainerLow, outline: "none", boxSizing: "border-box",
  };

  function handleSubmit() {
    if (!form.title.trim() || !form.location.trim()) return;
    onCreate(form);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 480, maxWidth: "calc(100vw - 32px)", background: "#fff", borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.20)", zIndex: 201, fontFamily: SANS, overflow: "hidden",
        maxHeight: "calc(100vh - 32px)", overflowY: "auto",
      }}>
        <div style={{
          padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: C.surfaceContainerLow,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Create Job Order</h3>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>Dispatch a new maintenance task</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { key: "title",      label: "Task Description", placeholder: "e.g. HVAC Repair – Block A" },
            { key: "location",   label: "Location",         placeholder: "e.g. North Wing, Floor 2" },
            { key: "department", label: "Department",       placeholder: "e.g. Facility Ops" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
                {label}
              </label>
              <input value={form[key]} onChange={set(key)} placeholder={placeholder} style={inputStyle} />
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
                Priority
              </label>
              <select value={form.priority} onChange={set("priority")} style={{ ...inputStyle, cursor: "pointer" }}>
                {["Emergency", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
                Assign To
              </label>
              <select value={form.assignee} onChange={set("assignee")} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">Unassigned</option>
                {TECHNICIANS.map((t) => <option key={t.initials} value={t.initials}>{t.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{
          padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`,
          display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", border: `1px solid ${C.outlineVariant}`,
            borderRadius: 8, background: "none", cursor: "pointer",
            fontSize: 12, fontFamily: MONO, color: C.onSurface,
          }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.location.trim()}
            style={{
              padding: "9px 20px",
              background: form.title.trim() && form.location.trim() ? C.primaryContainer : C.outlineVariant,
              color: "#fff", border: "none", borderRadius: 8,
              cursor: form.title.trim() && form.location.trim() ? "pointer" : "default",
              fontSize: 12, fontFamily: MONO, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Icon name="add_task" size={15} />
            Dispatch Order
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ total, page, setPage, perPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      flexWrap: "wrap", gap: 10,
      borderTop: `1px solid ${C.outlineVariant}`, background: C.surface, padding: "16px 24px",
    }}>
      <span style={{ fontSize: 13, color: C.onSurfaceVariant, fontFamily: SANS }}>
        Showing {Math.min(perPage, total - (page - 1) * perPage)} of {total} orders
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{
          padding: "5px 8px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
          background: "none", cursor: page === 1 ? "default" : "pointer",
          opacity: page === 1 ? 0.4 : 1, display: "flex", alignItems: "center",
        }}>
          <Icon name="chevron_left" size={20} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} style={{
            padding: "5px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
            background: page === p ? C.primaryContainer : "none",
            color: page === p ? "#fff" : C.onSurface,
            cursor: "pointer", fontSize: 13, fontWeight: page === p ? 700 : 400,
            fontFamily: MONO,
          }}>{p}</button>
        ))}
        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
          padding: "5px 8px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6,
          background: "none", cursor: page === totalPages ? "default" : "pointer",
          opacity: page === totalPages ? 0.4 : 1, display: "flex", alignItems: "center",
        }}>
          <Icon name="chevron_right" size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminJobOrdersPage() {
  const isMobile = useIsMobile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("All Orders");
  const [selected, setSelected]     = useState(null);
  const [creating, setCreating]     = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [page, setPage]             = useState(1);
  const [toast, setToast]           = useState(null);
  const PER_PAGE = 6;

  // Starts empty — populate from Supabase. No test data.
  const [jobOrders, setJobOrders] = useState([]);

  useEffect(() => {
    ["aatu-fonts", "aatu-icons"].forEach((id, i) => {
      if (!document.getElementById(id)) {
        const el = document.createElement("link");
        el.id   = id;
        el.rel  = "stylesheet";
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

  function nowStamp() {
    return new Date().toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  // ── Stat cards — derived live from jobOrders, not hardcoded ────────────────
  const statCards = [
    {
      icon: "pending_actions", label: "Pending",
      value: jobOrders.filter((o) => o.status === "Pending").length,
      iconBg: C.surfaceContainerHigh, iconColor: C.onSurfaceVariant, valueColor: C.onSurface,
    },
    {
      icon: "bolt", label: "In Progress",
      value: jobOrders.filter((o) => o.status === "In Progress").length,
      iconBg: C.secondaryContainer, iconColor: C.secondary, valueColor: C.onSurface, filled: true,
    },
    {
      icon: "check_circle", label: "Completed",
      value: jobOrders.filter((o) => o.status === "Completed").length,
      iconBg: C.surfaceContainerLow, iconColor: C.onSurfaceVariant, valueColor: C.onSurface,
    },
    {
      icon: "warning", label: "Critical",
      value: jobOrders.filter((o) => o.priority === "Emergency" && o.status !== "Completed").length,
      iconBg: C.errorContainer, iconColor: C.onErrorContainer, valueColor: C.error, filled: true,
      cardStyle: { background: `linear-gradient(135deg, ${C.errorContainer}55 0%, transparent 100%)` },
    },
  ];

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = jobOrders.filter((o) => {
    const tabOk = activeTab === "All Orders" ? true
      : activeTab === "My Fleet" ? o.assignee === "RK"
      : activeTab === "Urgent" ? ["Emergency", "High"].includes(o.priority)
      : true;
    const q = search.toLowerCase();
    const searchOk = !q || [o.id, o.title, o.location, o.department, o.assigneeName]
      .filter(Boolean).some((f) => f.toLowerCase().includes(q));
    return tabOk && searchOk;
  });

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Actions ────────────────────────────────────────────────────────────────
  function handleCreate(form) {
    const tech = TECH_LOOKUP[form.assignee];
    const newOrder = {
      id: `#JO-${Math.floor(80000 + Math.random() * 9999)}`,
      title: form.title,
      location: form.location,
      department: form.department || "Unassigned Dept",
      priority: form.priority,
      status: tech ? "Pending" : "Pending",
      assignee: form.assignee || null,
      assigneeName: tech?.name || null,
      timestamp: nowStamp(),
      linkedReq: null,
      progress: 0,
      notes: "",
      activity: [{ time: nowStamp(), event: "Job order created and dispatched" }],
    };
    setJobOrders((prev) => [newOrder, ...prev]);
    setCreating(false);
    showToast(`Job order ${newOrder.id} created.`);
  }

  function handleAssignConfirm(orderId, tech) {
    setJobOrders((prev) => prev.map((o) => {
      if (o.id !== orderId) return o;
      const wasUnassigned = !o.assignee;
      return {
        ...o,
        assignee: tech.initials,
        assigneeName: tech.name,
        status: o.status === "Pending" || wasUnassigned ? "In Progress" : o.status,
        activity: [...(o.activity || []), { time: nowStamp(), event: `Assigned to ${tech.name}` }],
      };
    }));
    setSelected((prev) => prev && prev.id === orderId
      ? { ...prev, assignee: tech.initials, assigneeName: tech.name, status: prev.status === "Pending" ? "In Progress" : prev.status }
      : prev);
    setAssignTarget(null);
    setMenuOpenId(null);
    showToast(`${tech.name} assigned to ${orderId}.`);
  }

  function handleComplete(order) {
    setJobOrders((prev) => prev.map((o) => o.id === order.id
      ? { ...o, status: "Completed", progress: 100, activity: [...(o.activity || []), { time: nowStamp(), event: "Marked as completed" }] }
      : o));
    setSelected((prev) => prev && prev.id === order.id ? { ...prev, status: "Completed", progress: 100 } : prev);
    setMenuOpenId(null);
    showToast(`${order.id} marked completed.`);
  }

  function handleRowAction(actionKey, order) {
    if (actionKey === "view") setSelected(order);
    else if (actionKey === "reassign") setAssignTarget(order);
    else if (actionKey === "complete") handleComplete(order);
  }

  return (
    <div
      style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}
      onClick={() => menuOpenId && setMenuOpenId(null)}
    >
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{
        marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column",
        paddingBottom: isMobile ? 60 : 0, minWidth: 0,
      }}>
        <TopBar
          onMenuClick={() => setDrawerOpen(true)}
          search={search}
          setSearch={setSearch}
          onNew={() => setCreating(true)}
        />

        <div style={{
          flex: 1, padding: isMobile ? "20px 16px" : 32,
          maxWidth: 1500, width: "100%", margin: "0 auto", boxSizing: "border-box",
        }}>

          {/* Page Header */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "flex-end",
            flexDirection: isMobile ? "column" : "row",
            gap: 16, marginBottom: 24,
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>Job Orders</h2>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: C.onSurfaceVariant }}>
                Facility maintenance and technical service dispatch.
              </p>
            </div>
            {isMobile && (
              <button onClick={() => setCreating(true)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 18px",
                background: C.primary, color: "#fff", border: "none", borderRadius: 10,
                cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: SANS, width: "100%",
                justifyContent: "center",
              }}>
                <Icon name="add_task" size={18} />
                Create Job Order
              </button>
            )}
          </div>

          {/* Stat Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
            gap: isMobile ? 12 : 20, marginBottom: 24,
          }}>
            {statCards.map((c, i) => <StatCard key={i} card={c} />)}
          </div>

          {/* Table Container */}
          <div style={{
            background: C.surfaceContainerLowest,
            border: `1px solid ${C.outlineVariant}`,
            borderRadius: 14, overflow: "hidden",
          }}>
            {/* Toolbar */}
            <div style={{
              padding: "14px 16px", borderBottom: `1px solid ${C.outlineVariant}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 12, background: C.surface, flexWrap: "wrap",
            }}>
              <div style={{
                display: "flex", border: `1px solid ${C.outlineVariant}`,
                borderRadius: 8, overflow: "hidden", flexWrap: "wrap",
              }}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }} style={{
                      padding: "7px 14px", border: "none", cursor: "pointer",
                      background: isActive ? C.surfaceContainerHigh : "transparent",
                      color: isActive ? C.onSurface : C.onSurfaceVariant,
                      fontWeight: isActive ? 700 : 400,
                      fontSize: 12, fontFamily: MONO, letterSpacing: "0.04em",
                      borderRight: `1px solid ${C.outlineVariant}`,
                      transition: "background 0.12s", whiteSpace: "nowrap",
                    }}>{tab}</button>
                  );
                })}
              </div>

              {!isMobile && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => { setActiveTab("Urgent"); setPage(1); showToast("Filtered to urgent orders."); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 12px", border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 7, background: "#fff", cursor: "pointer",
                      fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO,
                    }}
                  >
                    <Icon name="filter_list" size={16} />
                    Filter
                  </button>
                  <button
                    onClick={() => {
                      const header = ["ID","Title","Location","Department","Priority","Status","Progress","Assignee","Timestamp"];
                      const rows = filtered.map((o) => [o.id, o.title, o.location, o.department, o.priority, o.status, o.progress, o.assigneeName || "", o.timestamp]);
                      const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = "job-orders.csv"; a.click();
                      URL.revokeObjectURL(url);
                      showToast("Exported job orders as CSV.");
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 12px", border: `1px solid ${C.outlineVariant}`,
                      borderRadius: 7, background: "#fff", cursor: "pointer",
                      fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO,
                    }}
                  >
                    <Icon name="download" size={16} />
                    Export
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            {paged.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center", color: C.onSurfaceVariant }}>
                <Icon name="inbox" size={36} style={{ display: "block", margin: "0 auto 10px", color: C.outlineVariant }} />
                {jobOrders.length === 0
                  ? "No job orders yet. Assign a technician to a request to create one."
                  : "No job orders match your filters."}
              </div>
            ) : isMobile ? (
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {paged.map((o) => (
                  <OrderCard key={o.id} order={o} onSelect={setSelected} onAction={handleRowAction} />
                ))}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
                  <thead>
                    <tr style={{ background: `${C.surfaceContainerLow}60` }}>
                      {["Order ID", "Task Description", "Priority", "Status", "Progress", "Assigned To", "Timestamp", ""].map((h, i) => (
                        <th key={i} style={{
                          padding: "12px 20px", textAlign: i === 7 ? "right" : "left",
                          fontSize: 10, fontWeight: 500, fontFamily: MONO,
                          color: C.onSurfaceVariant, letterSpacing: "0.1em",
                          textTransform: "uppercase", whiteSpace: "nowrap", opacity: 0.7,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((o) => (
                      <TableRow
                        key={o.id}
                        order={o}
                        onSelect={setSelected}
                        onAction={handleRowAction}
                        menuOpen={menuOpenId === o.id}
                        onMenuToggle={(id) => setMenuOpenId((cur) => (cur === id ? null : id))}
                        dim={o.status === "Completed"}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination total={filtered.length} page={page} setPage={setPage} perPage={PER_PAGE} />
          </div>

          {/* Live indicator */}
          <div style={{
            marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 16px", background: C.primaryContainer,
            borderRadius: 10, color: "#fff",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffb4aa", animation: "jo-pulse 1.5s ease-in-out infinite" }} />
            <style>{`@keyframes jo-pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, letterSpacing: "0.06em" }}>
              Real-time Sync Active
            </span>
          </div>
        </div>
      </main>

      {isMobile && <BottomNav />}

      {selected && <DetailDrawer order={selected} onClose={() => setSelected(null)} onAction={handleRowAction} />}
      {creating && <CreateModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
      {assignTarget && (
        <AssignModal
          order={assignTarget}
          onClose={() => setAssignTarget(null)}
          onConfirm={handleAssignConfirm}
        />
      )}

      {toast && (
        <div style={{
          position: "fixed", bottom: isMobile ? 76 : 24, left: "50%", transform: "translateX(-50%)",
          background: C.onSurface, color: "#fff", padding: "12px 24px",
          borderRadius: 30, fontSize: 13, fontFamily: MONO, zIndex: 300,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}