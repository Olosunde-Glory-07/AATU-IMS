import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { generateJobOrderPdf, uploadJobOrderPdf } from "../../lib/JobOrderPdf.js";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "#210000",
  primaryContainer:       "#4a0404",
  onPrimaryContainer:     "#d26a5f",
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
  Medium:    { bg: "#EEF2FF", text: "#3730A3" },
  Low:       { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant },
};

const STATUS_CFG = {
  Assigned:   { color: C.onSurface,  bg: "#EEF2FF",            label: "Assigned"   },
  Completed:  { color: C.secondary,  bg: C.secondaryContainer, label: "Completed"  },
  Unassigned: { color: C.error,      bg: C.errorContainer,     label: "Unassigned" },
  Pending:    { color: "#92400E",    bg: "#FEF3C7",            label: "Pending"    },
};

const CATEGORY_ICONS = {
  Electrical: "bolt", Plumbing: "water_drop", HVAC: "hvac", Structural: "domain",
  "IT Services": "router", Furniture: "chair", Lighting: "light_mode",
  Elevator: "elevator", Other: "build",
};

const TABS = ["All", "Unassigned", "Assigned", "Pending", "Completed", "Emergency"];
const PER_PAGE = 6;

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

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Low;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 4, background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, fontFamily: MONO, whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

function Sidebar({ currentPath, onNavigate, onLogout }) {
  return (
    <aside style={{ width: 260, background: C.primaryContainer, color: C.white, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, overflowY: "auto", fontFamily: SANS }}>
      <div style={{ padding: "24px 24px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="account_balance" size={20} filled style={{ color: C.white }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>Infrastructure Mgmt</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "8px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath.startsWith(item.path);
          return (
            <button key={item.label} onClick={() => onNavigate(item.path)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO, transition: "background 0.15s" }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.65)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="account_circle" size={20} style={{ color: "rgba(255,255,255,0.65)" }} />
          User Profile
        </button>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.40)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="logout" size={20} style={{ color: "rgba(255,255,255,0.40)" }} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function MobileDrawer({ open, onClose, currentPath, onNavigate, onLogout }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 70 }} />
      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, background: C.primaryContainer, zIndex: 71, display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.7)", display: "flex" }}>
            <Icon name="close" size={20} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
        </div>
        <nav style={{ flex: 1, padding: "4px 8px 0", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath.startsWith(item.path);
            return (
              <button key={item.label} onClick={() => { onNavigate(item.path); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO }}>
                <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.white : "rgba(255,255,255,0.70)" }} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
            <Icon name="logout" size={20} style={{ color: "rgba(255,255,255,0.5)" }} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function MobileBottomNav({ currentPath, onNavigate }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: C.white, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 62 }}>
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const isActive = currentPath.startsWith(item.path);
        return (
          <button key={item.label} onClick={() => onNavigate(item.path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: isActive ? C.primaryContainer : C.onSurfaceVariant, fontFamily: MONO, fontSize: 9, fontWeight: isActive ? 700 : 400, borderTop: isActive ? `2px solid ${C.primaryContainer}` : "2px solid transparent" }}>
            <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ search, setSearch, onMenu, isMobile }) {
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 20px", position: "sticky", top: 0, zIndex: 40, background: "rgba(249,249,255,0.94)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 10 }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurface, display: "flex", flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 420, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests, location, reporter…" style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 8, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }} />
      </div>
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="notifications" size={22} />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.onSurface, fontSize: 14 }}>A</div>
        </div>
      )}
    </header>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, loading }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={19} style={{ color: iconColor }} />
        </div>
        <span style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.06em", opacity: 0.7 }}>{label.toUpperCase()}</span>
      </div>
      {loading
        ? <div style={{ width: 50, height: 26, background: C.surfaceContainerHigh, borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
        : <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: C.onSurface, fontFamily: SANS }}>{value}</p>}
    </div>
  );
}

function RequestCard({ req, onOpen }) {
  const [hov, setHov] = useState(false);
  const leftAccent = req.status === "Unassigned" ? C.error : req.priority === "Emergency" ? C.error : req.status === "Completed" ? C.secondary : C.surfaceContainerHigh;

  return (
    <div onClick={() => onOpen(req)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: C.white, border: `1px solid ${C.outlineVariant}`, borderLeft: `4px solid ${leftAccent}`,
      borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16,
      cursor: "pointer", boxShadow: hov ? "0 4px 14px rgba(0,0,0,0.07)" : "none", transition: "box-shadow 0.18s",
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={CATEGORY_ICONS[req.category] || "build"} size={22} style={{ color: C.primary }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.primary }}>{req.title}</h3>
          <PriorityBadge priority={req.priority} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
          #{req.id} · {req.reporterName} ({req.reporterRole}) · {req.location}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
        <StatusBadge status={req.status} />
        {req.technicianName ? (
          <span style={{ fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO }}>{req.technicianName}</span>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); onOpen(req, true); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: C.primaryContainer, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>
            <Icon name="person_add" size={14} style={{ color: C.primaryContainer }} />
            Assign
          </button>
        )}
      </div>
    </div>
  );
}

function AssignTechnicianModal({ req, technicians, onClose, onAssign, loadingTechs }) {
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState("select");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    setStep("generating");
    setErrorMsg("");
    try {
      await onAssign(req, selectedId, note);
      setStep("done");
      setTimeout(onClose, 1000);
    } catch (err) {
      console.error(err);
      setStep("error");
      setErrorMsg(err.message || "Something went wrong while assigning.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div onClick={!submitting ? onClose : undefined} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(560px,95vw)", maxHeight: "85vh", background: C.white, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.20)", zIndex: 201, fontFamily: SANS, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Assign Technician</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>{req.title} · #{req.id}</p>
          </div>
          {!submitting && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
              <Icon name="close" size={20} />
            </button>
          )}
        </div>

        {step === "generating" && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 48, height: 48, border: `3px solid ${C.surfaceContainerHigh}`, borderTopColor: C.primaryContainer, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.onSurface }}>Assigning technician…</p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: C.onSurfaceVariant }}>Generating job order PDF and notifying technician.</p>
          </div>
        )}

        {step === "done" && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Icon name="check_circle" filled size={48} style={{ color: C.secondary, display: "block", margin: "0 auto 14px" }} />
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.onSurface }}>Job order created</p>
          </div>
        )}

        {(step === "select" || step === "error") && (
          <>
            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
              {step === "error" && (
                <div style={{ padding: "10px 14px", background: C.errorContainer, color: C.onErrorContainer, borderRadius: 8, fontSize: 13, marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Icon name="error" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  {errorMsg}
                </div>
              )}
              <p style={{ margin: "0 0 12px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Available Technicians
              </p>
              {loadingTechs ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1, 2, 3].map((i) => <div key={i} style={{ height: 64, background: C.surfaceContainerLow, borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                </div>
              ) : technicians.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: C.onSurfaceVariant }}>
                  <Icon name="engineering" size={36} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 10px" }} />
                  <p style={{ margin: 0, fontSize: 14 }}>No registered technicians found.</p>
                  <p style={{ margin: "4px 0 0", fontSize: 12 }}>Invite technicians from the Users page first.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {technicians.map((tech) => {
                    const isSelected = selectedId === tech.id;
                    const loadColor = tech.activeJobs === 0 ? C.secondary : tech.activeJobs <= 2 ? "#b45309" : C.error;
                    const loadLabel = tech.activeJobs === 0 ? "Available" : tech.activeJobs <= 2 ? "Moderate load" : "High load";
                    return (
                      <button key={tech.id} onClick={() => setSelectedId(tech.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", border: `2px solid ${isSelected ? C.primaryContainer : C.outlineVariant}`, background: isSelected ? `${C.primaryContainer}08` : C.white, borderRadius: 10, cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 700, color: C.onSurfaceVariant, fontSize: 14 }}>
                          {tech.name?.[0] ?? "T"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: C.onSurface }}>{tech.name}</p>
                          <p style={{ margin: "1px 0 0", fontSize: 12, color: C.onSurfaceVariant }}>{tech.specialty || "General Maintenance"}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: MONO, color: loadColor }}>{loadLabel}</p>
                          <p style={{ margin: "1px 0 0", fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO }}>{tech.activeJobs} active job{tech.activeJobs !== 1 ? "s" : ""}</p>
                        </div>
                        {isSelected && <Icon name="check_circle" filled size={20} style={{ color: C.primaryContainer, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}
              {technicians.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
                    Note for Technician (optional)
                  </label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any special instructions…" rows={2} style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, fontSize: 13, fontFamily: SANS, color: C.onSurface, background: C.surfaceContainerLow, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 16, padding: "10px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
                <Icon name="picture_as_pdf" size={16} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
                  A Job Order PDF will be generated automatically with your approval signature. The technician will get it for the Head of Department's physical sign-off.
                </p>
              </div>
            </div>
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
              <button onClick={onClose} style={{ padding: "9px 20px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
              <button onClick={handleConfirm} disabled={!selectedId || submitting} style={{ padding: "9px 22px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: (!selectedId || submitting) ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: (!selectedId || submitting) ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="task_alt" size={15} style={{ color: C.white }} />
                Confirm Assignment
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function DetailDrawer({ req, onClose, onAssignClick, onMarkComplete, onViewPdf }) {
  if (!req) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(440px,100vw)", background: C.white, zIndex: 101, boxShadow: "-6px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <StatusBadge status={req.status} />
                <PriorityBadge priority={req.priority} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={CATEGORY_ICONS[req.category] || "build"} size={22} style={{ color: C.primary }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>#{req.id}</p>
                  <h2 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{req.title}</h2>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex", flexShrink: 0 }}>
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            ["Reported By", `${req.reporterName} (${req.reporterRole})`, "person"],
            ["Location",    req.location,   "location_on"],
            ["Department",  req.department, "domain"],
            ["Category",    req.category,   "category"],
            ["Date Filed",  req.date,       "calendar_today"],
          ].map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surfaceContainerLow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={icon} size={16} style={{ color: C.onSurfaceVariant }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500, color: C.onSurface }}>{value}</p>
              </div>
            </div>
          ))}

          {req.description && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Description</p>
              <div style={{ padding: "12px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: C.onSurface, lineHeight: 1.6 }}>{req.description}</p>
              </div>
            </div>
          )}

          <div>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Assigned Technician</p>
            {req.technicianName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.onSurfaceVariant, fontSize: 14 }}>
                  {req.technicianName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.onSurface }}>{req.technicianName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO }}>Job Order #{req.jobOrderId}</p>
                </div>
                <button onClick={() => onAssignClick(req)} style={{ background: "none", border: "none", cursor: "pointer", color: C.primaryContainer, fontSize: 11, fontFamily: MONO, fontWeight: 700 }}>
                  Reassign
                </button>
              </div>
            ) : (
              <button onClick={() => onAssignClick(req)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, border: `1px dashed ${C.outlineVariant}`, background: "none", cursor: "pointer", color: C.onSurfaceVariant, fontSize: 13, width: "100%", justifyContent: "center" }}>
                <Icon name="person_add" size={16} />
                Assign a Technician
              </button>
            )}
          </div>

          {req.pdfUrl && (
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Job Order Document</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => onViewPdf(req)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.outlineVariant}`, background: C.white, cursor: "pointer", textAlign: "left" }}>
                  <Icon name="picture_as_pdf" size={20} style={{ color: C.error }} />
                  <span style={{ flex: 1, fontSize: 13, color: C.onSurface, fontWeight: 600 }}>View Job Order PDF</span>
                  <Icon name="open_in_new" size={16} style={{ color: C.onSurfaceVariant }} />
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: req.hodSignedAt ? "#DCFCE7" : "#FEF3C7" }}>
                  <Icon name={req.hodSignedAt ? "verified" : "pending"} size={16} style={{ color: req.hodSignedAt ? "#166534" : "#92400E" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: req.hodSignedAt ? "#166634" : "#92400E" }}>
                    {req.hodSignedAt ? "HOD approval received" : "Awaiting Head of Department's physical signature"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: C.surfaceContainerHigh, color: C.onSurface, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}>
            Close
          </button>
          {req.status === "Assigned" && (
            <button onClick={() => onMarkComplete(req)} style={{ flex: 1, padding: "10px 0", background: C.secondaryContainer, color: C.onSecondaryContainer, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="check_circle" size={15} style={{ color: C.onSecondaryContainer }} />
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Toast({ msg, type = "default" }) {
  if (!msg) return null;
  const bg = type === "error" ? C.error : C.onSurface;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: bg, color: C.white, padding: "10px 22px", borderRadius: 99, fontSize: 13, fontFamily: SANS, fontWeight: 600, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminRequests() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();
  const { profile } = useAuth();

  const [search,      setSearch]      = useState("");
  const [tab,         setTab]         = useState("All");
  const [page,        setPage]        = useState(1);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [assignTarget,setAssignTarget]= useState(null);
  const [toast,       setToast]       = useState(null);
  const [toastType,   setToastType]   = useState("default");
  const [loading,     setLoading]     = useState(true);
  const [loadingTechs,setLoadingTechs]= useState(false);

  const [requests,    setRequests]    = useState([]);
  const [technicians, setTechnicians] = useState([]);

  function showToast(msg, type = "default") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  }

  // ── FIXED: fetch without the broken job_orders join ───────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          id, title, description, category, priority, status,
          location, department, created_at,
          assigned_technician_id, job_order_id,
          reporter:profiles!requests_created_by_fkey ( full_name, role ),
          technician:profiles!requests_assigned_technician_id_fkey ( full_name )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error.message, error.details);
        showToast("Failed to load requests.", "error");
        return;
      }

      setRequests((data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        priority: r.priority,
        status: r.status,
        location: r.location,
        department: r.department,
        date: new Date(r.created_at).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
        reporterName: r.reporter?.full_name ?? "Unknown",
        reporterRole: r.reporter?.role ?? "user",
        technicianName: r.technician?.full_name ?? null,
        jobOrderId: r.job_order_id,
        pdfUrl: null,       // loaded separately when drawer opens
        hodSignedAt: null,  // loaded separately when drawer opens
      })));
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      showToast("Failed to load requests.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function openAssignModal(req) {
    setAssignTarget(req);
    setLoadingTechs(true);
    try {
      const { data: techs, error: techErr } = await supabase
        .from("profiles")
        .select("id, full_name, specialty")
        .eq("role", "technician");

      if (techErr) throw techErr;

      const { data: jobCounts, error: jobErr } = await supabase
        .from("job_orders")
        .select("technician_id")
        .in("status", ["Pending Approval", "Approved", "In Progress"]);

      if (jobErr) throw jobErr;

      const countMap = {};
      (jobCounts ?? []).forEach((j) => {
        countMap[j.technician_id] = (countMap[j.technician_id] || 0) + 1;
      });

      setTechnicians((techs ?? []).map((t) => ({
        id: t.id,
        name: t.full_name,
        specialty: t.specialty,
        activeJobs: countMap[t.id] || 0,
      })));
    } catch (err) {
      console.error("Technicians fetch error:", err);
      showToast("Failed to load technicians.", "error");
    } finally {
      setLoadingTechs(false);
    }
  }

  async function handleAssign(req, technicianId, note) {
    const technician = technicians.find((t) => t.id === technicianId);
    if (!technician) throw new Error("Selected technician not found.");

    const { data: jobOrder, error: joErr } = await supabase
      .from("job_orders")
      .insert({
        request_id: req.id,
        technician_id: technicianId,
        title: req.title,
        location: req.location,
        department: req.department,
        priority: req.priority,
        status: "Pending Approval",
        progress: 0,
        notes: note || null,
        admin_signed_by: profile?.id,
        admin_signed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (joErr) throw joErr;

    const pdfBytes = await generateJobOrderPdf({
      id: jobOrder.id,
      requestId: req.id,
      title: req.title,
      location: req.location,
      department: req.department,
      priority: req.priority,
      category: req.category,
      description: req.description,
      reporterName: req.reporterName,
      reporterRole: req.reporterRole,
      technicianName: technician.name,
      adminName: profile?.full_name ?? "Administrator",
      adminSignedAt: jobOrder.admin_signed_at,
      notes: note,
      createdAt: jobOrder.created_at,
    });

    const pdfUrl = await uploadJobOrderPdf(supabase, jobOrder.id, pdfBytes);

    const { error: updateJoErr } = await supabase
      .from("job_orders")
      .update({ pdf_url: pdfUrl })
      .eq("id", jobOrder.id);

    if (updateJoErr) throw updateJoErr;

    const { error: reqErr } = await supabase
      .from("requests")
      .update({
        status: "Assigned",
        assigned_technician_id: technicianId,
        job_order_id: jobOrder.id,
      })
      .eq("id", req.id);

    if (reqErr) throw reqErr;

    const { error: notifErr } = await supabase.from("notifications").insert({
      user_id: technicianId,
      type: "Assigned",
      title: "New Job Order Assigned",
      body: `You've been assigned: ${req.title}. Download the job order PDF and get it signed by the Head of Department before starting work.`,
      read: false,
    });
    if (notifErr) console.warn("Notification insert failed (non-blocking):", notifErr);

    await fetchRequests();
    showToast(`Assigned to ${technician.name}. Job order PDF generated.`);
  }

  async function handleMarkComplete(req) {
    try {
      const { error: reqErr } = await supabase
        .from("requests")
        .update({ status: "Completed" })
        .eq("id", req.id);
      if (reqErr) throw reqErr;

      if (req.jobOrderId) {
        const { error: joErr } = await supabase
          .from("job_orders")
          .update({ status: "Completed", progress: 100 })
          .eq("id", req.jobOrderId);
        if (joErr) throw joErr;
      }

      await fetchRequests();
      setSelected(null);
      setDrawerOpen(false);
      showToast("Request marked as completed.");
    } catch (err) {
      console.error("Mark complete error:", err);
      showToast("Failed to mark complete.", "error");
    }
  }

  function handleViewPdf(req) {
    if (req.pdfUrl) window.open(req.pdfUrl, "_blank", "noopener,noreferrer");
  }

  // ── FIXED: handleOpen now fetches job order details separately ────────────
  async function handleOpen(req, assignDirect = false) {
    setSelected(req);
    setDrawerOpen(true);
    if (assignDirect) openAssignModal(req);

    if (req.jobOrderId) {
      const { data } = await supabase
        .from("job_orders")
        .select("pdf_url, hod_signed_at")
        .eq("id", req.jobOrderId)
        .single();

      if (data) {
        setSelected((s) => s ? { ...s, pdfUrl: data.pdf_url, hodSignedAt: data.hod_signed_at } : s);
      }
    }
  }

  const go = useCallback((path) => navigate(path), [navigate]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter((r) => {
      const tabOk = tab === "All" || r.status === tab || r.priority === tab;
      const searchOk = !q || [r.id, r.title, r.location, r.reporterName, r.department]
        .some((f) => f?.toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [requests, tab, search]);

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const emergencyCount  = requests.filter((r) => r.priority === "Emergency").length;
  const activeCount     = requests.filter((r) => r.status !== "Completed").length;
  const unassignedCount = requests.filter((r) => r.status === "Unassigned" || r.status === "Pending").length;
  const completedCount  = requests.filter((r) => r.status === "Completed").length;

  const STAT_CARDS = [
    { icon: "emergency",       label: "Emergency",       value: emergencyCount,  iconBg: "#FEE2E255", iconColor: C.error },
    { icon: "pending_actions", label: "Active Requests", value: activeCount,     iconBg: `${C.secondaryContainer}55`, iconColor: C.secondary },
    { icon: "assignment_ind",  label: "Unassigned",      value: unassignedCount, iconBg: C.surfaceContainerHigh, iconColor: C.primary },
    { icon: "check_circle",    label: "Completed",       value: completedCount,  iconBg: C.secondaryContainer, iconColor: C.onSecondaryContainer },
  ];

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box}`}</style>

      {!isMobile && <Sidebar currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} />}
      {isMobile && (
        <MobileDrawer open={drawerOpen && !selected} onClose={() => setDrawerOpen(false)}
          currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} />
      )}

      <div style={{ marginLeft: isMobile ? 0 : 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar search={search} setSearch={setSearch} onMenu={() => setDrawerOpen(true)} isMobile={isMobile} />

        <main style={{ flex: 1, padding: isMobile ? "20px 14px 80px" : "32px", maxWidth: 1600, width: "100%", alignSelf: "center" }}>

          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.primary }}>Maintenance Requests</h1>
            <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Review incoming requests and assign technicians.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
            {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }} style={{
                padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700, fontFamily: MONO,
                border: "none", cursor: "pointer",
                background: tab === t ? C.primaryContainer : C.surfaceContainerHigh,
                color: tab === t ? C.white : C.onSurfaceVariant,
              }}>{t}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 76, background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : paged.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", background: C.white, borderRadius: 14, border: `1px solid ${C.outlineVariant}` }}>
              <Icon name="inbox" size={44} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                {requests.length === 0 ? "No requests yet" : "No requests match your filters"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>
                {requests.length === 0
                  ? "Requests from students and staff will appear here for review."
                  : "Try adjusting your search or tab filter."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {paged.map((req) => <RequestCard key={req.id} req={req} onOpen={handleOpen} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.outlineVariant}` }}>
              <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>Showing {paged.length} of {filtered.length}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: "none", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 13 }}>Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} style={{ padding: "6px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: page === p ? C.primaryContainer : "none", color: page === p ? C.white : C.onSurface, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 700 : 400, fontFamily: MONO }}>{p}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 6, background: "none", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontSize: 13 }}>Next</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {isMobile && <MobileBottomNav currentPath={location.pathname} onNavigate={go} />}

      {drawerOpen && selected && (
        <DetailDrawer req={selected} onClose={() => { setDrawerOpen(false); setSelected(null); }} onAssignClick={openAssignModal} onMarkComplete={handleMarkComplete} onViewPdf={handleViewPdf} />
      )}

      {assignTarget && (
        <AssignTechnicianModal req={assignTarget} technicians={technicians} loadingTechs={loadingTechs} onClose={() => setAssignTarget(null)} onAssign={handleAssign} />
      )}

      <Toast msg={toast} type={toastType} />
    </div>
  );
}
