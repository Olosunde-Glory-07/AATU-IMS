import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  primaryFixedDim:        "#ffb4aa",
  secondary:              "#396844",
  secondaryContainer:     "#b8ecbe",
  onSecondaryContainer:   "#3e6d47",
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

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/student/dashboard"     },
  { icon: "list_alt",      label: "My Requests",   path: "/student/my-requests"   },
  { icon: "history",       label: "My History",    path: "/student/my-history"    },
  { icon: "notifications", label: "Notifications", path: "/student/notifications" },
];

// ─── Status / priority config ─────────────────────────────────────────────────
const STATUS_CFG = {
  Completed:    { bg: "#DCFCE7",           text: "#166534",                dot: C.secondary               },
  "In Progress":{ bg: "#EEF2FF",           text: "#4338ca",                dot: "#6366f1"                 },
  Pending:      { bg: "#FEF3C7",           text: "#b45309",                dot: "#f59e0b"                 },
  Assigned:     { bg: "#EEF2FF",           text: "#4338ca",                dot: "#6366f1"                 },
};

const PRIORITY_CFG = {
  High:   { bg: C.errorContainer, text: C.onErrorContainer },
  Medium: { bg: "#FEF3C7",        text: "#92400E"          },
  Low:    { bg: "#DCFCE7",        text: "#166534"          },
};

const CATEGORY_ICONS = {
  Electrical:   "bolt",
  Structural:   "domain",
  Plumbing:     "water_drop",
  "IT Services":"router",
  HVAC:         "hvac",
  Furniture:    "chair",
  Other:        "build",
};

const EMPTY_FORM = { title: "", location: "", category: "Electrical", priority: "Medium", description: "" };

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

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

// ─── Icon helper ──────────────────────────────────────────────────────────────
function Icon({ name, size = 22, filled = false, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size, lineHeight: 1, verticalAlign: "middle",
      fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400",
      ...style,
    }}>{name}</span>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ currentPath, onNavigate, onLogout, firstName }) {
  return (
    <aside style={{
      width: 260, background: C.primaryContainer, color: C.white,
      display: "flex", flexDirection: "column", height: "100vh",
      position: "fixed", left: 0, top: 0, zIndex: 50, overflowY: "auto",
      fontFamily: SANS,
    }}>
      {/* Brand */}
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

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          return (
            <button key={item.label} onClick={() => onNavigate(item.path)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "11px 16px",
              background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
              color: isActive ? C.white : "rgba(255,255,255,0.70)",
              fontWeight: isActive ? 700 : 400,
              borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent",
              border: "none", cursor: "pointer", textAlign: "left",
              fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
              transition: "background 0.15s",
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

      {/* User + Logout */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryFixedDim, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.primary, fontSize: 13 }}>
            {firstName[0]}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.white }}>{firstName}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em" }}>Student</p>
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
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
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
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
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
            fontFamily: MONO, fontSize: 9, letterSpacing: "0.04em", fontWeight: isActive ? 700 : 400,
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
function TopBar({ search, setSearch, onNew, onMenu, isMobile, onNotifications }) {
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

      {/* Search */}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 380, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests, facilities…" style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 99, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {!isMobile && (
          <button onClick={onNotifications} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="notifications" size={22} />
            <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, background: C.error, borderRadius: "50%" }} />
          </button>
        )}
        <button onClick={onNew} style={{
          background: C.primaryContainer, color: C.white, border: "none", cursor: "pointer",
          padding: isMobile ? "7px 12px" : "8px 18px", borderRadius: 99,
          fontSize: isMobile ? 11 : 12, fontWeight: 700, fontFamily: MONO,
          display: "flex", alignItems: "center", gap: 5,
          boxShadow: "0 1px 4px rgba(33,0,0,0.20)", transition: "opacity 0.15s",
        }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.90"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <Icon name="add_circle" size={16} style={{ color: C.white }} />
          {isMobile ? "Report" : "Report Issue"}
        </button>
      </div>
    </header>
  );
}

// ─── Submit Request Modal ─────────────────────────────────────────────────────
function SubmitModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.title.trim() || !form.location.trim()) {
      setError("Issue title and location are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      // TODO: await supabase.from('requests').insert({ ...form, status: 'Pending', created_by: user.id });
      await new Promise((r) => setTimeout(r, 600));
      onSubmit(form);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inp = { width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: C.white, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(520px, 95vw)", background: C.white, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Submit a Facility Request</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>Report a maintenance or facility issue on campus</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "58vh", overflowY: "auto" }}>
          {error && <div style={{ padding: "9px 12px", background: C.errorContainer, color: C.onErrorContainer, borderRadius: 8, fontSize: 13 }}>{error}</div>}
          <div>
            <label style={lbl}>Issue Title *</label>
            <input value={form.title} onChange={set("title")} placeholder="e.g. Broken ceiling fan in lecture hall" style={inp} />
          </div>
          <div>
            <label style={lbl}>Location *</label>
            <input value={form.location} onChange={set("location")} placeholder="e.g. Faculty of Science, Room 204" style={inp} />
          </div>
          <div>
            <label style={lbl}>Department</label>
            <input value={form.department} onChange={set("department")} placeholder="e.g. Faculty of Engineering" style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>Category</label>
              <select value={form.category} onChange={set("category")} style={{ ...inp, cursor: "pointer" }}>
                {Object.keys(CATEGORY_ICONS).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Priority</label>
              <select value={form.priority} onChange={set("priority")} style={{ ...inp, cursor: "pointer" }}>
                {["Emergency", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea value={form.description} onChange={set("description")} placeholder="Describe the issue in detail so the team can respond quickly…" rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          {/* Info note */}
          <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
            <Icon name="info" size={16} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
              A technician will be assigned by the administrator. You'll receive a notification once your request is reviewed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: "9px 22px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, opacity: submitting ? 0.7 : 1 }}>
            <Icon name="send" size={14} style={{ color: C.white }} />
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Request Detail Drawer ────────────────────────────────────────────────────
function RequestDrawer({ req, onClose, onCancel }) {
  if (!req) return null;
  const sc = STATUS_CFG[req.status] || STATUS_CFG.Pending;
  const pc = PRIORITY_CFG[req.priority] || PRIORITY_CFG.Medium;
  const canCancel = req.status === "Pending";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(420px, 100vw)", background: C.white, zIndex: 101, boxShadow: "-6px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 9px", borderRadius: 4, background: sc.bg, color: sc.text, fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{req.status}</span>
                <span style={{ padding: "2px 9px", borderRadius: 4, background: pc.bg, color: pc.text, fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{req.priority}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={CATEGORY_ICONS[req.category] || "build"} size={22} style={{ color: C.primaryContainer }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>{req.id}</p>
                  <h3 style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{req.title}</h3>
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
          {/* Info fields */}
          {[
            ["Category", req.category, "category"],
            ["Location", req.location, "location_on"],
            ["Date Filed", req.date, "calendar_today"],
          ].map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: C.surfaceContainerLow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={icon} size={17} style={{ color: C.onSurfaceVariant }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500, color: C.onSurface }}>{value || "—"}</p>
              </div>
            </div>
          ))}

          {/* Progress Timeline */}
          {req.timeline && req.timeline.length > 0 && (
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Progress</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {req.timeline.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, position: "relative", paddingBottom: i < req.timeline.length - 1 ? 20 : 0 }}>
                    {i < req.timeline.length - 1 && (
                      <div style={{ position: "absolute", left: 11, top: 24, bottom: 0, width: 2, background: step.done ? C.secondary : C.outlineVariant }} />
                    )}
                    <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: step.done ? C.secondary : C.surfaceContainerHigh, border: `2px solid ${step.done ? C.secondary : C.outlineVariant}` }}>
                      {step.done && <Icon name="check" size={13} style={{ color: C.white }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: step.done ? C.onSurface : C.onSurfaceVariant }}>{step.label}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.4 }}>{step.desc}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, fontFamily: MONO, color: C.outline }}>{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin note */}
          <div style={{ background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
            <Icon name="info" size={18} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
              Technician assignment is managed by the admin team. You'll be notified of any updates.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: C.surfaceContainerHigh, color: C.onSurface, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}>
            Close
          </button>
          {canCancel && (
            <button onClick={() => { onCancel(req.id); onClose(); }} style={{ flex: 1, padding: "10px 0", background: C.errorContainer, color: C.onErrorContainer, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="cancel" size={15} style={{ color: C.onErrorContainer }} />
              Cancel Request
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
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: C.onSurface, color: C.white, padding: "10px 20px", borderRadius: 99, fontSize: 13, fontFamily: SANS, fontWeight: 600, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {msg}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, label, badge, value, loading }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 14, transition: "box-shadow 0.2s" }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.07)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={22} style={{ color: iconColor }} />
        </div>
        {badge && <span style={{ fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, opacity: 0.8 }}>{badge}</span>}
      </div>
      {loading
        ? <div style={{ width: 56, height: 28, background: C.surfaceContainerHigh, borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
        : <h3 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: C.onSurface }}>{value ?? 0}</h3>}
      <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();

  const [search,      setSearch]      = useState("");
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [toast,       setToast]       = useState(null);
  const [loading,     setLoading]     = useState(true);

  // ── Data (empty until Supabase is wired) ─────────────────────────────────
  const [requests,    setRequests]    = useState([]);
  const [firstName,   setFirstName]   = useState("Student");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
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
        //   .select('id, title, location, category, priority, status, created_at')
        //   .eq('created_by', user.id)
        //   .order('created_at', { ascending: false })
        //   .limit(10);
        // setRequests(reqs?.map(r => ({
        //   ...r,
        //   date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        //   timeline: [],   // populate from request_events table if available
        // })) ?? []);

        // ── Placeholder ───────────────────────────────────────────────────
        setFirstName("Student");
        setRequests([]);
      } catch (err) {
        console.error("Student dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  function handleSubmit(form) {
    const newReq = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      title: `${form.title} — ${form.location}`,
      location: form.location,
      category: form.category,
      priority: form.priority,
      status: "Pending",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timeline: [
        { label: "Submission",        desc: "Request submitted. Awaiting admin review.", time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), done: true },
        { label: "Work Assigned",     desc: "Not yet assigned.",                         time: "—", done: false },
        { label: "Work In Progress",  desc: "Work not yet started.",                     time: "—", done: false },
        { label: "Completed",         desc: "Pending resolution.",                       time: "—", done: false, final: true },
      ],
    };
    setRequests((prev) => [newReq, ...prev]);
    showToast("Request submitted successfully.");
  }

  function handleCancel(id) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    showToast("Request cancelled.");
  }

  const go = useCallback((path) => navigate(path), [navigate]);

  // ── Computed stats ────────────────────────────────────────────────────────
  const total      = requests.length;
  const pending    = requests.filter((r) => r.status === "Pending").length;
  const inProgress = requests.filter((r) => r.status === "In Progress").length;
  const completed  = requests.filter((r) => r.status === "Completed").length;

  // ── Filtered list for Recent section ─────────────────────────────────────
  const filtered = search
    ? requests.filter((r) => [r.id, r.title, r.location, r.category, r.status]
        .some((f) => f?.toLowerCase().includes(search.toLowerCase())))
    : requests.slice(0, 5);

  // ── Active request for progress tracker (most recent non-completed) ───────
  const activeReq = requests.find((r) => r.status !== "Completed") ?? requests[0] ?? null;

  const STAT_CARDS = [
    { icon: "list_alt",     iconBg: C.surfaceContainer,    iconColor: C.primaryContainer, badge: "Cumulative",      label: "My Requests", value: total      },
    { icon: "pending",      iconBg: "#ffdcc3",             iconColor: C.onTertiaryFixed,  badge: "Awaiting Approval",label: "Pending",     value: pending    },
    { icon: "engineering",  iconBg: C.secondaryContainer,  iconColor: C.secondary,        badge: "Active Work",     label: "In Progress", value: inProgress  },
    { icon: "check_circle", iconBg: "#DCFCE7",             iconColor: "#166534",          badge: "Resolved",        label: "Completed",   value: completed   },
  ];

  const now = new Date();
  const timeStr = `Today, ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box}`}</style>

      {!isMobile && <Sidebar currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} firstName={firstName} />}

      {isMobile && (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
          currentPath={location.pathname} onNavigate={go}
          onLogout={() => navigate("/login")} firstName={firstName} />
      )}

      <div style={{ marginLeft: isMobile ? 0 : 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar
          search={search} setSearch={setSearch}
          onNew={() => setShowNew(true)}
          onMenu={() => setDrawerOpen(true)}
          isMobile={isMobile}
          onNotifications={() => go("/student/notifications")}
        />

        <main style={{ flex: 1, padding: isMobile ? "20px 14px 80px" : "32px", maxWidth: 1600, width: "100%", alignSelf: "center" }}>

          {/* ── Welcome ───────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", marginBottom: isMobile ? 20 : 28, gap: 12 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: "0 0 4px" }}>{getGreeting()}, {firstName}</h2>
              <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Here is the latest status of your facility maintenance requests.</p>
            </div>
            {!isMobile && (
              <div style={{ background: C.surfaceContainerHighest, borderRadius: 8, padding: "8px 16px", border: `1px solid ${C.outlineVariant}`, fontSize: 12, fontFamily: MONO, color: C.onSurfaceVariant, flexShrink: 0 }}>
                Last Update: <span style={{ color: C.onSurface, fontWeight: 700 }}>{timeStr}</span>
              </div>
            )}
          </div>

          {/* ── Stat Cards ────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 12 : 20, marginBottom: isMobile ? 20 : 32 }}>
            {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
          </div>

          {/* ── Main Bento Grid ───────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? 20 : 28 }}>

            {/* ── Left: My Requests ─────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>My Recent Requests</h3>
                  <button onClick={() => go("/student/my-requests")} style={{ background: "none", border: "none", cursor: "pointer", color: C.primaryContainer, fontWeight: 700, fontSize: 12, fontFamily: MONO }}>
                    View All →
                  </button>
                </div>

                {/* List */}
                {loading ? (
                  <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                    {[1,2,3].map((i) => <div key={i} style={{ height: 72, background: C.surfaceContainerLow, borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <Icon name="inbox" size={44} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>No requests yet</p>
                    <p style={{ margin: "6px 0 16px", fontSize: 13, color: C.onSurfaceVariant }}>Report a facility issue to get started.</p>
                    <button onClick={() => setShowNew(true)} style={{ padding: "9px 22px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 99, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
                      Report an Issue
                    </button>
                  </div>
                ) : (
                  <div>
                    {filtered.map((req, i) => {
                      const sc = STATUS_CFG[req.status] || STATUS_CFG.Pending;
                      const pc = PRIORITY_CFG[req.priority] || PRIORITY_CFG.Medium;
                      return (
                        <div key={req.id} onClick={() => setSelected(req)} style={{
                          padding: "16px 24px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.outlineVariant}` : "none",
                          display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
                          transition: "background 0.12s",
                        }}
                          onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainerLow}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          {/* Icon */}
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon name={CATEGORY_ICONS[req.category] || "build"} size={22} style={{ color: C.primaryContainer }} />
                          </div>
                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>{req.id}</span>
                              <span style={{ fontSize: 11, color: C.outline }}>·</span>
                              <span style={{ fontSize: 11, color: C.onSurfaceVariant }}>{req.date}</span>
                            </div>
                          </div>
                          {/* Badges */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                            <span style={{ padding: "2px 9px", borderRadius: 4, background: sc.bg, color: sc.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, whiteSpace: "nowrap" }}>{req.status}</span>
                            <span style={{ padding: "2px 9px", borderRadius: 4, background: pc.bg, color: pc.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, whiteSpace: "nowrap" }}>{req.priority}</span>
                          </div>
                          <Icon name="chevron_right" size={18} style={{ color: C.onSurfaceVariant, flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit CTA Banner */}
              <div style={{ borderRadius: 14, overflow: "hidden", position: "relative", background: `linear-gradient(135deg, ${C.primaryContainer} 0%, #7e2b23 100%)`, padding: "28px 32px", color: C.white }}>
                {[140, 200, 260].map((s, i) => (
                  <div key={i} style={{ position: "absolute", right: -60 + i * 20, top: "50%", transform: "translateY(-50%)", width: s, height: s, borderRadius: "50%", border: "1px solid rgba(255,180,170,0.14)", pointerEvents: "none" }} />
                ))}
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: isMobile ? 17 : 20, fontWeight: 700 }}>Need to report a campus issue?</h3>
                  <p style={{ margin: "0 0 18px", fontSize: isMobile ? 13 : 14, opacity: 0.85, lineHeight: 1.6, maxWidth: 480 }}>Facility issues are resolved faster when submitted promptly. Use the form to report electrical, plumbing, structural, or IT problems.</p>
                  <button onClick={() => setShowNew(true)} style={{ padding: "10px 24px", background: C.white, color: C.primaryContainer, border: "none", borderRadius: 99, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: SANS, transition: "opacity 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.90"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                  >
                    Submit a Request →
                  </button>
                </div>
              </div>
            </div>

            {/* ── Right: Progress Tracker ────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 24 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: C.onSurface }}>Request Progress</h3>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: C.onSurfaceVariant }}>Live status of your latest active request</p>

                {loading ? (
                  <div style={{ height: 200, background: C.surfaceContainerLow, borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
                ) : !activeReq ? (
                  <div style={{ padding: "32px 0", textAlign: "center", color: C.onSurfaceVariant }}>
                    <Icon name="pending_actions" size={36} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 10px" }} />
                    <p style={{ margin: 0, fontSize: 13 }}>No active requests to track</p>
                  </div>
                ) : (
                  <div>
                    {/* Active request pill */}
                    <div style={{ background: C.surfaceContainerLow, borderRadius: 10, padding: "12px 14px", marginBottom: 20, border: `1px solid ${C.outlineVariant}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name={CATEGORY_ICONS[activeReq.category] || "build"} size={19} style={{ color: C.primaryContainer }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant }}>{activeReq.id}</p>
                          <p style={{ margin: "1px 0 0", fontSize: 13, fontWeight: 700, color: C.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeReq.title}</p>
                        </div>
                        <span style={{ padding: "2px 9px", borderRadius: 4, background: (STATUS_CFG[activeReq.status] || STATUS_CFG.Pending).bg, color: (STATUS_CFG[activeReq.status] || STATUS_CFG.Pending).text, fontSize: 9, fontWeight: 700, fontFamily: MONO, flexShrink: 0 }}>{activeReq.status}</span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {activeReq.timeline && activeReq.timeline.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {activeReq.timeline.map((step, i) => (
                          <div key={i} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: i < activeReq.timeline.length - 1 ? 18 : 0 }}>
                            {i < activeReq.timeline.length - 1 && (
                              <div style={{ position: "absolute", left: 10, top: 22, bottom: 0, width: 2, background: step.done ? C.secondary : C.outlineVariant }} />
                            )}
                            <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: step.done ? C.secondary : C.surfaceContainerHigh, border: `2px solid ${step.done ? C.secondary : C.outlineVariant}` }}>
                              {step.done && <Icon name="check" size={12} style={{ color: C.white }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: step.done ? C.onSurface : C.onSurfaceVariant }}>{step.label}</p>
                              <p style={{ margin: "1px 0 0", fontSize: 11, color: C.onSurfaceVariant, lineHeight: 1.4 }}>{step.desc}</p>
                              <p style={{ margin: "1px 0 0", fontSize: 9, fontFamily: MONO, color: C.outline }}>{step.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: C.onSurfaceVariant, textAlign: "center", padding: "16px 0" }}>Timeline updates will appear here.</p>
                    )}

                    {/* View all */}
                    <button onClick={() => setSelected(activeReq)} style={{ width: "100%", marginTop: 16, padding: "9px 0", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>
                      View Details
                    </button>
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, padding: 20 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: C.onSurface }}>Quick Actions</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { icon: "add_circle",    label: "Submit a New Request",   action: () => setShowNew(true)                     },
                    { icon: "list_alt",      label: "View All My Requests",   action: () => go("/student/my-requests")            },
                    { icon: "history",       label: "View Request History",   action: () => go("/student/my-history")             },
                    { icon: "notifications", label: "Check Notifications",    action: () => go("/student/notifications")          },
                  ].map((a) => (
                    <button key={a.label} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", color: C.onSurface, fontSize: 13, fontFamily: SANS, textAlign: "left", transition: "background 0.12s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = C.surfaceContainerHigh}
                      onMouseLeave={(e) => e.currentTarget.style.background = C.surfaceContainerLow}
                    >
                      <Icon name={a.icon} size={18} style={{ color: C.primaryContainer }} />
                      {a.label}
                      <Icon name="chevron_right" size={16} style={{ color: C.onSurfaceVariant, marginLeft: "auto" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {isMobile && <MobileBottomNav currentPath={location.pathname} onNavigate={go} />}

      {showNew && <SubmitModal onClose={() => setShowNew(false)} onSubmit={handleSubmit} />}
      {selected && <RequestDrawer req={selected} onClose={() => setSelected(null)} onCancel={handleCancel} />}
      <Toast msg={toast} />
    </div>
  );
}