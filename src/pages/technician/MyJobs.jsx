import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { uploadHodApprovalProof } from "../../lib/JobOrderPdf.js";

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
  { icon: "space_dashboard", label: "Dashboard",     path: "/technician/dashboard"     },
  { icon: "assignment",      label: "My Jobs",       path: "/technician/my-jobs"       },
  { icon: "notifications",   label: "Notifications", path: "/technician/notifications" },
];

// ─── Status / priority config ─────────────────────────────────────────────────
// job_orders.status: 'Pending Approval' → 'Approved' → 'In Progress' → 'Completed'
const STATUS_CFG = {
  "Pending Approval": { bg: "#FEF3C7", text: "#92400E", dot: "#f59e0b" },
  "Approved":         { bg: "#EEF2FF", text: "#3730A3", dot: "#6366f1" },
  "In Progress":      { bg: C.secondaryContainer, text: C.secondary, dot: C.secondary },
  "Completed":        { bg: "#DCFCE7", text: "#166534", dot: C.secondary },
};

const PRIORITY_CFG = {
  Emergency: { bg: C.errorContainer, text: C.error },
  High:      { bg: "#FEF3C7", text: "#92400E" },
  Medium:    { bg: "#EEF2FF", text: "#3730A3" },
  Low:       { bg: C.surfaceContainerHigh, text: C.onSurfaceVariant },
};

const CATEGORY_ICONS = {
  Electrical: "bolt", Plumbing: "water_drop", HVAC: "hvac", Structural: "domain",
  "IT Services": "router", Furniture: "chair", Lighting: "light_mode",
  Elevator: "elevator", Other: "build",
};

const TABS = ["All", "Pending Approval", "Approved", "In Progress", "Completed"];

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

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.Low;
  return (
    <span style={{ padding: "2px 9px", borderRadius: 4, background: cfg.bg, color: cfg.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG["Pending Approval"];
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700, fontFamily: MONO, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
function Sidebar({ currentPath, onNavigate, onLogout, firstName }) {
  return (
    <aside style={{ width: 260, background: C.primaryContainer, color: C.white, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, overflowY: "auto", fontFamily: SANS }}>
      <div style={{ padding: "24px 24px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="engineering" size={20} filled style={{ color: C.white }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>Technician Portal</div>
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
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, textTransform: "uppercase" }}>Technician</p>
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
          <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU Technician</div>
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
function TopBar({ search, setSearch, onMenu, isMobile, onRefresh, refreshing }) {
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 0 20px", position: "sticky", top: 0, zIndex: 40, background: "rgba(249,249,255,0.94)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 10 }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurface, display: "flex", flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 420, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs…" style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 8, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }} />
      </div>
      <button onClick={onRefresh} disabled={refreshing} style={{ background: "none", border: "none", cursor: refreshing ? "default" : "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex", flexShrink: 0 }}>
        <Icon name="refresh" size={20} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
      </button>
    </header>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onOpen }) {
  const [hov, setHov] = useState(false);
  const leftAccent = job.priority === "Emergency" ? C.error
    : job.status === "Completed" ? C.secondary
    : job.status === "Pending Approval" ? "#f59e0b"
    : C.surfaceContainerHigh;

  return (
    <div onClick={() => onOpen(job)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: C.white, border: `1px solid ${C.outlineVariant}`, borderLeft: `4px solid ${leftAccent}`,
      borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16,
      cursor: "pointer", boxShadow: hov ? "0 4px 14px rgba(0,0,0,0.07)" : "none", transition: "box-shadow 0.18s",
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={CATEGORY_ICONS[job.category] || "build"} size={22} style={{ color: C.primary }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.primary }}>{job.title}</h3>
          <PriorityBadge priority={job.priority} />
        </div>
        <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant }}>
          Job #{job.id?.toString().slice(0, 8)} · {job.location}
        </p>
      </div>
      <StatusBadge status={job.status} />
    </div>
  );
}

// ─── Upload HOD Proof Modal ────────────────────────────────────────────────────
function UploadProofModal({ job, onClose, onConfirm }) {
  const [hodName, setHodName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!hodName.trim()) { setError("Enter the Head of Department's name."); return; }
    if (!file) { setError("Please attach a photo of the signed job order."); return; }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(job, hodName.trim(), file);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload approval. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div onClick={!submitting ? onClose : undefined} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(480px,95vw)", background: C.white, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.20)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Upload Signed Approval</h3>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>{job.title} · #{job.id?.toString().slice(0, 8)}</p>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ padding: "9px 12px", background: C.errorContainer, color: C.onErrorContainer, borderRadius: 8, fontSize: 13 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
            <Icon name="info" size={16} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
              Take a clear photo of the printed job order after the Head of Department has physically signed it.
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
              Head of Department's Name *
            </label>
            <input value={hodName} onChange={(e) => setHodName(e.target.value)} placeholder="e.g. Dr. Adeyemi Okafor" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: C.white, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
              Photo of Signed Document *
            </label>
            {preview ? (
              <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.outlineVariant}` }}>
                <img src={preview} alt="Signed job order preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
                <button onClick={() => { setFile(null); setPreview(null); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon name="close" size={16} style={{ color: C.white }} />
                </button>
              </div>
            ) : (
              <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 16px", border: `2px dashed ${C.outlineVariant}`, borderRadius: 10, cursor: "pointer", background: C.surfaceContainerLow }}>
                <Icon name="add_a_photo" size={28} style={{ color: C.onSurfaceVariant }} />
                <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>Tap to take or upload a photo</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: "9px 20px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: "9px 22px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: submitting ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="task_alt" size={15} style={{ color: C.white }} />
            {submitting ? "Uploading…" : "Confirm Approval"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ job, onClose, onDownloadPdf, onStartJob, onUploadProof, onUpdateProgress, onMarkComplete }) {
  if (!job) return null;
  const [progress, setProgress] = useState(job.progress ?? 0);

  const canStart    = job.status === "Approved";
  const isApproved  = job.status === "Approved" || job.status === "In Progress" || job.status === "Completed";
  const isPending    = job.status === "Pending Approval";

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(440px,100vw)", background: C.white, zIndex: 101, boxShadow: "-6px 0 32px rgba(0,0,0,0.12)", display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                <StatusBadge status={job.status} />
                <PriorityBadge priority={job.priority} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name={CATEGORY_ICONS[job.category] || "build"} size={22} style={{ color: C.primary }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>#{job.id?.toString().slice(0, 8)}</p>
                  <h2 style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{job.title}</h2>
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex", flexShrink: 0 }}>
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {[
            ["Location",   job.location,   "location_on"],
            ["Department", job.department, "domain"],
            ["Category",   job.category,   "category"],
          ].map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: C.surfaceContainerLow, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={icon} size={16} style={{ color: C.onSurfaceVariant }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500, color: C.onSurface }}>{value || "—"}</p>
              </div>
            </div>
          ))}

          {job.notes && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Note from Admin</p>
              <div style={{ padding: "12px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: C.onSurface, lineHeight: 1.6 }}>{job.notes}</p>
              </div>
            </div>
          )}

          {/* Job Order PDF */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Job Order Document</p>
            <button onClick={() => onDownloadPdf(job)} disabled={!job.pdfUrl} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.outlineVariant}`, background: C.white, cursor: job.pdfUrl ? "pointer" : "not-allowed", textAlign: "left", width: "100%", opacity: job.pdfUrl ? 1 : 0.5 }}>
              <Icon name="picture_as_pdf" size={20} style={{ color: C.error }} />
              <span style={{ flex: 1, fontSize: 13, color: C.onSurface, fontWeight: 600 }}>Download Job Order PDF</span>
              <Icon name="download" size={16} style={{ color: C.onSurfaceVariant }} />
            </button>
          </div>

          {/* Approval workflow */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Head of Department Approval</p>
            {isApproved ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#DCFCE7" }}>
                <Icon name="verified" size={20} style={{ color: "#166534" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#166534" }}>Approved by {job.hodName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#166534", fontFamily: MONO }}>{job.hodSignedAtFormatted}</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#FEF3C7" }}>
                  <Icon name="pending" size={20} style={{ color: "#92400E" }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400E" }}>Awaiting physical signature from the Head of Department</p>
                </div>
                <button onClick={() => onUploadProof(job)} disabled={!job.pdfUrl} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, border: "none", background: C.primaryContainer, color: C.white, cursor: job.pdfUrl ? "pointer" : "not-allowed", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: job.pdfUrl ? 1 : 0.5 }}>
                  <Icon name="add_a_photo" size={15} style={{ color: C.white }} />
                  Upload Signed Approval
                </button>
              </div>
            )}
          </div>

          {/* Progress (only once approved/in progress) */}
          {(job.status === "In Progress" || job.status === "Approved") && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Progress</p>
                <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>{progress}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", accentColor: C.primaryContainer }} disabled={job.status === "Approved"} />
              {job.status === "In Progress" && (
                <button onClick={() => onUpdateProgress(job, progress)} style={{ marginTop: 8, width: "100%", padding: "8px 0", background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>
                  Save Progress
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: C.surfaceContainerHigh, color: C.onSurface, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}>
            Close
          </button>
          {canStart && job.status === "Approved" && (
            <button onClick={() => onStartJob(job)} style={{ flex: 1, padding: "10px 0", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="play_arrow" size={16} style={{ color: C.white }} />
              Start Job
            </button>
          )}
          {isPending && (
            <button disabled style={{ flex: 1, padding: "10px 0", background: C.surfaceContainerHigh, color: C.onSurfaceVariant, border: "none", borderRadius: 8, cursor: "not-allowed", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="lock" size={15} style={{ color: C.onSurfaceVariant }} />
              Locked — Awaiting Approval
            </button>
          )}
          {job.status === "In Progress" && (
            <button onClick={() => onMarkComplete(job)} style={{ flex: 1, padding: "10px 0", background: C.secondaryContainer, color: C.onSecondaryContainer, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
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
export default function MyJobs() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isMobile  = useIsMobile();
  const { user, profile } = useAuth();

  const [search,      setSearch]     = useState("");
  const [tab,         setTab]        = useState("All");
  const [drawerOpen,  setDrawerOpen] = useState(false);
  const [selected,    setSelected]   = useState(null);
  const [proofTarget, setProofTarget]= useState(null);
  const [toast,       setToast]      = useState(null);
  const [toastType,   setToastType]  = useState("default");
  const [loading,     setLoading]    = useState(true);
  const [refreshing,  setRefreshing] = useState(false);

  const [jobs, setJobs] = useState([]);

  const firstName = profile?.full_name?.split(" ")[0] || "Technician";

  function showToast(msg, type = "default") {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Fetch job orders assigned to this technician ──────────────────────────
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("job_orders")
        .select("*")
        .eq("technician_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setJobs((data || []).map((j) => ({
        id: j.id,
        title: j.title,
        location: j.location,
        department: j.department,
        priority: j.priority,
        status: j.status,
        progress: j.progress ?? 0,
        notes: j.notes,
        category: j.category || "Other",
        pdfUrl: j.pdf_url,
        hodName: j.hod_name,
        hodSignedAtFormatted: j.hod_signed_at
          ? new Date(j.hod_signed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
          : null,
        requestId: j.request_id,
      })));
    } catch (err) {
      console.error("Fetch jobs error:", err);
      showToast("Unable to load jobs. Please refresh.", "error");
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchJobs().finally(() => setLoading(false));
  }, [fetchJobs]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
    showToast("Job list refreshed.");
  }

  // ── Download PDF ───────────────────────────────────────────────────────────
  function handleDownloadPdf(job) {
    if (job.pdfUrl) window.open(job.pdfUrl, "_blank", "noopener,noreferrer");
  }

  // ── Upload HOD signed-approval proof ───────────────────────────────────────
  async function handleUploadProof(job, hodName, file) {
    const proofUrl = await uploadHodApprovalProof(supabase, job.id, file);

    const { error } = await supabase
      .from("job_orders")
      .update({
        status: "Approved",
        hod_name: hodName,
        hod_signed_at: new Date().toISOString(),
        hod_proof_url: proofUrl,
      })
      .eq("id", job.id);

    if (error) throw error;

    await fetchJobs();
    setSelected((s) => s && s.id === job.id ? { ...s, status: "Approved", hodName, hodSignedAtFormatted: "Just now" } : s);
    showToast("Approval recorded. You can now start the job.");
  }

  // ── Start job ──────────────────────────────────────────────────────────────
  async function handleStartJob(job) {
    try {
      const { error } = await supabase
        .from("job_orders")
        .update({ status: "In Progress" })
        .eq("id", job.id);
      if (error) throw error;

      // Also reflect on the linked request so student/staff/admin see it update
      if (job.requestId) {
        await supabase.from("requests").update({ status: "Assigned" }).eq("id", job.requestId);
      }

      await fetchJobs();
      setSelected((s) => s && s.id === job.id ? { ...s, status: "In Progress" } : s);
      showToast("Job started.");
    } catch (err) {
      console.error("Start job error:", err);
      showToast("Unable to start job.", "error");
    }
  }

  // ── Update progress ──────────────────────────────────────────────────────
  async function handleUpdateProgress(job, progress) {
    try {
      const { error } = await supabase
        .from("job_orders")
        .update({ progress })
        .eq("id", job.id);
      if (error) throw error;

      setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, progress } : j));
      showToast("Progress saved.");
    } catch (err) {
      console.error("Update progress error:", err);
      showToast("Unable to update progress.", "error");
    }
  }

  // ── Mark complete ──────────────────────────────────────────────────────────
  async function handleMarkComplete(job) {
    try {
      const { error: joErr } = await supabase
        .from("job_orders")
        .update({ status: "Completed", progress: 100 })
        .eq("id", job.id);
      if (joErr) throw joErr;

      if (job.requestId) {
        const { error: reqErr } = await supabase
          .from("requests")
          .update({ status: "Completed" })
          .eq("id", job.requestId);
        if (reqErr) throw reqErr;
      }

      await fetchJobs();
      setSelected(null);
      setDrawerOpen(false);
      showToast("Job marked as completed.");
    } catch (err) {
      console.error("Mark complete error:", err);
      showToast("Unable to mark job complete.", "error");
    }
  }

  const go = useCallback((path) => navigate(path), [navigate]);

  function handleOpen(job) {
    setSelected(job);
    setDrawerOpen(true);
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      const tabOk = tab === "All" || j.status === tab;
      const searchOk = !q || [j.id, j.title, j.location, j.department].some((f) => f?.toString().toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [jobs, tab, search]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pendingCount    = jobs.filter((j) => j.status === "Pending Approval").length;
  const approvedCount   = jobs.filter((j) => j.status === "Approved").length;
  const inProgressCount = jobs.filter((j) => j.status === "In Progress").length;
  const completedCount  = jobs.filter((j) => j.status === "Completed").length;

  const STAT_CARDS = [
    { icon: "pending_actions", label: "Awaiting Approval", value: pendingCount,    iconBg: "#FEF3C755", iconColor: "#92400E" },
    { icon: "verified",        label: "Approved",          value: approvedCount,   iconBg: "#EEF2FF",   iconColor: "#3730A3" },
    { icon: "engineering",     label: "In Progress",       value: inProgressCount, iconBg: `${C.secondaryContainer}55`, iconColor: C.secondary },
    { icon: "check_circle",    label: "Completed",         value: completedCount,  iconBg: C.secondaryContainer, iconColor: C.onSecondaryContainer },
  ];

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} @keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box}`}</style>

      {!isMobile && <Sidebar currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} firstName={firstName} />}
      {isMobile && (
        <MobileDrawer open={drawerOpen && !selected} onClose={() => setDrawerOpen(false)}
          currentPath={location.pathname} onNavigate={go} onLogout={() => navigate("/login")} firstName={firstName} />
      )}

      <div style={{ marginLeft: isMobile ? 0 : 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar search={search} setSearch={setSearch} onMenu={() => setDrawerOpen(true)} isMobile={isMobile} onRefresh={handleRefresh} refreshing={refreshing} />

        <main style={{ flex: 1, padding: isMobile ? "20px 14px 80px" : "32px", maxWidth: 1600, width: "100%", alignSelf: "center" }}>

          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.primary }}>My Jobs</h1>
            <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Job orders assigned to you. Get HOD approval before starting work.</p>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
            {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700, fontFamily: MONO,
                border: "none", cursor: "pointer",
                background: tab === t ? C.primaryContainer : C.surfaceContainerHigh,
                color: tab === t ? C.white : C.onSurfaceVariant,
              }}>{t}</button>
            ))}
          </div>

          {/* Job list */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 76, background: C.white, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "56px 24px", textAlign: "center", background: C.white, borderRadius: 14, border: `1px solid ${C.outlineVariant}` }}>
              <Icon name="engineering" size={44} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>
                {jobs.length === 0 ? "No jobs assigned yet" : "No jobs match your filters"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>
                {jobs.length === 0
                  ? "Jobs assigned to you by the admin will appear here."
                  : "Try adjusting your search or tab filter."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((job) => <JobCard key={job.id} job={job} onOpen={handleOpen} />)}
            </div>
          )}
        </main>
      </div>

      {isMobile && <MobileBottomNav currentPath={location.pathname} onNavigate={go} />}

      {drawerOpen && selected && (
        <DetailDrawer
          job={selected}
          onClose={() => { setDrawerOpen(false); setSelected(null); }}
          onDownloadPdf={handleDownloadPdf}
          onStartJob={handleStartJob}
          onUploadProof={(job) => setProofTarget(job)}
          onUpdateProgress={handleUpdateProgress}
          onMarkComplete={handleMarkComplete}
        />
      )}

      {proofTarget && (
        <UploadProofModal job={proofTarget} onClose={() => setProofTarget(null)} onConfirm={handleUploadProof} />
      )}

      <Toast msg={toast} type={toastType} />
    </div>
  );
}
