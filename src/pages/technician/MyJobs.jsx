import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  { icon: "space_dashboard", label: "Dashboard",     path: "/technician/dashboard"     },
  { icon: "assignment",      label: "My Jobs",       path: "/technician/my-jobs"       },
  { icon: "notifications",   label: "Notifications", path: "/technician/notifications" },
];

const STATUS_CFG = {
  "Pending Approval":          { bg: "#FEF3C7", text: "#92400E", dot: "#f59e0b" },
  "Pending Admin Verification":{ bg: "#ffdcc3", text: "#6e3900", dot: "#ffb77d" },
  "Approved":                  { bg: "#EEF2FF", text: "#3730A3", dot: "#6366f1" },
  "Rejected":                  { bg: "#ffdad6", text: "#93000a", dot: "#ba1a1a" },
  "In Progress":               { bg: C.secondaryContainer, text: C.secondary, dot: C.secondary },
  "Completed":                 { bg: "#DCFCE7", text: "#166534", dot: C.secondary },
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

const TABS = ["All", "Pending Approval", "Pending Admin Verification", "Approved", "In Progress", "Completed"];

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
  const cfg = STATUS_CFG[status] || STATUS_CFG["Pending Approval"];
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 700, fontFamily: MONO, whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
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
            <button key={item.label} onClick={() => onNavigate(item.path)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO, transition: "background 0.15s" }}
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
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryFixedDim, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: C.primary, fontSize: 13 }}>{firstName[0]}</div>
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
              <button key={item.label} onClick={() => { onNavigate(item.path); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isActive ? "rgba(255,255,255,0.12)" : "transparent", color: isActive ? C.white : "rgba(255,255,255,0.70)", fontWeight: isActive ? 700 : 400, borderLeft: isActive ? `4px solid ${C.primaryFixedDim}` : "4px solid transparent", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO }}>
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

function MobileBottomNav({ currentPath, onNavigate }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: C.white, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 62 }}>
      {NAV_ITEMS.map((item) => {
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

function JobCard({ job, onOpen }) {
  const [hov, setHov] = useState(false);
  const leftAccent = job.priority === "Emergency" ? C.error
    : job.status === "Completed"                  ? C.secondary
    : job.status === "Pending Approval"           ? "#f59e0b"
    : job.status === "Pending Admin Verification" ? "#ffb77d"
    : job.status === "Rejected"                   ? C.error
    : C.surfaceContainerHigh;

  return (
    <div onClick={() => onOpen(job)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: C.white, border: `1px solid ${C.outlineVariant}`, borderLeft: `4px solid ${leftAccent}`, borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", boxShadow: hov ? "0 4px 14px rgba(0,0,0,0.07)" : "none", transition: "box-shadow 0.18s" }}>
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
        {/* Progress bar for in-progress jobs */}
        {job.status === "In Progress" && (
          <div style={{ marginTop: 6 }}>
            <div style={{ width: "100%", height: 3, background: C.surfaceContainerHigh, borderRadius: 99 }}>
              <div style={{ height: "100%", width: `${job.progress}%`, borderRadius: 99, background: C.secondary, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, marginTop: 2, display: "block" }}>{job.progress}% complete</span>
          </div>
        )}
      </div>
      <StatusBadge status={job.status} />
    </div>
  );
}

// ─── Upload HOD Proof Modal ────────────────────────────────────────────────────
function UploadProofModal({ job, onClose, onConfirm }) {
  const [hodName,    setHodName]    = useState("");
  const [file,       setFile]       = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (f.size > 10 * 1024 * 1024)   { setError("Image must be under 10MB."); return; }
    setFile(f);
    setError("");
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!hodName.trim()) { setError("Enter the Head of Department's name."); return; }
    if (!file)           { setError("Please attach a photo of the signed job order."); return; }
    setError("");
    setSubmitting(true);
    try {
      await onConfirm(job, hodName.trim(), file);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div onClick={!submitting ? onClose : undefined} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(480px,95vw)", background: C.white, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.20)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>Upload Signed HOD Approval</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>{job.title} · #{job.id?.toString().slice(0, 8)}</p>
          </div>
          <button onClick={onClose} disabled={submitting} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
            <Icon name="close" size={20} />
          </button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <div style={{ padding: "9px 12px", background: C.errorContainer, color: C.onErrorContainer, borderRadius: 8, fontSize: 13 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
            <Icon name="info" size={16} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>
              Take a clear photo of the printed job order after the HOD has physically signed it. The admin will verify before work begins.
            </p>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Head of Department's Name *</label>
            <input value={hodName} onChange={(e) => setHodName(e.target.value)} placeholder="e.g. Dr. Adeyemi Okafor" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: C.white, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Photo of Signed Document *</label>
            {preview ? (
              <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.outlineVariant}` }}>
                <img src={preview} alt="Signed job order preview" style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }} />
                <button onClick={() => { setFile(null); setPreview(null); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon name="close" size={16} style={{ color: C.white }} />
                </button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "28px 16px", border: `2px dashed ${C.outlineVariant}`, borderRadius: 10, cursor: "pointer", background: C.surfaceContainerLow, width: "100%" }}>
                <Icon name="add_a_photo" size={28} style={{ color: C.onSurfaceVariant }} />
                <span style={{ fontSize: 13, color: C.onSurfaceVariant }}>Tap to take or upload a photo</span>
                <span style={{ fontSize: 11, color: C.outline, fontFamily: MONO }}>JPG, PNG — Max 10MB</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: "9px 20px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: "9px 22px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: submitting ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name={submitting ? "hourglass_top" : "upload"} size={15} style={{ color: C.white }} />
            {submitting ? "Uploading…" : "Submit for Admin Verification"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DetailDrawer({ job, onClose, onDownloadPdf, onStartJob, onUploadProof, onUpdateProgress, onMarkComplete }) {
  if (!job) return null;
  const [progress,  setProgress]  = useState(job.progress ?? 0);
  const [saving,    setSaving]    = useState(false);

  const isPendingApproval    = job.status === "Pending Approval";
  const isPendingVerification= job.status === "Pending Admin Verification";
  const isApproved           = job.status === "Approved";
  const isInProgress         = job.status === "In Progress";
  const isRejected           = job.status === "Rejected";
  const isCompleted          = job.status === "Completed";

  const hodSigned = isApproved || isInProgress || isCompleted || isPendingVerification;

  async function saveProgress() {
    setSaving(true);
    await onUpdateProgress(job, progress);
    setSaving(false);
  }

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

          {/* Rejection notice */}
          {isRejected && job.rejectionReason && (
            <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: C.errorContainer, borderRadius: 10, border: `1px solid ${C.error}33` }}>
              <Icon name="cancel" size={18} style={{ color: C.error, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.onErrorContainer }}>Proof Rejected by Admin</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: C.onErrorContainer, lineHeight: 1.5 }}>{job.rejectionReason}</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, fontFamily: MONO, color: C.onErrorContainer }}>Please get the document properly signed and resubmit.</p>
              </div>
            </div>
          )}

          {/* Info fields */}
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

          {/* Admin notes */}
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

          {/* HOD Approval section */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Head of Department Approval</p>

            {isPendingVerification && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#ffdcc3", border: "1px solid #ffb77d" }}>
                <Icon name="hourglass_top" size={18} style={{ color: "#6e3900" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#6e3900" }}>Submitted — Awaiting Admin Verification</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6e3900", fontFamily: MONO }}>HOD: {job.hodName} · {job.hodSignedAtFormatted}</p>
                </div>
              </div>
            )}

            {hodSigned && !isPendingVerification && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#DCFCE7" }}>
                <Icon name="verified" size={20} style={{ color: "#166534" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#166534" }}>Verified — Approved by {job.hodName}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#166534", fontFamily: MONO }}>{job.hodSignedAtFormatted}</p>
                </div>
              </div>
            )}

            {(isPendingApproval || isRejected) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#FEF3C7" }}>
                  <Icon name="pending" size={20} style={{ color: "#92400E" }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400E" }}>
                    {isRejected ? "Previous proof rejected — please resubmit" : "Awaiting physical signature from the Head of Department"}
                  </p>
                </div>
                <button onClick={() => onUploadProof(job)} disabled={!job.pdfUrl} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 8, border: "none", background: C.primaryContainer, color: C.white, cursor: job.pdfUrl ? "pointer" : "not-allowed", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: job.pdfUrl ? 1 : 0.5 }}>
                  <Icon name="add_a_photo" size={15} style={{ color: C.white }} />
                  Upload Signed Approval
                </button>
              </div>
            )}
          </div>

          {/* Progress — only for in-progress */}
          {isInProgress && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase" }}>Progress</p>
                <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface }}>{progress}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", accentColor: C.primaryContainer }} />

              {/* Quick milestone buttons */}
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {[25, 50, 75].map(p => (
                  <button key={p} onClick={() => setProgress(p)} disabled={progress >= p} style={{ flex: 1, padding: "5px 0", background: progress >= p ? C.secondaryContainer : C.surfaceContainerHigh, border: "none", borderRadius: 6, cursor: progress >= p ? "default" : "pointer", fontSize: 11, fontFamily: MONO, fontWeight: 700, color: progress >= p ? C.onSecondaryContainer : C.onSurfaceVariant, opacity: progress >= p ? 0.5 : 1 }}>{p}%</button>
                ))}
              </div>

              <button onClick={saveProgress} disabled={saving} style={{ marginTop: 8, width: "100%", padding: "8px 0", background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, color: C.onSurface, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: saving ? 0.6 : 1 }}>
                <Icon name={saving ? "hourglass_top" : "save"} size={14} style={{ color: C.onSurface }} />
                {saving ? "Saving…" : "Save Progress"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", background: C.surfaceContainerHigh, color: C.onSurface, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO }}>Close</button>

          {isApproved && (
            <button onClick={() => onStartJob(job)} style={{ flex: 1, padding: "10px 0", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="play_arrow" size={16} style={{ color: C.white }} />
              Start Job
            </button>
          )}

          {(isPendingApproval || isPendingVerification) && (
            <button disabled style={{ flex: 1, padding: "10px 0", background: C.surfaceContainerHigh, color: C.onSurfaceVariant, border: "none", borderRadius: 8, cursor: "not-allowed", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="lock" size={15} style={{ color: C.onSurfaceVariant }} />
              {isPendingVerification ? "Awaiting Admin" : "Locked — Awaiting Approval"}
            </button>
          )}

          {isInProgress && (
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
  const [jobs,        setJobs]       = useState([]);

  const firstName = profile?.full_name?.split(" ")[0] || "Technician";

  function showToast(msg, type = "default") {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(null), 3000);
  }

  // ── Notify requester helper ───────────────────────────────────────────────
  async function notifyRequester(requestId, title, body) {
    if (!requestId) return;
    try {
      const { data } = await supabase
        .from("requests")
        .select("created_by")
        .eq("id", requestId)
        .single();
      if (data?.created_by) {
        await supabase.from("notifications").insert({
          user_id: data.created_by,
          type:    "StatusUpdate",
          title,
          body,
          read:    false,
        });
      }
    } catch (err) {
      console.warn("notifyRequester error:", err);
    }
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("job_orders")
        .select("id, title, location, department, priority, status, progress, notes, category, pdf_url, hod_name, hod_signed_at, hod_proof_url, rejection_reason, request_id, created_at")
        .eq("technician_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setJobs((data || []).map((j) => ({
        id:                   j.id,
        title:                j.title,
        location:             j.location,
        department:           j.department,
        priority:             j.priority,
        status:               j.status,
        progress:             j.progress ?? 0,
        notes:                j.notes,
        category:             j.category || "Other",
        pdfUrl:               j.pdf_url,
        hodName:              j.hod_name,
        hodProofUrl:          j.hod_proof_url,
        rejectionReason:      j.rejection_reason,
        hodSignedAtFormatted: j.hod_signed_at
          ? new Date(j.hod_signed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
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

  // ── Real-time ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("my-jobs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "job_orders", filter: `technician_id=eq.${user.id}` }, () => fetchJobs())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user, fetchJobs]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
    showToast("Job list refreshed.");
  }

  function handleDownloadPdf(job) {
    if (job.pdfUrl) window.open(job.pdfUrl, "_blank", "noopener,noreferrer");
  }

  // ── Upload HOD proof → status: Pending Admin Verification ────────────────
  async function handleUploadProof(job, hodName, file) {
    // Upload to storage
    const ext      = file.name.split(".").pop();
    const filePath = `${user.id}/${job.id}/hod-proof-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("hod-proofs")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });
    if (uploadErr) throw uploadErr;

    // Get signed URL (private bucket — 1 year)
    const { data: signedData, error: signedErr } = await supabase.storage
      .from("hod-proofs")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);
    if (signedErr) throw signedErr;

    const proofUrl = signedData.signedUrl;

    // Update job order
    const { error: updateErr } = await supabase
      .from("job_orders")
      .update({
        status:        "Pending Admin Verification",
        hod_name:      hodName,
        hod_signed_at: new Date().toISOString(),
        hod_proof_url: proofUrl,
        rejection_reason: null,
      })
      .eq("id", job.id);
    if (updateErr) throw updateErr;

    // Notify all admins
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    if (admins?.length) {
      await supabase.from("notifications").insert(
        admins.map(a => ({
          user_id: a.id,
          type:    "StatusUpdate",
          title:   "HOD Proof Submitted — Awaiting Verification",
          body:    `Technician ${profile?.full_name ?? "Technician"} has uploaded a signed HOD document for job "${job.title}". Please review and verify before work begins.`,
          read:    false,
        }))
      );
    }

    await fetchJobs();
    setSelected(s => s?.id === job.id ? { ...s, status: "Pending Admin Verification", hodName, hodSignedAtFormatted: "Just now", hodProofUrl: proofUrl } : s);
    showToast("Proof uploaded. Awaiting admin verification.");
  }

  // ── Start job ─────────────────────────────────────────────────────────────
  async function handleStartJob(job) {
    try {
      const { error } = await supabase
        .from("job_orders")
        .update({ status: "In Progress" })
        .eq("id", job.id);
      if (error) throw error;

      if (job.requestId) {
        await supabase.from("requests").update({ status: "Assigned" }).eq("id", job.requestId);
      }

      // Notify requester that work has begun
      await notifyRequester(
        job.requestId,
        "Work Has Begun on Your Request",
        `A technician has started working on your request "${job.title}". You will be notified as progress is made.`
      );

      await fetchJobs();
      setSelected(s => s?.id === job.id ? { ...s, status: "In Progress" } : s);
      showToast("Job started. Requester has been notified.");
    } catch (err) {
      console.error("Start job error:", err);
      showToast("Unable to start job.", "error");
    }
  }

  // ── Update progress ───────────────────────────────────────────────────────
  async function handleUpdateProgress(job, progress) {
    try {
      const { error } = await supabase
        .from("job_orders")
        .update({ progress })
        .eq("id", job.id);
      if (error) throw error;

      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, progress } : j));

      // Notify requester at milestones 25, 50, 75
      if ([25, 50, 75].includes(progress)) {
        await notifyRequester(
          job.requestId,
          `Your Request is ${progress}% Complete`,
          `The technician working on "${job.title}" has made progress — the job is now ${progress}% done. We'll keep you updated.`
        );
        showToast(`Progress saved at ${progress}%. Requester notified.`);
      } else {
        showToast("Progress saved.");
      }
    } catch (err) {
      console.error("Update progress error:", err);
      showToast("Unable to update progress.", "error");
    }
  }

  // ── Mark complete ─────────────────────────────────────────────────────────
  async function handleMarkComplete(job) {
    try {
      const { error: joErr } = await supabase
        .from("job_orders")
        .update({ status: "Completed", progress: 100 })
        .eq("id", job.id);
      if (joErr) throw joErr;

      if (job.requestId) {
        await supabase.from("requests").update({ status: "Completed" }).eq("id", job.requestId);
      }

      // Notify requester — job fully done
      await notifyRequester(
        job.requestId,
        "✅ Your Request Has Been Completed",
        `Great news! The maintenance job for "${job.title}" has been fully completed. If you have any concerns about the work done, please contact the admin.`
      );

      // Notify admins too
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map(a => ({
            user_id: a.id,
            type:    "Completed",
            title:   `Job Completed: ${job.title}`,
            body:    `Technician ${profile?.full_name ?? "Technician"} has marked "${job.title}" as completed. The requester has been notified.`,
            read:    false,
          }))
        );
      }

      await fetchJobs();
      setSelected(null);
      setDrawerOpen(false);
      showToast("Job completed. Requester and admin notified.");
    } catch (err) {
      console.error("Mark complete error:", err);
      showToast("Unable to mark job complete.", "error");
    }
  }

  const go = useCallback((path) => navigate(path), [navigate]);

  function handleOpen(job) { setSelected(job); setDrawerOpen(true); }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter((j) => {
      const tabOk    = tab === "All" || j.status === tab;
      const searchOk = !q || [j.id, j.title, j.location, j.department].some((f) => f?.toString().toLowerCase().includes(q));
      return tabOk && searchOk;
    });
  }, [jobs, tab, search]);

  const pendingCount              = jobs.filter(j => j.status === "Pending Approval").length;
  const pendingVerificationCount  = jobs.filter(j => j.status === "Pending Admin Verification").length;
  const approvedCount             = jobs.filter(j => j.status === "Approved").length;
  const inProgressCount           = jobs.filter(j => j.status === "In Progress").length;
  const completedCount            = jobs.filter(j => j.status === "Completed").length;

  const STAT_CARDS = [
    { icon: "pending_actions", label: "Awaiting Approval",    value: pendingCount,             iconBg: "#FEF3C755", iconColor: "#92400E" },
    { icon: "fact_check",      label: "Pending Verification", value: pendingVerificationCount, iconBg: "#ffdcc355", iconColor: "#6e3900" },
    { icon: "engineering",     label: "In Progress",          value: inProgressCount,          iconBg: `${C.secondaryContainer}55`, iconColor: C.secondary },
    { icon: "check_circle",    label: "Completed",            value: completedCount,           iconBg: C.secondaryContainer, iconColor: C.onSecondaryContainer },
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

          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.primary }}>My Jobs</h1>
            <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Job orders assigned to you. Get HOD approval before starting work.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
            {STAT_CARDS.map((c) => <StatCard key={c.label} {...c} loading={loading} />)}
          </div>

          {/* Tabs — scrollable on mobile */}
          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", marginBottom: 18, paddingBottom: 4 }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: 99, fontSize: 11, fontWeight: 700, fontFamily: MONO, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: tab === t ? C.primaryContainer : C.surfaceContainerHigh, color: tab === t ? C.white : C.onSurfaceVariant }}>{t}</button>
            ))}
          </div>

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
                {jobs.length === 0 ? "Jobs assigned to you by the admin will appear here." : "Try adjusting your search or tab filter."}
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