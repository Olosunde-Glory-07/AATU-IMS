import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

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

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/student/dashboard"     },
  { icon: "list_alt",      label: "My Requests",   path: "/student/my-requests"   },
  { icon: "history",       label: "My History",    path: "/student/my-history"    },
  { icon: "notifications", label: "Notifications", path: "/student/notifications" },
];

const TYPE_CFG = {
  Emergency:     { iconBg: "#FEE2E2", iconColor: C.error,           icon: "warning",        badgeBg: "#FEE2E2",              badgeText: C.error,            leftBorder: C.error,           dotColor: C.error    },
  Assigned:      { iconBg: "#EEF2FF", iconColor: "#4338CA",         icon: "assignment_ind", badgeBg: "#EEF2FF",              badgeText: "#4338CA",          leftBorder: "#818cf8",         dotColor: "#6366f1"  },
  "Under Review":{ iconBg: "#FEF3C7", iconColor: "#b45309",         icon: "visibility",     badgeBg: "#FEF3C7",              badgeText: "#b45309",          leftBorder: "#f59e0b",         dotColor: "#f59e0b"  },
  Completed:     { iconBg: "#DCFCE7", iconColor: C.secondary,       icon: "check_circle",   badgeBg: "#DCFCE7",              badgeText: "#166534",          leftBorder: C.secondary,       dotColor: C.secondary},
  Announcement:  { iconBg: C.surfaceContainerHighest, iconColor: C.primaryContainer, icon: "campaign", badgeBg: C.surfaceContainerHighest, badgeText: C.onSurfaceVariant, leftBorder: C.outline, dotColor: C.outline },
  Update:        { iconBg: C.surfaceContainer, iconColor: C.primary, icon: "info",          badgeBg: C.surfaceContainer,     badgeText: C.onSurfaceVariant, leftBorder: C.onSurfaceVariant,dotColor: C.onSurfaceVariant },
};

const FILTER_TABS = ["All", "Unread", "Emergency", "Assigned", "Completed", "Announcement"];
const SUPPORT_LINKS = [
  { label: "Help Documentation",   icon: "help"     },
  { label: "Live Support Chat",    icon: "forum"    },
  { label: "Provide App Feedback", icon: "feedback" },
];
const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent!"];

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function useIsMobile() {
  const [mob, setMob] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mob;
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

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange, loading }) {
  return (
    <button onClick={onChange} disabled={loading} style={{
      width: 44, height: 24, borderRadius: 99, border: "none", cursor: loading ? "wait" : "pointer",
      background: on ? C.primaryContainer : C.outlineVariant,
      position: "relative", transition: "background 0.2s", flexShrink: 0,
      opacity: loading ? 0.6 : 1,
    }}>
      <div style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: C.white,
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ─── Settings Modal ───────────────────────────────────────────────────────────
function SettingsModal({ notificationsEnabled, onToggle, toggling, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(400px,95vw)", background: C.white, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface }}>Notification Settings</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Main toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 16px", background: C.surfaceContainerLow, borderRadius: 10, border: `1px solid ${C.outlineVariant}` }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.onSurface }}>Enable Notifications</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: C.onSurfaceVariant }}>
                {notificationsEnabled ? "You are receiving notifications." : "Notifications are currently paused."}
              </p>
            </div>
            <Toggle on={notificationsEnabled} onChange={onToggle} loading={toggling} />
          </div>

          {/* What you get notified about */}
          <div>
            <p style={{ margin: "0 0 10px", fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>You will be notified about</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "assignment_ind", label: "Technician assigned to your request" },
                { icon: "check_circle",  label: "Request marked as completed"          },
                { icon: "warning",       label: "Emergency alerts on campus"           },
                { icon: "campaign",      label: "Campus announcements"                 },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, opacity: notificationsEnabled ? 1 : 0.4 }}>
                  <Icon name={item.icon} size={16} style={{ color: C.primaryContainer }} />
                  <span style={{ fontSize: 13, color: C.onSurface }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {!notificationsEnabled && (
            <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: "#FEF3C7", border: "1px solid #f59e0b33", borderRadius: 8 }}>
              <Icon name="info" size={16} style={{ color: "#92400E", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                Notifications are paused. You won't receive updates about your requests until you re-enable them.
              </p>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <button onClick={onClose} style={{ width: "100%", padding: "10px 0", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ currentPath, onNavigate, onLogout, firstName, unreadCount }) {
  return (
    <aside style={{ width: 260, background: C.primaryContainer, color: C.white, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, overflowY: "auto", fontFamily: SANS }}>
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
            <button key={item.label} onClick={() => onNavigate(item.path)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO, transition: "background 0.15s" }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
              {item.label}
              {item.label === "Notifications" && unreadCount > 0 && (
                <span style={{ marginLeft: "auto", background: C.error, color: C.white, borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "1px 6px", fontFamily: MONO }}>{unreadCount}</span>
              )}
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
function MobileDrawer({ open, onClose, currentPath, onNavigate, onLogout, firstName, unreadCount }) {
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
              <button key={item.label} onClick={() => { onNavigate(item.path); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO }}>
                <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
                {item.label}
                {item.label === "Notifications" && unreadCount > 0 && (
                  <span style={{ marginLeft: "auto", background: C.error, color: C.white, borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "1px 6px", fontFamily: MONO }}>{unreadCount}</span>
                )}
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
function MobileBottomNav({ currentPath, onNavigate, unreadCount }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: C.white, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 62 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath.startsWith(item.path);
        return (
          <button key={item.label} onClick={() => onNavigate(item.path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: isActive ? C.primaryContainer : C.onSurfaceVariant, fontFamily: MONO, fontSize: 9, fontWeight: isActive ? 700 : 400, borderTop: isActive ? `2px solid ${C.primaryContainer}` : "2px solid transparent", position: "relative" }}>
            <div style={{ position: "relative" }}>
              <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
              {item.label === "Notifications" && unreadCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -4, width: 14, height: 14, background: C.error, borderRadius: "50%", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontWeight: 700, fontFamily: MONO }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ search, setSearch, onMenu, isMobile, onNavigate, onSettings }) {
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 20px", position: "sticky", top: 0, zIndex: 40, background: "rgba(249,249,255,0.94)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 10 }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurface, display: "flex", flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 380, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications…" style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 99, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }} />
      </div>
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button onClick={onSettings} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="settings" size={22} />
          </button>
          <div style={{ width: 1, height: 28, background: C.outlineVariant }} />
          <button onClick={() => onNavigate("/student/my-requests")} style={{ background: C.primaryContainer, color: C.white, border: "none", cursor: "pointer", padding: "8px 18px", borderRadius: 8, fontSize: 12, fontFamily: MONO, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, transition: "opacity 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            <Icon name="list_alt" size={16} style={{ color: C.white }} />
            My Requests
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Rating Modal ─────────────────────────────────────────────────────────────
function RatingModal({ onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(420px,95vw)", background: C.white, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Rate the Service</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>How was your experience with the technician?</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={20} />
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(star)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, transition: "transform 0.15s", transform: hovered >= star || rating >= star ? "scale(1.15)" : "scale(1)" }}>
                <Icon name="star" size={36} filled style={{ color: star <= (hovered || rating) ? "#f59e0b" : C.outlineVariant }} />
              </button>
            ))}
          </div>
          <p style={{ textAlign: "center", margin: 0, fontSize: 14, fontFamily: MONO, fontWeight: 700, color: rating > 0 ? C.onSurface : C.onSurfaceVariant, minHeight: 20 }}>
            {STAR_LABELS[hovered || rating] || "Tap a star to rate"}
          </p>
          <div>
            <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Comment (optional)</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience…" rows={3} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: C.surfaceContainerLow, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button onClick={() => rating > 0 && onSubmit(rating, comment)} disabled={rating === 0} style={{ flex: 1, padding: "10px 0", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: rating === 0 ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: rating === 0 ? 0.4 : 1 }}>
            Submit Rating
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({ notif, onMarkRead, onDismiss, onAction }) {
  const [hov, setHov] = useState(false);
  const cfg = TYPE_CFG[notif.type] || TYPE_CFG.Update;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: notif.read ? `${C.surfaceContainerLow}70` : C.white, border: `1px solid ${C.outlineVariant}`, borderLeft: `4px solid ${cfg.leftBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", gap: 16, boxShadow: hov ? "0 4px 14px rgba(0,0,0,0.07)" : "none", transition: "box-shadow 0.18s, background 0.15s", opacity: notif.read ? 0.85 : 1, position: "relative" }}>
      {!notif.read && (
        <div style={{ position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: "50%", background: cfg.dotColor }} />
      )}
      <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={cfg.icon} size={22} filled style={{ color: cfg.iconColor }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ padding: "2px 9px", borderRadius: 4, background: cfg.badgeBg, color: cfg.badgeText, fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.06em", textTransform: "uppercase" }}>{notif.type}</span>
          <span style={{ fontSize: 11, fontFamily: MONO, color: C.outline, whiteSpace: "nowrap", flexShrink: 0 }}>{notif.time}</span>
        </div>
        <h4 style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{notif.title}</h4>
        <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.6 }}>{notif.body}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          {notif.action && (
            <button onClick={() => onAction(notif)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: notif.action.type === "rate" ? C.secondaryContainer : C.primaryContainer, color: notif.action.type === "rate" ? C.onSecondaryContainer : C.white, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>
              <Icon name={notif.action.type === "rate" ? "star" : "open_in_new"} size={14} style={{ color: notif.action.type === "rate" ? C.onSecondaryContainer : C.white }} />
              {notif.action.label}
            </button>
          )}
          {!notif.read && (
            <button onClick={() => onMarkRead(notif.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "none", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>
              <Icon name="done" size={14} style={{ color: C.onSurfaceVariant }} />
              Mark read
            </button>
          )}
          <button onClick={() => onDismiss(notif.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", background: "none", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, marginLeft: "auto", opacity: hov ? 1 : 0.5, transition: "opacity 0.15s" }}>
            <Icon name="close" size={13} style={{ color: C.onSurfaceVariant }} />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Sidebar Panel ──────────────────────────────────────────────────────
function StatsSidebar({ notifications, onNavigate, notificationsEnabled, onSettings }) {
  const unread    = notifications.filter((n) => !n.read).length;
  const active    = notifications.filter((n) => n.type === "Assigned" || n.type === "Under Review").length;
  const emergency = notifications.filter((n) => n.type === "Emergency").length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Notification toggle status */}
      <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.onSurface }}>Notifications</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: notificationsEnabled ? C.secondary : C.onSurfaceVariant }}>
              {notificationsEnabled ? "Enabled" : "Paused"}
            </p>
          </div>
          <button onClick={onSettings} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: MONO, color: C.onSurface }}>
            <Icon name="settings" size={14} />
            Settings
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.onSurface }}>Summary</h3>
        </div>
        <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Unread",    value: unread,    icon: "notifications", color: unread > 0 ? C.error : C.secondary },
            { label: "Active",    value: active,    icon: "pending",       color: active > 0 ? "#b45309" : C.secondary },
            { label: "Emergency", value: emergency, icon: "warning",       color: emergency > 0 ? C.error : C.secondary },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surfaceContainerLow, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name={icon} size={17} style={{ color }} />
                </div>
                <span style={{ fontSize: 13, color: C.onSurface }}>{label}</span>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.onSurface }}>Quick Links</h3>
        </div>
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { label: "View My Requests",     icon: "list_alt",  action: () => onNavigate("/student/my-requests") },
            { label: "View Request History", icon: "history",   action: () => onNavigate("/student/my-history")  },
            { label: "Back to Dashboard",    icon: "dashboard", action: () => onNavigate("/student/dashboard")   },
          ].map((item) => (
            <button key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderRadius: 8, cursor: "pointer", color: C.onSurface, fontSize: 13, fontFamily: SANS, textAlign: "left", transition: "background 0.12s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainerLow}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <Icon name={item.icon} size={18} style={{ color: C.primaryContainer }} />
              {item.label}
              <Icon name="chevron_right" size={16} style={{ color: C.onSurfaceVariant, marginLeft: "auto" }} />
            </button>
          ))}
        </div>
      </div>

      {/* Support */}
      <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.onSurface }}>Support</h3>
        </div>
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {SUPPORT_LINKS.map((item) => (
            <button key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderRadius: 8, cursor: "pointer", color: C.onSurface, fontSize: 13, fontFamily: SANS, textAlign: "left", transition: "background 0.12s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainerLow}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <Icon name={item.icon} size={18} style={{ color: C.onSurfaceVariant }} />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.onSurface, color: C.white, padding: "10px 22px", borderRadius: 99, fontSize: 13, fontFamily: SANS, fontWeight: 600, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentNotifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  const [search,             setSearch]             = useState("");
  const [tab,                setTab]                = useState("All");
  const [drawerOpen,         setDrawerOpen]         = useState(false);
  const [showRating,         setShowRating]         = useState(false);
  const [showSettings,       setShowSettings]       = useState(false);
  const [ratingTarget,       setRatingTarget]       = useState(null);
  const [toast,              setToast]              = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [toggling,           setToggling]           = useState(false);

  const [notifications,      setNotifications]      = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const firstName = profile?.full_name?.split(" ")[0] || "Student";

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  // ── Fetch notifications + preferences ────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch notification preference from profiles
      const { data: prof } = await supabase
        .from("profiles")
        .select("notifications_enabled")
        .eq("id", user.id)
        .single();

      // Default to true if null (never explicitly set)
      setNotificationsEnabled(prof?.notifications_enabled ?? true);

      // Fetch notifications for this user
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Notifications fetch error:", error.message);
        showToast("Failed to load notifications.");
        return;
      }

      setNotifications((notifs ?? []).map((n) => ({
        id: n.id,
        type: n.type || "Update",
        title: n.title,
        body: n.body,
        read: n.read ?? false,
        time: formatRelativeTime(n.created_at),
        // Derive action from type — "Completed" gets a rate button
        action: n.type === "Completed"
          ? { type: "rate", label: "Rate Technician" }
          : n.type === "Assigned"
          ? { type: "link", label: "View Request", href: "/student/my-requests" }
          : null,
      })));
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Toggle notifications on/off ───────────────────────────────────────────
  async function handleToggle() {
    if (!user) return;
    setToggling(true);
    try {
      const newValue = !notificationsEnabled;
      const { error } = await supabase
        .from("profiles")
        .update({ notifications_enabled: newValue })
        .eq("id", user.id);

      if (error) throw error;
      setNotificationsEnabled(newValue);
      showToast(newValue ? "Notifications enabled." : "Notifications paused.");
    } catch (err) {
      console.error("Toggle error:", err);
      showToast("Failed to update notification settings.");
    } finally {
      setToggling(false);
    }
  }

  // ── Mark single read ──────────────────────────────────────────────────────
  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (error) console.error("Mark read error:", error.message);
  }

  // ── Mark all read ─────────────────────────────────────────────────────────
  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast("All notifications marked as read.");
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);
    if (error) console.error("Mark all read error:", error.message);
  }

  // ── Dismiss single ────────────────────────────────────────────────────────
  async function dismiss(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    showToast("Notification dismissed.");
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) console.error("Dismiss error:", error.message);
  }

  // ── Dismiss all ───────────────────────────────────────────────────────────
  async function dismissAll() {
    setNotifications([]);
    showToast("All notifications cleared.");
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);
    if (error) console.error("Dismiss all error:", error.message);
  }

  // ── Handle action buttons ─────────────────────────────────────────────────
  function handleAction(notif) {
    if (notif.action?.type === "rate") {
      setRatingTarget(notif);
      setShowRating(true);
    } else if (notif.action?.href) {
      navigate(notif.action.href);
    }
  }

  // ── Rating submit ─────────────────────────────────────────────────────────
  function handleRatingSubmit(rating, comment) {
    setShowRating(false);
    setRatingTarget(null);
    showToast(`Thank you! You rated the service ${rating} star${rating !== 1 ? "s" : ""}.`);
    if (ratingTarget) {
      setNotifications((prev) => prev.map((n) => n.id === ratingTarget.id ? { ...n, action: null, read: true } : n));
    }
  }

  const go = useCallback((path) => navigate(path), [navigate]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return notifications.filter((n) => {
      const tabOk = tab === "All" ? true : tab === "Unread" ? !n.read : n.type === tab;
      const searchOk = !q || [n.title, n.body, n.type].some((f) => f?.toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [notifications, tab, search]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box}`}</style>

      {!isMobile && <Sidebar currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} firstName={firstName} unreadCount={unreadCount} />}
      {isMobile && (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} firstName={firstName} unreadCount={unreadCount} />
      )}

      <div style={{ marginLeft: isMobile ? 0 : 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar search={search} setSearch={setSearch} onMenu={() => setDrawerOpen(true)} isMobile={isMobile} onNavigate={go} onSettings={() => setShowSettings(true)} />

        <main style={{ flex: 1, padding: isMobile ? "20px 14px 80px" : "32px", maxWidth: 1600, width: "100%", alignSelf: "center" }}>

          {/* Page Header */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", marginBottom: isMobile ? 20 : 28, gap: 12 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>Notifications</h1>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>
                Stay updated on your facility requests and campus announcements.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
              {/* Mobile settings button */}
              {isMobile && (
                <button onClick={() => setShowSettings(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: C.white, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>
                  <Icon name="settings" size={16} />
                  Settings
                </button>
              )}
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: C.white, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>
                      <Icon name="done_all" size={16} />
                      Mark all read
                      <span style={{ background: C.primaryContainer, color: C.white, borderRadius: 99, fontSize: 9, fontWeight: 700, padding: "1px 6px", fontFamily: MONO }}>{unreadCount}</span>
                    </button>
                  )}
                  <button onClick={dismissAll} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: C.white, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurfaceVariant }}>
                    <Icon name="clear_all" size={16} />
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications disabled banner */}
          {!notificationsEnabled && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#FEF3C7", border: "1px solid #f59e0b44", borderRadius: 10, marginBottom: 20 }}>
              <Icon name="notifications_off" size={20} style={{ color: "#92400E", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13, color: "#92400E", flex: 1 }}>
                Notifications are paused. You won't receive new updates about your requests.
              </p>
              <button onClick={() => setShowSettings(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", fontSize: 12, fontFamily: MONO, fontWeight: 700, whiteSpace: "nowrap" }}>
                Re-enable →
              </button>
            </div>
          )}

          {/* Main grid */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 300px", gap: isMobile ? 20 : 28, alignItems: "start" }}>

            {/* Left: notification feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {FILTER_TABS.map((t) => {
                  const isActive = tab === t;
                  const count = t === "Unread" ? unreadCount : t === "All" ? notifications.length : notifications.filter((n) => n.type === t).length;
                  return (
                    <button key={t} onClick={() => setTab(t)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, fontFamily: MONO, border: "none", cursor: "pointer", transition: "all 0.15s", background: isActive ? C.primaryContainer : C.surfaceContainerHigh, color: isActive ? C.white : C.onSurfaceVariant }}>
                      {t}
                      {count > 0 && (
                        <span style={{ background: isActive ? "rgba(255,255,255,0.22)" : C.outlineVariant, color: isActive ? C.white : C.onSurface, borderRadius: 99, fontSize: 9, padding: "1px 5px", fontWeight: 700 }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Notification list */}
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1, 2, 3].map((i) => <div key={i} style={{ height: 120, background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "56px 24px", textAlign: "center", background: C.white, borderRadius: 14, border: `1px solid ${C.outlineVariant}` }}>
                  <Icon name="notifications_off" size={44} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                    {notifications.length === 0 ? "No notifications yet" : "No notifications match your filters"}
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>
                    {notifications.length === 0
                      ? "Notifications about your requests and campus updates will appear here."
                      : "Try clearing your search or switching tabs."}
                  </p>
                  {(search || tab !== "All") && (
                    <button onClick={() => { setTab("All"); setSearch(""); }} style={{ marginTop: 12, padding: "7px 18px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filtered.map((notif) => (
                    <NotifCard key={notif.id} notif={notif} onMarkRead={markRead} onDismiss={dismiss} onAction={handleAction} />
                  ))}
                </div>
              )}
            </div>

            {/* Right: stats sidebar (desktop) */}
            {!isMobile && (
              <div style={{ position: "sticky", top: 80 }}>
                <StatsSidebar notifications={notifications} onNavigate={go} notificationsEnabled={notificationsEnabled} onSettings={() => setShowSettings(true)} />
              </div>
            )}
          </div>

          {/* Mobile stats below list */}
          {isMobile && notifications.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <StatsSidebar notifications={notifications} onNavigate={go} notificationsEnabled={notificationsEnabled} onSettings={() => setShowSettings(true)} />
            </div>
          )}
        </main>
      </div>

      {isMobile && <MobileBottomNav currentPath={location.pathname} onNavigate={go} unreadCount={unreadCount} />}

      {showSettings && (
        <SettingsModal notificationsEnabled={notificationsEnabled} onToggle={handleToggle} toggling={toggling} onClose={() => setShowSettings(false)} />
      )}

      {showRating && <RatingModal onClose={() => { setShowRating(false); setRatingTarget(null); }} onSubmit={handleRatingSubmit} />}

      <Toast msg={toast} />
    </div>
  );
}