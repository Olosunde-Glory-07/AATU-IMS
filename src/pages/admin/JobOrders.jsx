import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "var(--color-on-surface)",
  primaryContainer:       "var(--color-primary-container)",
  onPrimaryContainer:     "var(--color-on-primary-container)",
  secondary:              "var(--color-secondary)",
  secondaryContainer:     "var(--color-secondary-container)",
  onSecondaryContainer:   "var(--color-on-secondary-container)",
  errorContainer:         "var(--color-error-container)",
  onErrorContainer:       "var(--color-on-error-container)",
  error:                  "var(--color-error)",
  surface:                "var(--color-background)",
  surfaceContainer:       "var(--color-surface-container)",
  surfaceContainerLow:    "var(--color-surface-container-low)",
  surfaceContainerHigh:   "var(--color-surface-container-high)",
  surfaceContainerLowest: "var(--color-surface-container-lowest)",
  onSurface:              "var(--color-on-surface)",
  onSurfaceVariant:       "var(--color-on-surface-variant)",
  outlineVariant:         "var(--color-outline-variant)",
  outline:                "var(--color-outline)",
  white:                  "#ffffff",
};
// Card surfaces — flips to a dark surface in dark mode. Distinct from C.white,
// which stays literal white for text/icons on top of colored backgrounds.
const CARD = "var(--color-surface-container-lowest)";
// Sidebar stays a fixed brand color in both themes.
const SIDEBAR_BG = "#4a0404";

const MONO = "'JetBrains Mono', monospace";
const SANS = "'Hanken Grotesk', sans-serif";

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/admin/dashboard"     },
  { icon: "list_alt",      label: "Requests",      path: "/admin/requests"      },
  { icon: "engineering",   label: "Job Orders",    path: "/admin/job-orders"    },
  { icon: "inventory_2",   label: "Assets",        path: "/admin/assets"        },
  { icon: "group",         label: "Users",         path: "/admin/users"         },
  { icon: "domain",        label: "Departments",   path: "/admin/departments"   },
  { icon: "notifications", label: "Notifications", path: "/admin/notifications" },
];

// Semantic priority/status chip colors — intentionally kept as literal light
// hex chips in both themes (no dark-mode equivalent token set exists yet).
const PRIORITY_CFG = {
  Emergency: { bg: "#FEE2E2", text: "#991B1B" },
  High:      { bg: "#FEF3C7", text: "#92400E" },
  Medium:    { bg: C.secondaryContainer, text: C.onSecondaryContainer },
  Low:       { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant },
};

const STATUS_CFG = {
  "Pending Approval": { bg: "#FEF3C7",            text: "#92400E",   dot: "#f59e0b"   },
  "Approved":         { bg: "#EEF2FF",            text: "#3730A3",   dot: "#6366f1"   },
  "In Progress":      { bg: C.secondaryContainer, text: C.secondary, dot: C.secondary },
  "Completed":        { bg: "#dcfce7",            text: "#166534",   dot: C.secondary },
};

const TABS    = ["All Orders", "Pending Approval", "Approved", "In Progress", "Completed"];
const PER_PAGE = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
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

function Avatar({ name, size = 28 }) {
  const ini = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: C.surfaceContainerHigh,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size < 30 ? 10 : 12, fontWeight: 700,
      color: C.onSurfaceVariant, fontFamily: MONO, flexShrink: 0,
      border: `2px solid ${CARD}`,
    }}>{ini}</div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Low;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 4, background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {priority}
    </span>
  );
}

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["Pending Approval"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.text, fontFamily: MONO }}>{status}</span>
    </div>
  );
}

function ProgressBar({ pct, status }) {
  const fill = status === "Completed" ? C.secondary : pct === 0 ? C.outlineVariant : C.primaryContainer;
  return (
    <div style={{ width: "100%", height: 4, background: C.surfaceContainerHigh, borderRadius: 99 }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: fill, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ─── Sidebar — identical pattern to admin Dashboard ──────────────────────────
function Sidebar({ open, onClose }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();
  const { profile } = useAuth();

  const content = (
    <aside style={{
      width: 260, background: SIDEBAR_BG, color: C.white,
      display: "flex", flexDirection: "column", height: "100%",
      overflowY: "auto", borderRight: `1px solid ${C.outlineVariant}`, fontFamily: SANS,
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
        <button
          onClick={() => navigate("/admin/profile")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 8px", background: "transparent",
            color: "rgba(255,255,255,0.65)", border: "none", cursor: "pointer",
            fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
          }}
        >
          <Icon name="account_circle" size={20} />
          {profile?.full_name ? `${profile.full_name.split(" ")[0]}'s Profile` : "User Profile"}
        </button>
        <button
          onClick={() => navigate("/login")}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "10px 8px", background: "transparent",
            color: "rgba(255,255,255,0.4)", border: "none", cursor: "pointer",
            fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
          }}
        >
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
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, zIndex: 101, boxShadow: "4px 0 20px rgba(0,0,0,0.2)" }}>
        {content}
      </div>
    </>
  );
}

// ─── Mobile Bottom Nav — identical pattern to admin Dashboard ─────────────────
function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const quickNav = NAV_ITEMS.slice(0, 5);

  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90,
      background: CARD, borderTop: `1px solid ${C.outlineVariant}`,
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

// ─── TopBar — hamburger before search, profile avatar on right ────────────────
function TopBar({ onMenuClick, search, setSearch, isMobile }) {
  const navigate    = useNavigate();
  const { profile } = useAuth();

  const ini = (profile?.full_name || "A")
    .split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header style={{
      height: 64, display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: isMobile ? "0 16px" : "0 32px",
      position: "sticky", top: 0, zIndex: 40,
      background: "color-mix(in srgb, var(--color-background) 92%, transparent)", backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {/* Hamburger — before search, mobile only */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurface, padding: 4, flexShrink: 0, display: "flex" }}
          >
            <Icon name="menu" size={24} />
          </button>
        )}

        {/* Search */}
        <div style={{ position: "relative", flex: 1, maxWidth: isMobile ? "100%" : 420 }}>
          <Icon name="search" size={18} style={{
            position: "absolute", left: 10, top: "50%",
            transform: "translateY(-50%)", color: C.onSurfaceVariant,
          }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job orders…"
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 16,
              paddingTop: 9, paddingBottom: 9,
              background: C.surfaceContainerLow, border: "none",
              borderRadius: 8, fontSize: 14, outline: "none",
              color: C.onSurface, fontFamily: SANS, boxSizing: "border-box",
            }}
          />
        </div>

        {/* Page title — desktop only */}
        {!isMobile && (
          <h1 style={{ fontSize: 20, fontWeight: 600, color: C.onSurface, margin: 0, whiteSpace: "nowrap" }}>
            Job Orders
          </h1>
        )}
      </div>

      {/* Right: notifications + profile avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, flexShrink: 0 }}>
        {!isMobile && (
          <button
            onClick={() => navigate("/admin/notifications")}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurfaceVariant, display: "flex" }}
          >
            <Icon name="notifications" size={22} />
          </button>
        )}

        {/* Profile avatar — navigates to shared profile page */}
        <button
          onClick={() => navigate("/admin/profile")}
          title={profile?.full_name || "My Profile"}
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: C.primaryContainer,
            border: `2px solid ${C.outlineVariant}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: C.white, fontSize: 13,
            flexShrink: 0, cursor: "pointer", fontFamily: MONO,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          {ini}
        </button>
      </div>
    </header>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, label, value, valueColor, cardStyle, loading, filled }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: "18px", display: "flex", alignItems: "center", gap: 14, ...(cardStyle || {}) }}>
      <div style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={icon} size={22} filled={filled} style={{ color: iconColor }} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
        {loading
          ? <div style={{ width: 40, height: 22, background: C.surfaceContainerHigh, borderRadius: 6, marginTop: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
          : <h3 style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 700, color: valueColor || C.onSurface, fontFamily: SANS }}>{value}</h3>}
      </div>
    </div>
  );
}

// ─── Desktop Table Row ────────────────────────────────────────────────────────
function TableRow({ order, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onClick={() => onSelect(order)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ borderTop: `1px solid ${C.outlineVariant}33`, background: hov ? C.surfaceContainerLow : "transparent", cursor: "pointer", transition: "background 0.12s", opacity: order.status === "Completed" ? 0.75 : 1 }}
    >
      <td style={{ padding: "14px 20px", fontSize: 12, fontFamily: MONO, color: C.onPrimaryContainer, whiteSpace: "nowrap" }}>#{order.id.slice(0, 8)}</td>
      <td style={{ padding: "14px 20px", minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.onSurface }}>{order.title}</div>
        <div style={{ fontSize: 12, color: C.onSurfaceVariant, marginTop: 2 }}>{order.location}</div>
      </td>
      <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}><PriorityBadge priority={order.priority} /></td>
      <td style={{ padding: "14px 20px", whiteSpace: "nowrap" }}><StatusChip status={order.status} /></td>
      <td style={{ padding: "14px 20px", minWidth: 120 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ProgressBar pct={order.progress} status={order.status} />
          <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>{order.progress}%</span>
        </div>
      </td>
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={order.assigneeName} />
          <span style={{ fontSize: 13, color: C.onSurface }}>{order.assigneeName || "Unassigned"}</span>
        </div>
      </td>
      <td style={{ padding: "14px 20px", fontSize: 13, color: C.onSurfaceVariant, whiteSpace: "nowrap" }}>{order.createdAt}</td>
      <td style={{ padding: "14px 20px", textAlign: "right" }}>
        {order.status === "Completed"
          ? <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, color: C.secondary }}><Icon name="check_circle" size={16} filled /><span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>Done</span></div>
          : <Icon name="chevron_right" size={20} style={{ color: C.onSurfaceVariant }} />}
      </td>
    </tr>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────
function MobileOrderCard({ order, onSelect }) {
  return (
    <div
      onClick={() => onSelect(order)}
      style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer", opacity: order.status === "Completed" ? 0.82 : 1 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onPrimaryContainer }}>#{order.id.slice(0, 8)}</p>
          <h3 style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{order.title}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onSurfaceVariant }}>{order.location}</p>
        </div>
        <PriorityBadge priority={order.priority} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}><ProgressBar pct={order.progress} status={order.status} /></div>
        <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, flexShrink: 0 }}>{order.progress}%</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Avatar name={order.assigneeName} size={22} />
          <span style={{ fontSize: 12, color: C.onSurface }}>{order.assigneeName || "Unassigned"}</span>
        </div>
        <StatusChip status={order.status} />
      </div>
      {order.hodSignedAt && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#DCFCE7", borderRadius: 6 }}>
          <Icon name="verified" size={13} style={{ color: "#166534" }} />
          <span style={{ fontSize: 11, color: "#166534", fontFamily: MONO, fontWeight: 700 }}>HOD Approved</span>
        </div>
      )}
    </div>
  );
}

// ─── Reject Proof Modal ───────────────────────────────────────────────────────
function RejectProofModal({ order, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState("");
  return (
    <>
      <div onClick={!submitting ? onClose : undefined} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(460px, 95vw)", background: CARD, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.errorContainer, display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="cancel" size={22} filled style={{ color: C.onErrorContainer }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onErrorContainer }}>Reject Signed Approval</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onErrorContainer, opacity: 0.85 }}>{order.title}</p>
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <label style={{ display: "block", fontSize: 10, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", color: C.onSurfaceVariant, marginBottom: 6 }}>
            Reason (sent to the technician)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. The photo doesn't show a signature, or this isn't the job order document…"
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", background: C.surface, color: C.onSurface, fontFamily: SANS }}
          />
        </div>
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: "9px 18px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={submitting || !reason.trim()}
            style={{ padding: "9px 20px", background: C.error, color: "#ffffff", border: "none", borderRadius: 8, cursor: submitting || !reason.trim() ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: submitting || !reason.trim() ? 0.6 : 1 }}
          >
            {submitting ? "Rejecting…" : "Reject & Notify Technician"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ order, onClose, onUpdateProgress, onMarkComplete, onRejectProof, isMobile }) {
  const [progress, setProgress] = useState(order?.progress ?? 0);

  useEffect(() => {
    if (order) setProgress(order.progress ?? 0);
  }, [order?.id]);

  if (!order) return null;
  const canEdit = order.status !== "Completed";
  // Only offer rejection while there's an actual proof on file and the job
  // isn't already wrapped up — rejecting a completed job doesn't make sense.
  const canRejectProof = !!order.hodProofUrl && order.status !== "Completed";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: isMobile ? "100vw" : "min(440px,100vw)",
        background: CARD, zIndex: 101,
        boxShadow: "-6px 0 32px rgba(0,0,0,0.13)",
        display: "flex", flexDirection: "column",
        fontFamily: SANS, overflowY: "auto",
      }}>
        {/* Mobile back button */}
        {isMobile && (
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.primaryContainer, fontWeight: 700, fontSize: 13, fontFamily: MONO, padding: 0 }}>
              <Icon name="arrow_back" size={20} style={{ color: C.primaryContainer }} />
              Back to list
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, paddingRight: isMobile ? 0 : 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontFamily: MONO, color: C.onPrimaryContainer, fontWeight: 700 }}>#{order.id.slice(0, 8)}</span>
                <PriorityBadge priority={order.priority} />
              </div>
              <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{order.title}</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>{order.location}</p>
            </div>
            {!isMobile && (
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
                <Icon name="close" size={20} />
              </button>
            )}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>PROGRESS</span>
              <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>{progress}%</span>
            </div>
            <ProgressBar pct={progress} status={order.status} />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Status</div>
            <StatusChip status={order.status} />
          </div>

          {/* Previous rejection banner — visible until the technician re-uploads */}
          {order.hodProofRejectionReason && !order.hodProofUrl && (
            <div style={{ background: C.errorContainer, border: `1px solid color-mix(in srgb, ${C.error} 20%, transparent)`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Icon name="report" size={18} style={{ color: C.onErrorContainer, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.onErrorContainer }}>You rejected the last upload</p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: C.onErrorContainer, lineHeight: 1.5 }}>{order.hodProofRejectionReason}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: C.onErrorContainer, opacity: 0.8 }}>Waiting for the technician to re-upload.</p>
              </div>
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>HOD Approval</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: order.hodSignedAt ? "#DCFCE7" : "#FEF3C7" }}>
              <Icon name={order.hodSignedAt ? "verified" : "pending"} size={16} style={{ color: order.hodSignedAt ? "#166534" : "#92400E" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: order.hodSignedAt ? "#166534" : "#92400E" }}>
                {order.hodSignedAt
                  ? `Approved by ${order.hodName} — ${new Date(order.hodSignedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Awaiting Head of Department's physical signature"}
              </span>
            </div>

            {/* Uploaded proof photo — the actual thing an admin needs to review */}
            {order.hodProofUrl && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => window.open(order.hodProofUrl, "_blank", "noopener,noreferrer")}
                  style={{ display: "block", width: "100%", padding: 0, border: `1px solid ${C.outlineVariant}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "none" }}
                >
                  <img
                    src={order.hodProofUrl}
                    alt="Uploaded signed job order"
                    style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }}
                  />
                </button>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: C.onSurfaceVariant, textAlign: "center" }}>Tap the photo to view full size</p>

                {canRejectProof && (
                  <button
                    onClick={() => onRejectProof(order)}
                    style={{ marginTop: 10, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "none", border: `1px solid ${C.error}`, color: C.error, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700 }}
                  >
                    <Icon name="cancel" size={15} style={{ color: C.error }} />
                    Reject This Upload
                  </button>
                )}
              </div>
            )}
          </div>

          {order.pdfUrl && (
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Job Order Document</div>
              <button onClick={() => window.open(order.pdfUrl, "_blank", "noopener,noreferrer")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.outlineVariant}`, background: CARD, cursor: "pointer", textAlign: "left", width: "100%" }}>
                <Icon name="picture_as_pdf" size={20} style={{ color: C.error }} />
                <span style={{ flex: 1, fontSize: 13, color: C.onSurface, fontWeight: 600 }}>View Job Order PDF</span>
                <Icon name="open_in_new" size={16} style={{ color: C.onSurfaceVariant }} />
              </button>
            </div>
          )}

          {[
            ["Assigned Technician", order.assigneeName || "Unassigned"],
            ["Department",          order.department   || "—"],
            ["Created",             order.createdAt    || "—"],
            ["Linked Request",      order.requestId ? `#${order.requestId.slice(0, 8)}` : "—"],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 4, textTransform: "uppercase" }}>{lbl}</div>
              <div style={{ fontSize: 14, color: C.onSurface, fontWeight: 500 }}>{val}</div>
            </div>
          ))}

          {order.notes && (
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 6, textTransform: "uppercase" }}>Field Notes</div>
              <div style={{ background: C.surfaceContainerLow, borderRadius: 8, padding: "12px 14px", fontSize: 13, color: C.onSurface, lineHeight: 1.6, border: `1px solid ${C.outlineVariant}` }}>
                {order.notes}
              </div>
            </div>
          )}

          {canEdit && (
            <div>
              <div style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>Update Progress</div>
              <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", accentColor: C.primaryContainer }} />
              <button onClick={() => onUpdateProgress(order, progress)} style={{ marginTop: 8, width: "100%", padding: "9px 0", background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>
                Save Progress
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px 0", background: C.surfaceContainerHigh, color: C.onSurface, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}>
            Close
          </button>
          {canEdit && (
            <button onClick={() => onMarkComplete(order)} style={{ flex: 1, padding: "11px 0", background: C.secondaryContainer, color: C.onSecondaryContainer, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="check_circle" size={15} style={{ color: C.onSecondaryContainer }} />
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--color-inverse-surface)", color: "var(--color-inverse-on-surface)", padding: "10px 22px", borderRadius: 99, fontSize: 13, fontFamily: SANS, fontWeight: 600, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminJobOrdersPage() {
  const isMobile  = useIsMobile();
  const { profile } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search,     setSearch]     = useState("");
  const [activeTab,  setActiveTab]  = useState("All Orders");
  const [selected,   setSelected]   = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting,  setRejecting]  = useState(false);
  const [page,       setPage]       = useState(1);
  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [orders,     setOrders]     = useState([]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("job_orders")
        .select(`
          id, title, location, department, priority, status,
          progress, notes, created_at, request_id, technician_id,
          pdf_url, hod_signed_at, hod_name, hod_proof_url, hod_proof_rejection_reason,
          technician:profiles!job_orders_technician_id_fkey ( full_name )
        `)
        .order("created_at", { ascending: false });

      if (error) { console.error("Job orders fetch error:", error.message); showToast(`Failed to load job orders: ${error.message}`); return; }

      setOrders((data ?? []).map((o) => ({
        id:                      o.id,
        title:                   o.title,
        location:                o.location,
        department:              o.department,
        priority:                o.priority,
        status:                  o.status,
        progress:                o.progress ?? 0,
        notes:                   o.notes,
        pdfUrl:                  o.pdf_url,
        hodSignedAt:             o.hod_signed_at,
        hodName:                 o.hod_name,
        hodProofUrl:             o.hod_proof_url,
        hodProofRejectionReason: o.hod_proof_rejection_reason,
        requestId:               o.request_id,
        technicianId:            o.technician_id,
        assigneeName:            o.technician?.full_name ?? "Unassigned",
        createdAt:    new Date(o.created_at).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
      })));
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  }, []);

  useEffect(() => { setLoading(true); fetchOrders().finally(() => setLoading(false)); }, [fetchOrders]);

  async function handleUpdateProgress(order, progress) {
    try {
      const newStatus = progress >= 100 ? "Completed" : progress > 0 ? "In Progress" : order.status;
      const { error } = await supabase.from("job_orders").update({ progress, status: newStatus }).eq("id", order.id);
      if (error) throw error;
      if (newStatus === "Completed" && order.requestId) {
        await supabase.from("requests").update({ status: "Completed" }).eq("id", order.requestId);
      }
      await fetchOrders();
      setSelected((s) => s && s.id === order.id ? { ...s, progress, status: newStatus } : s);
      showToast("Progress updated.");
    } catch (err) { showToast("Failed to update progress."); }
  }

  async function handleMarkComplete(order) {
    try {
      const { error } = await supabase.from("job_orders").update({ status: "Completed", progress: 100 }).eq("id", order.id);
      if (error) throw error;
      if (order.requestId) await supabase.from("requests").update({ status: "Completed" }).eq("id", order.requestId);
      await fetchOrders();
      setSelected(null);
      showToast("Job order marked complete.");
    } catch (err) { showToast("Failed to mark complete."); }
  }

  // ── Reject the uploaded HOD proof — clears the approval and notifies the
  //    technician so they know to re-upload with what's wrong. ──────────────
  async function handleRejectProof(reason) {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      const { error } = await supabase
        .from("job_orders")
        .update({
          status:                     "Pending Approval",
          hod_name:                   null,
          hod_signed_at:              null,
          hod_proof_url:              null,
          hod_proof_rejection_reason: reason.trim(),
        })
        .eq("id", rejectTarget.id);
      if (error) throw error;

      if (rejectTarget.technicianId) {
        try {
          await supabase.from("notifications").insert({
            user_id: rejectTarget.technicianId,
            type:    "JobUpdate",
            title:   "Signed Approval Rejected",
            body:    `${profile?.full_name ?? "The admin"} rejected the uploaded approval for "${rejectTarget.title}". Reason: ${reason.trim()}. Please re-upload a clear photo of the signed job order.`,
            read:    false,
          });
        } catch (notifErr) {
          console.warn("Failed to notify technician (non-fatal):", notifErr);
        }
      }

      await fetchOrders();
      setSelected(null);
      setRejectTarget(null);
      showToast("Upload rejected. Technician notified.");
    } catch (err) {
      console.error("Reject proof error:", err);
      showToast("Failed to reject upload.");
    } finally {
      setRejecting(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const tabOk    = activeTab === "All Orders" || o.status === activeTab;
      const searchOk = !q || [o.id, o.title, o.location, o.assigneeName, o.department].some((f) => f?.toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [orders, activeTab, search]);

  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const STAT_CARDS = [
    { icon: "pending_actions", label: "Pending Approval", value: orders.filter((o) => o.status === "Pending Approval").length, iconBg: C.surfaceContainerHigh,    iconColor: C.onSurfaceVariant },
    { icon: "bolt",            label: "In Progress",      value: orders.filter((o) => o.status === "In Progress").length,      iconBg: C.secondaryContainer,      iconColor: C.secondary, filled: true },
    { icon: "check_circle",    label: "Completed",        value: orders.filter((o) => o.status === "Completed").length,        iconBg: C.surfaceContainerLow,     iconColor: C.onSurfaceVariant },
    {
      icon: "warning", label: "Critical",
      value: orders.filter((o) => o.priority === "Emergency" && o.status !== "Completed").length,
      iconBg: C.errorContainer, iconColor: C.onErrorContainer, valueColor: C.error, filled: true,
      cardStyle: { background: `linear-gradient(135deg, color-mix(in srgb, ${C.errorContainer} 55%, transparent) 0%, transparent 100%)` },
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box}`}</style>

      {/* Sidebar — same as dashboard */}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{
        marginLeft: isMobile ? 0 : 260,
        flex: 1, display: "flex", flexDirection: "column",
        paddingBottom: isMobile ? 60 : 0, minWidth: 0,
      }}>
        {/* TopBar — hamburger before search */}
        <TopBar
          onMenuClick={() => setDrawerOpen(true)}
          search={search}
          setSearch={setSearch}
          isMobile={isMobile}
        />

        <div style={{ flex: 1, padding: isMobile ? "20px 14px 32px" : "32px", maxWidth: 1600, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

          {/* Page Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: 16, marginBottom: isMobile ? 20 : 28 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>Job Orders</h2>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: C.onSurfaceVariant }}>Auto-created when a technician is assigned to a request.</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 20 : 24 }}>
            {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
          </div>

          {/* Table Container */}
          <div style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>

            {/* Toolbar */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: C.surface, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 2, flexShrink: 0 }}>
                {TABS.map((tab) => (
                  <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }} style={{ padding: isMobile ? "6px 12px" : "7px 14px", borderRadius: 7, fontSize: 11, fontFamily: MONO, border: "none", cursor: "pointer", background: activeTab === tab ? C.surfaceContainerHigh : "transparent", color: activeTab === tab ? C.onSurface : C.onSurfaceVariant, fontWeight: activeTab === tab ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.12s" }}>
                    {tab}
                  </button>
                ))}
              </div>
              {!isMobile && (
                <button onClick={() => {
                  const header = ["ID","Title","Location","Department","Priority","Status","Progress","Assignee","Created"];
                  const rows = filtered.map((o) => [o.id,o.title,o.location,o.department,o.priority,o.status,o.progress,o.assigneeName,o.createdAt]);
                  const csv = [header,...rows].map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "job-orders.csv"; a.click();
                  URL.revokeObjectURL(url); showToast("Exported as CSV.");
                }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 7, background: CARD, cursor: "pointer", fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO }}>
                  <Icon name="download" size={16} /> Export
                </button>
              )}
            </div>

            {/* Content */}
            {loading ? (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                {[1,2,3].map((i) => <div key={i} style={{ height: 56, background: C.surfaceContainerLow, borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />)}
              </div>
            ) : paged.length === 0 ? (
              <div style={{ padding: isMobile ? 40 : 56, textAlign: "center", color: C.onSurfaceVariant }}>
                <Icon name="engineering" size={40} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                  {orders.length === 0 ? "No job orders yet" : "No job orders match your filters"}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                  {orders.length === 0 ? "Assign a technician to a request to create one." : "Try adjusting your search or tab."}
                </p>
              </div>
            ) : isMobile ? (
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {paged.map((o) => <MobileOrderCard key={o.id} order={o} onSelect={setSelected} />)}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS }}>
                  <thead>
                    <tr style={{ background: "color-mix(in srgb, var(--color-surface-container-low) 60%, transparent)" }}>
                      {["Order ID","Task Description","Priority","Status","Progress","Assigned To","Created",""].map((h, i) => (
                        <th key={i} style={{ padding: "11px 20px", textAlign: i === 7 ? "right" : "left", fontSize: 10, fontWeight: 500, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", opacity: 0.7 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((o) => <TableRow key={o.id} order={o} onSelect={setSelected} />)}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderTop: `1px solid ${C.outlineVariant}`, flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>{paged.length} of {filtered.length}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1} style={{ padding: "5px 10px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: "none", cursor: page===1?"default":"pointer", opacity: page===1?0.4:1, display: "flex", color: C.onSurface }}>
                    <Icon name="chevron_left" size={18} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, isMobile ? 3 : 5) }, (_, i) => i+1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} style={{ padding: "5px 11px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: page===p?C.primaryContainer:"none", color: page===p?"#ffffff":C.onSurface, cursor: "pointer", fontSize: 13, fontWeight: page===p?700:400, fontFamily: MONO }}>{p}</button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ padding: "5px 10px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: "none", cursor: page===totalPages?"default":"pointer", opacity: page===totalPages?0.4:1, display: "flex", color: C.onSurface }}>
                    <Icon name="chevron_right" size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sync indicator */}
          <div style={{ marginTop: 18, display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", background: C.primaryContainer, borderRadius: 10, color: "#ffffff" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ffb4aa", animation: "pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, fontFamily: MONO, fontWeight: 700, letterSpacing: "0.06em" }}>Auto-synced with Requests</span>
          </div>
        </div>
      </main>

      {/* Bottom Nav — same as dashboard, mobile only */}
      {isMobile && <BottomNav />}

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateProgress={handleUpdateProgress}
          onMarkComplete={handleMarkComplete}
          onRejectProof={(order) => setRejectTarget(order)}
          isMobile={isMobile}
        />
      )}

      {rejectTarget && (
        <RejectProofModal
          order={rejectTarget}
          submitting={rejecting}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectProof}
        />
      )}

      <Toast msg={toast} />
    </div>
  );
}