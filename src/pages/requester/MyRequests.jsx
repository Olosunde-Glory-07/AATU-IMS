import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "var(--color-on-surface)",
  primaryContainer:       "var(--color-primary-container)",
  primaryFixedDim:        "var(--color-primary-fixed-dim)",
  secondary:              "var(--color-secondary)",
  secondaryContainer:     "var(--color-secondary-container)",
  onSecondaryContainer:   "var(--color-on-secondary-container)",
  tertiaryFixed:          "var(--color-tertiary-fixed)",
  onTertiaryFixed:        "var(--color-on-tertiary-fixed)",
  onTertiaryFixedVariant: "var(--color-on-tertiary-fixed-variant)",
  errorContainer:         "var(--color-error-container)",
  onErrorContainer:       "var(--color-on-error-container)",
  error:                  "var(--color-error)",
  surface:                "var(--color-background)",
  surfaceContainer:       "var(--color-surface-container)",
  surfaceContainerLow:    "var(--color-surface-container-low)",
  surfaceContainerHigh:   "var(--color-surface-container-high)",
  onSurface:              "var(--color-on-surface)",
  onSurfaceVariant:       "var(--color-on-surface-variant)",
  outlineVariant:         "var(--color-outline-variant)",
  outline:                "var(--color-outline)",
  white:                  "#ffffff",
};
const CARD = "var(--color-surface-container-lowest)";
const SIDEBAR_BG = "#4a0404";
const MONO = "'JetBrains Mono', monospace";
const SANS = "'Hanken Grotesk', sans-serif";

const ROLE_LABEL = { hod: "HOD", dean: "Dean" };

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/requester/dashboard"     },
  { icon: "list_alt",      label: "My Requests",   path: "/requester/my-requests"   },
  { icon: "history",       label: "My History",    path: "/requester/my-history"    },
  { icon: "notifications", label: "Notifications", path: "/requester/notifications" },
];

const STATUS_CFG = {
  "Pending Monitor Approval": { bg: C.tertiaryFixed, text: C.onTertiaryFixedVariant, dot: "#f59e0b" },
  Pending:                    { bg: "#FEF3C7",         text: "#b45309",                dot: "#f59e0b" },
  Assigned:                  { bg: "#EEF2FF",          text: "#4338ca",                dot: "#6366f1" },
  Completed:                 { bg: "#DCFCE7",          text: "#166534",                dot: C.secondary },
  "Rejected by Monitor":     { bg: C.errorContainer,  text: C.error,                  dot: C.error },
  Emergency:                 { bg: C.errorContainer,  text: C.error,                  dot: C.error },
};

const PRIORITY_CFG = {
  Emergency: { bg: C.errorContainer, text: C.error },
  High:      { bg: "#FEE2E2", text: "#991B1B" },
  Medium:    { bg: "#FEF3C7", text: "#b45309" },
  Low:       { bg: "#DCFCE7", text: "#166534" },
};

const CATEGORY_ICONS = {
  HVAC: "hvac", Electrical: "bolt", Plumbing: "water_drop", Structural: "domain",
  "IT Services": "router", Furniture: "chair", Lighting: "light_mode",
  Elevator: "elevator", Other: "build",
};

const FILTER_TABS = ["All", "Pending Monitor Approval", "Pending", "Assigned", "Completed", "Rejected by Monitor", "Emergency"];
const EMPTY_FORM  = { title: "", location: "", department: "", category: "Electrical", priority: "Medium", description: "" };

function formatRequest(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description || "",
    category: r.category || "Electrical",
    priority: r.priority || "Medium",
    status: r.status || "Pending",
    date: r.created_at
      ? new Date(r.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    location: r.location || "",
    department: r.department || "",
    assignedTo: r.assigned_technician_id ? "Technician assigned" : "Not yet assigned",
    jobOrderId: r.job_order_id || null,
    monitorId: r.monitor_id || null,
    monitorRejectionReason: r.monitor_rejection_reason || "",
    timeline: buildTimeline(r),
  };
}

function buildTimeline(r) {
  const submittedTime = r.created_at
    ? new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  const steps = [
    { label: "Request Submitted", desc: "Sent to your assigned monitor for review.", time: submittedTime, state: "done" },
  ];

  if (r.status === "Pending Monitor Approval") {
    steps.push({ label: "Awaiting Monitor Review", desc: "Your assigned staff monitor is reviewing this request.", time: "Pending", state: "active" });
    return steps;
  }
  if (r.status === "Rejected by Monitor") {
    steps.push({ label: "Rejected by Monitor", desc: r.monitor_rejection_reason || "Your monitor did not approve this request.", time: "Done", state: "done" });
    return steps;
  }

  steps.push({ label: "Monitor Approved", desc: "Approved and forwarded to admin.", time: "Done", state: "done" });

  if (r.status === "Pending") {
    steps.push({ label: "Awaiting Assignment", desc: "Admin is reviewing your request.", time: "Pending", state: "active" });
  } else if (r.status === "Assigned") {
    steps.push({ label: "Awaiting Assignment", desc: "A technician has been assigned.", time: "Done", state: "done" });
    steps.push({ label: "In Progress", desc: "Work is being carried out.", time: "Pending", state: "active" });
  } else if (r.status === "Completed") {
    steps.push({ label: "Awaiting Assignment", desc: "A technician was assigned.", time: "Done", state: "done" });
    steps.push({ label: "In Progress", desc: "Work was carried out.", time: "Done", state: "done" });
    steps.push({ label: "Completed", desc: "Request resolved.", time: r.updated_at ? new Date(r.updated_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Done", state: "done" });
  }
  return steps;
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
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, verticalAlign: "middle", fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400", ...style }}>{name}</span>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ currentPath, onNavigate, onLogout, firstName, roleLabel, initials }) {
  return (
    <aside style={{ width: 260, background: SIDEBAR_BG, color: C.white, display: "flex", flexDirection: "column", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50, overflowY: "auto", fontFamily: SANS }}>
      <div style={{ padding: "24px 24px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="account_balance" size={20} filled style={{ color: C.white }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, letterSpacing: "0.12em", textTransform: "uppercase" }}>Requester Portal</div>
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

      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={() => onNavigate("/requester/profile")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "8px 10px", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", borderRadius: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ffb4aa", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4a0404", fontSize: 13, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.white }}>{firstName}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.5)", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em" }}>{roleLabel} · View Profile</p>
          </div>
          <Icon name="chevron_right" size={16} style={{ color: "rgba(255,255,255,0.4)" }} />
        </button>
        <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, borderRadius: 6 }}>
          <Icon name="logout" size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
          Logout
        </button>
      </div>
    </aside>
  );
}

function MobileDrawer({ open, onClose, currentPath, onNavigate, onLogout, firstName, roleLabel, initials }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.40)", zIndex: 70 }} />
      <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, background: SIDEBAR_BG, zIndex: 71, display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>AATU {roleLabel}</div>
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
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button onClick={() => { onNavigate("/requester/profile"); onClose(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", background: "rgba(255,255,255,0.07)", border: "none", cursor: "pointer", borderRadius: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ffb4aa", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4a0404", fontSize: 12, flexShrink: 0 }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{firstName}</span>
            <Icon name="chevron_right" size={14} style={{ color: "rgba(255,255,255,0.4)", marginLeft: "auto" }} />
          </button>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
            <Icon name="logout" size={18} style={{ color: "rgba(255,255,255,0.5)" }} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

function BottomNav({ currentPath, onNavigate }) {
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: CARD, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 62 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath.startsWith(item.path);
        return (
          <button key={item.label} type="button" onClick={() => onNavigate(item.path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: isActive ? C.primaryContainer : C.onSurfaceVariant, fontFamily: MONO, fontSize: 9, fontWeight: isActive ? 700 : 400, borderTop: isActive ? `2px solid ${C.primaryContainer}` : "2px solid transparent" }}>
            <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ search, setSearch, onNew, onMenu, isMobile, roleLabel, initials, onProfileNavigate }) {
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 24px", position: "sticky", top: 0, zIndex: 40, background: "color-mix(in srgb, var(--color-background) 94%, transparent)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 10 }}>
      {isMobile && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.onSurface, display: "flex", flexShrink: 0 }}>
          <Icon name="menu" size={24} />
        </button>
      )}
      <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 360, position: "relative" }}>
        <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests…"
          style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: C.surfaceContainerLow, border: "none", borderRadius: 99, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {!isMobile && (
          <span style={{ padding: "3px 10px", borderRadius: 99, background: C.primaryContainer, color: C.white, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>{roleLabel}</span>
        )}
        <button onClick={onNew} style={{
          background: C.primaryContainer, color: C.white, border: "none", cursor: "pointer",
          padding: isMobile ? "7px 12px" : "8px 18px", borderRadius: 99,
          fontSize: isMobile ? 11 : 12, fontWeight: 700, fontFamily: MONO,
          display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
        }}>
          <Icon name="add" size={16} style={{ color: C.white }} />
          {isMobile ? "New" : "New Request"}
        </button>
        <button onClick={onProfileNavigate} style={{ width: 34, height: 34, borderRadius: "50%", background: C.primaryFixedDim, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#4a0404", fontSize: 13, flexShrink: 0, border: "none", cursor: "pointer" }}>
          {initials}
        </button>
      </div>
    </header>
  );
}

// ─── Shared monitor-select hook ───────────────────────────────────────────────
// HOD sees only staff in their own department; Dean sees all staff.
function useStaffOptions(requesterRole, requesterDepartment) {
  const [staffOptions, setStaffOptions] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingStaff(true);
      try {
        let query = supabase
          .from("profiles")
          .select("id, full_name, department")
          .eq("role", "staff")
          .eq("status", "Active")
          .order("full_name");

        if (requesterRole === "hod" && requesterDepartment) {
          query = query.eq("department", requesterDepartment);
        }

        const { data, error } = await query;
        if (error) throw error;
        setStaffOptions(data ?? []);
      } catch (err) {
        console.error("Failed to load staff list:", err);
        setStaffOptions([]);
      } finally { setLoadingStaff(false); }
    })();
  }, [requesterRole, requesterDepartment]);

  return { staffOptions, loadingStaff };
}

// ─── Submit Modal ─────────────────────────────────────────────────────────────
function SubmitModal({ onClose, onSubmitted, userId }) {
  const { profile } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { staffOptions, loadingStaff } = useStaffOptions(profile?.role, profile?.department);
  const [monitorId, setMonitorId] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit() {
    if (!form.title.trim() || !form.location.trim()) { setError("Title and Location are required."); return; }
    if (!monitorId) { setError("Please assign a staff monitor to review this request."); return; }
    if (!userId) { setError("You must be logged in to submit a request."); return; }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
        status: "Pending Monitor Approval",
        monitor_id: monitorId,
        location: form.location.trim(),
        department: form.department.trim() || null,
        created_by: userId,
      };

      const { data, error: insertError } = await supabase.from("requests").insert(payload).select().single();

      if (insertError) { setError(insertError.message); return; }

      onSubmit ? onSubmit(data) : onSubmitted(data);
      onClose();
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inp = { width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: CARD, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(520px, 95vw)", background: CARD, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>New Facility Request</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onSurfaceVariant }}>Report a maintenance or facility issue on campus</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}><Icon name="close" size={20} /></button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "58vh", overflowY: "auto" }}>
          {error && <div style={{ padding: "9px 12px", background: C.errorContainer, color: C.onErrorContainer, borderRadius: 8, fontSize: 13 }}>{error}</div>}
          <div><label style={lbl}>Issue Title *</label><input value={form.title} onChange={set("title")} placeholder="e.g. HVAC fault in lecture hall" style={inp} /></div>
          <div><label style={lbl}>Location *</label><input value={form.location} onChange={set("location")} placeholder="e.g. Engineering Building, Room 204" style={inp} /></div>
          <div><label style={lbl}>Department</label><input value={form.department} onChange={set("department")} placeholder="e.g. Faculty of Engineering" style={inp} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={lbl}>Category</label><select value={form.category} onChange={set("category")} style={{ ...inp, cursor: "pointer" }}>{Object.keys(CATEGORY_ICONS).map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label style={lbl}>Priority</label><select value={form.priority} onChange={set("priority")} style={{ ...inp, cursor: "pointer" }}>{["Emergency","High","Medium","Low"].map((p) => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label style={lbl}>Description</label><textarea value={form.description} onChange={set("description")} placeholder="Describe the issue in detail…" rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} /></div>
          <div>
            <label style={lbl}>Assign Monitor (Staff) *</label>
            <select value={monitorId} onChange={(e) => setMonitorId(e.target.value)} style={{ ...inp, cursor: "pointer" }} disabled={loadingStaff}>
              <option value="">{loadingStaff ? "Loading staff…" : "Select a staff member…"}</option>
              {staffOptions.map((s) => <option key={s.id} value={s.id}>{s.full_name}{s.department ? ` — ${s.department}` : ""}</option>)}
            </select>
            {profile?.role === "hod" && (
              <p style={{ margin: "4px 0 0", fontSize: 11, color: C.onSurfaceVariant }}>Showing staff in your department only.</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
            <Icon name="info" size={16} style={{ color: C.onSurfaceVariant, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 12, color: C.onSurfaceVariant, lineHeight: 1.5 }}>Your assigned staff monitor reviews this first. Once approved, the admin assigns a technician.</p>
          </div>
        </div>
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

// ─── Resubmit Modal ───────────────────────────────────────────────────────────
function ResubmitModal({ req, onClose, onResubmitted }) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    title: req.title, location: req.location, department: req.department,
    category: req.category, priority: req.priority, description: req.description,
  });
  const [monitorId, setMonitorId] = useState(req.monitorId || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { staffOptions, loadingStaff } = useStaffOptions(profile?.role, profile?.department);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleResubmit() {
    if (!form.title.trim() || !form.location.trim()) { setError("Title and Location are required."); return; }
    if (!monitorId) { setError("Please assign a staff monitor to review this request."); return; }

    setSubmitting(true);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("requests")
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          priority: form.priority,
          location: form.location.trim(),
          department: form.department.trim() || null,
          monitor_id: monitorId,
          status: "Pending Monitor Approval",
          monitor_rejection_reason: null,
          monitor_reviewed_at: null,
        })
        .eq("id", req.id)
        .eq("created_by", user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: monitorId,
        type: "NewRequest",
        title: "Revised Request Needs Review",
        body: `"${form.title.trim()}" was updated and resubmitted after a rejection. Please review it again.`,
        read: false,
      });
      if (notifError) console.error("Notification insert failed:", notifError.message);

      onResubmitted(data);
      onClose();
    } catch (err) {
      console.error("Resubmit error:", err);
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inp = { width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: CARD, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(520px,95vw)", background: CARD, borderRadius: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.22)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.errorContainer, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onErrorContainer }}>Edit & Resubmit</h3>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onErrorContainer }}>Address the monitor's feedback below, then resubmit for review.</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onErrorContainer, display: "flex" }}><Icon name="close" size={20} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "58vh", overflowY: "auto" }}>
          {error && <div style={{ padding: "9px 12px", background: C.errorContainer, color: C.onErrorContainer, borderRadius: 8, fontSize: 13 }}>{error}</div>}

          <div style={{ padding: "12px 14px", background: C.errorContainer, borderRadius: 8, border: `1px solid color-mix(in srgb, ${C.error} 20%, transparent)` }}>
            <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onErrorContainer, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Monitor's Rejection Reason</p>
            <p style={{ margin: 0, fontSize: 13, color: C.onErrorContainer, lineHeight: 1.5 }}>{req.monitorRejectionReason || "No reason was provided."}</p>
          </div>

          <div><label style={lbl}>Issue Title *</label><input value={form.title} onChange={set("title")} style={inp} /></div>
          <div><label style={lbl}>Location *</label><input value={form.location} onChange={set("location")} style={inp} /></div>
          <div><label style={lbl}>Department</label><input value={form.department} onChange={set("department")} style={inp} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={lbl}>Category</label><select value={form.category} onChange={set("category")} style={{ ...inp, cursor: "pointer" }}>{Object.keys(CATEGORY_ICONS).map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label style={lbl}>Priority</label><select value={form.priority} onChange={set("priority")} style={{ ...inp, cursor: "pointer" }}>{["Emergency","High","Medium","Low"].map((p) => <option key={p}>{p}</option>)}</select></div>
          </div>
          <div><label style={lbl}>Description</label><textarea value={form.description} onChange={set("description")} rows={3} style={{ ...inp, resize: "vertical", lineHeight: 1.6 }} /></div>
          <div>
            <label style={lbl}>Assign Monitor (Staff) *</label>
            <select value={monitorId} onChange={(e) => setMonitorId(e.target.value)} style={{ ...inp, cursor: "pointer" }} disabled={loadingStaff}>
              <option value="">{loadingStaff ? "Loading staff…" : "Select a staff member…"}</option>
              {staffOptions.map((s) => <option key={s.id} value={s.id}>{s.full_name}{s.department ? ` — ${s.department}` : ""}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} style={{ padding: "9px 20px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button onClick={handleResubmit} disabled={submitting} style={{ padding: "9px 22px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, opacity: submitting ? 0.7 : 1 }}>
            <Icon name="send" size={14} style={{ color: C.white }} />
            {submitting ? "Resubmitting…" : "Resubmit for Review"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Add Note Modal ───────────────────────────────────────────────────────────
function AddNoteModal({ onClose, onSave }) {
  const [note, setNote] = useState("");
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(440px,95vw)", background: CARD, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface }}>Add a Note</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add additional context or an update to this request…" rows={4} autoFocus
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 10, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: C.surfaceContainerLow, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} style={{ padding: "8px 18px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button onClick={() => { if (note.trim()) { onSave(note.trim()); onClose(); } }} disabled={!note.trim()} style={{ padding: "8px 18px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: note.trim() ? "pointer" : "not-allowed", fontSize: 12, fontFamily: MONO, fontWeight: 700, opacity: note.trim() ? 1 : 0.5 }}>
            Save Note
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ req, onClose, onConfirm }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(400px,95vw)", background: CARD, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.errorContainer, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Icon name="delete" size={22} style={{ color: C.error }} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.onSurface }}>Delete Request?</h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
            This will permanently delete <strong>{req?.id?.toString().slice(0,8)}</strong>. This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px 0", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: "10px 0", background: C.error, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: MONO, fontWeight: 700 }}>Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Request List Card ────────────────────────────────────────────────────────
function RequestCard({ req, isActive, onClick }) {
  const sc = STATUS_CFG[req.status] || STATUS_CFG.Pending;
  const pc = PRIORITY_CFG[req.priority] || PRIORITY_CFG.Medium;
  const [hov, setHov] = useState(false);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: CARD, borderRadius: 14, padding: "18px 20px",
        cursor: "pointer", position: "relative", overflow: "hidden",
        border: isActive ? `2px solid ${C.primaryContainer}` : `1px solid ${C.outlineVariant}`,
        boxShadow: (isActive || hov) ? "0 4px 14px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.15s",
      }}
    >
      {isActive && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: C.primaryContainer, borderRadius: "14px 0 0 14px" }} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, paddingLeft: isActive ? 4 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={CATEGORY_ICONS[req.category] || "build"} size={22} style={{ color: C.primaryContainer }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant }}>{req.id?.toString().slice(0, 8)}</p>
            <h3 style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: isActive ? C.primaryContainer : C.onSurface, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</h3>
          </div>
        </div>
        <span style={{ padding: "3px 9px", borderRadius: 99, background: sc.bg, color: sc.text, fontSize: 10, fontWeight: 700, fontFamily: MONO, flexShrink: 0, marginLeft: 8 }}>{req.status}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: isActive ? 4 : 0, flexWrap: "wrap", gap: 6 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ padding: "2px 8px", borderRadius: 4, background: pc.bg, color: pc.text, fontSize: 10, fontWeight: 700, fontFamily: MONO }}>{req.priority}</span>
          <span style={{ fontSize: 12, color: C.onSurfaceVariant, display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="location_on" size={13} style={{ color: C.outline }} />
            {req.location}
          </span>
        </div>
        <span style={{ fontSize: 11, fontFamily: MONO, color: C.outline }}>{req.date}</span>
      </div>
    </div>
  );
}

// ─── Request Detail Panel ─────────────────────────────────────────────────────
function DetailPanel({ req, onDelete, onAddNote, onResubmit, isMobile, onClose }) {
  if (!req) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: CARD, borderRadius: 14, border: `1px solid ${C.outlineVariant}`, color: C.onSurfaceVariant }}>
      <Icon name="touch_app" size={44} style={{ color: C.outlineVariant, display: "block", marginBottom: 12 }} />
      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>Select a request</p>
      <p style={{ margin: "6px 0 0", fontSize: 13, textAlign: "center" }}>Click any request on the left to see its full details and progress here.</p>
    </div>
  );

  const sc = STATUS_CFG[req.status] || STATUS_CFG.Pending;
  const pc = PRIORITY_CFG[req.priority] || PRIORITY_CFG.Medium;
  const canDelete  = req.status === "Pending" || req.status === "Pending Monitor Approval";
  const isRejected = req.status === "Rejected by Monitor";

  const wrapper = isMobile ? {
    position: "fixed", inset: 0, background: CARD, zIndex: 90,
    display: "flex", flexDirection: "column", overflowY: "auto",
  } : {
    flex: 1, background: CARD, borderRadius: 14, border: `1px solid ${C.outlineVariant}`,
    display: "flex", flexDirection: "column", overflowY: "auto", minWidth: 0,
  };

  return (
    <div style={wrapper}>
      {isMobile && (
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", alignItems: "center", gap: 8, position: "sticky", top: 0, zIndex: 5 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: C.primaryContainer, fontWeight: 700, fontSize: 13, fontFamily: MONO, padding: 0 }}>
            <Icon name="arrow_back" size={20} style={{ color: C.primaryContainer }} />
            Back to list
          </button>
        </div>
      )}

      <div style={{ padding: "24px 28px 20px", borderBottom: `1px solid ${C.outlineVariant}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ padding: "3px 10px", borderRadius: 99, background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>{req.status}</span>
              <span style={{ padding: "3px 10px", borderRadius: 4, background: pc.bg, color: pc.text, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>{req.priority}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={CATEGORY_ICONS[req.category] || "build"} size={24} style={{ color: C.primaryContainer }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontFamily: MONO, color: C.onSurfaceVariant }}>{req.id?.toString().slice(0, 8)} · {req.category}</p>
                <h2 style={{ margin: "3px 0 0", fontSize: 18, fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>{req.title}</h2>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
          {[
            { icon: "location_on",    label: "Location",    value: req.location || "—" },
            { icon: "calendar_today", label: "Filed On",    value: req.date            },
            { icon: "engineering",    label: "Assigned To", value: req.assignedTo || "Not yet assigned" },
            { icon: "domain",         label: "Department",  value: req.department || "—" },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ background: C.surfaceContainerLow, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <Icon name={icon} size={14} style={{ color: C.onSurfaceVariant }} />
                <span style={{ fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.onSurface }}>{value}</p>
            </div>
          ))}
        </div>

        {req.description && (
          <div style={{ marginTop: 14, padding: "12px 14px", background: C.surfaceContainerLow, borderRadius: 8, border: `1px solid ${C.outlineVariant}` }}>
            <p style={{ margin: 0, fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Description</p>
            <p style={{ margin: 0, fontSize: 14, color: C.onSurface, lineHeight: 1.6 }}>{req.description}</p>
          </div>
        )}

        {isRejected && (
          <div style={{ marginTop: 14, padding: "14px 16px", background: C.errorContainer, borderRadius: 10, border: `1px solid color-mix(in srgb, ${C.error} 20%, transparent)`, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="cancel" size={18} filled style={{ color: C.onErrorContainer }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.onErrorContainer }}>Your monitor rejected this request</p>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.onErrorContainer, lineHeight: 1.5 }}>{req.monitorRejectionReason || "No specific reason was given."}</p>
            <button onClick={onResubmit} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: C.error, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
              <Icon name="edit" size={15} style={{ color: C.white }} />
              Edit & Resubmit
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "22px 28px", flex: 1, overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.onSurface }}>Request Progress</h3>
          <button onClick={onAddNote} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: C.surfaceContainerHigh, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontFamily: MONO, color: C.onSurface, fontWeight: 700 }}>
            <Icon name="note_add" size={15} />
            Add Note
          </button>
        </div>

        {!req.timeline || req.timeline.length === 0 ? (
          <p style={{ fontSize: 13, color: C.onSurfaceVariant, fontStyle: "italic" }}>No timeline updates yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {req.timeline.map((step, i) => {
              const isDone   = step.state === "done";
              const isActive = step.state === "active";
              const isNote   = step.state === "note";
              const dotBg     = isDone ? C.secondary : isActive ? "#f59e0b" : isNote ? C.primaryContainer : C.surfaceContainerHigh;
              const dotBorder = isDone ? C.secondary : isActive ? "#f59e0b" : isNote ? C.primaryContainer : C.outlineVariant;

              return (
                <div key={i} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: i < req.timeline.length - 1 ? 22 : 0 }}>
                  {i < req.timeline.length - 1 && <div style={{ position: "absolute", left: 11, top: 26, bottom: 0, width: 2, background: isDone ? C.secondary : C.surfaceContainerHigh }} />}
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: dotBg, border: `2px solid ${dotBorder}`, boxShadow: isActive ? "0 0 0 4px #fef3c7" : "none" }}>
                    {isDone && <Icon name="check" size={13} style={{ color: C.white }} />}
                    {isNote && <Icon name="notes" size={12} style={{ color: C.white }} />}
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.white }} />}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isDone || isNote ? C.onSurface : isActive ? "#b45309" : C.onSurfaceVariant }}>{step.label}</p>
                      <span style={{ fontSize: 10, fontFamily: MONO, color: C.outline, flexShrink: 0 }}>{step.time}</span>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: 13, color: C.onSurfaceVariant, lineHeight: 1.5 }}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
          {canDelete && (
            <button onClick={() => onDelete(req)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.errorContainer, color: C.onErrorContainer, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
              <Icon name="delete" size={15} style={{ color: C.onErrorContainer }} />
              Delete
            </button>
          )}
          {isRejected && (
            <button onClick={onResubmit} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
              <Icon name="edit" size={15} style={{ color: C.white }} />
              Edit & Resubmit
            </button>
          )}
          {!canDelete && !isRejected && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, fontSize: 12, fontFamily: MONO, color: C.onSurfaceVariant }}>
              <Icon name="info" size={14} />
              {req.status === "Completed" ? "Request resolved" : "Admin is handling this"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RequesterMyRequests() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, profile } = useAuth();

  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [search,       setSearch]    = useState("");
  const [tab,          setTab]       = useState("All");
  const [sortDesc,     setSortDesc]  = useState(true);
  const [showNew,      setShowNew]   = useState(false);
  const [showNote,     setShowNote]  = useState(false);
  const [resubmitTarget, setResubmitTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeReq,    setActiveReq] = useState(null);
  const [showDetail,   setShowDetail]= useState(false);
  const [toast,        setToast]     = useState(null);
  const [loading,      setLoading]   = useState(true);
  const [requests,     setRequests]  = useState([]);

  const firstName = profile?.full_name?.split(" ")[0] || "Requester";
  const initials  = (profile?.full_name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABEL[profile?.role] ?? "Requester";

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2500); }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) { console.error("Fetch error:", error.message); showToast("Failed to load your requests."); return; }

      const formatted = (data || []).map(formatRequest);
      setRequests(formatted);
      setActiveReq((prev) => prev ? formatted.find((r) => r.id === prev.id) ?? formatted[0] ?? null : formatted[0] ?? null);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("requester-own-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests", filter: `created_by=eq.${user.id}` }, () => fetchAll())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user, fetchAll]);

  function handleSubmit(savedRow) {
    const formatted = formatRequest(savedRow);
    setRequests((p) => [formatted, ...p]);
    setActiveReq(formatted);
    setTab("All");
    showToast("Request submitted successfully.");
  }

  function handleResubmitted(savedRow) {
    const formatted = formatRequest(savedRow);
    setRequests((prev) => prev.map((r) => r.id === formatted.id ? formatted : r));
    setActiveReq(formatted);
    showToast("Request resubmitted for monitor review.");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("requests").delete().eq("id", deleteTarget.id).eq("created_by", user.id);
      if (error) throw error;

      const remaining = requests.filter((r) => r.id !== deleteTarget.id);
      setRequests(remaining);
      if (activeReq?.id === deleteTarget.id) { setActiveReq(remaining[0] ?? null); setShowDetail(false); }
      showToast("Request deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete request.");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleAddNote(note) {
    if (!activeReq) return;
    const timestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const newStep = { label: "Note Added", desc: note, time: timestamp, state: "note" };
    setRequests((prev) => prev.map((r) => r.id === activeReq.id ? { ...r, timeline: [...(r.timeline || []), newStep] } : r));
    setActiveReq((prev) => ({ ...prev, timeline: [...(prev.timeline || []), newStep] }));
    showToast("Note added.");
  }

  const go = useCallback((path) => navigate(path), [navigate]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests
      .filter((r) =>
        (tab === "All" || r.status === tab || (tab === "Emergency" && r.priority === "Emergency")) &&
        ([r.title, r.location, r.id?.toString()].some((f) => f?.toString().toLowerCase().includes(q)))
      )
      .sort((a, b) => sortDesc ? (b.id > a.id ? 1 : -1) : (a.id > b.id ? 1 : -1));
  }, [requests, tab, search, sortDesc]);

  return (
    <div style={{ background: C.surface, minHeight: "100vh", fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}} *{box-sizing:border-box}`}</style>

      {!isMobile && (
        <Sidebar currentPath={location.pathname} onNavigate={go} onLogout={handleLogout} firstName={firstName} roleLabel={roleLabel} initials={initials} />
      )}
      {isMobile && (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} currentPath={location.pathname} onNavigate={go} onLogout={handleLogout} firstName={firstName} roleLabel={roleLabel} initials={initials} />
      )}

      <div style={{ marginLeft: isMobile ? 0 : 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar
          search={search} setSearch={setSearch}
          onNew={() => setShowNew(true)}
          onMenu={() => setDrawerOpen(true)}
          isMobile={isMobile}
          roleLabel={roleLabel}
          initials={initials}
          onProfileNavigate={() => go("/requester/profile")}
        />

        <main style={{ flex: 1, padding: isMobile ? "20px 14px 80px" : "32px", maxWidth: 1600, width: "100%", alignSelf: "center" }}>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.onSurface }}>My Requests</h1>
            <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant }}>Track and manage your reported infrastructure issues.</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: isMobile ? "nowrap" : "wrap", overflowX: isMobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", paddingBottom: isMobile ? 4 : 0 }}>
              {FILTER_TABS.map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "6px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                  fontFamily: MONO, border: "none", cursor: "pointer", transition: "all 0.15s",
                  background: tab === t ? C.primaryContainer : C.surfaceContainerHigh,
                  color: tab === t ? C.white : C.onSurfaceVariant,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>{t}</button>
              ))}
            </div>
            <button onClick={() => setSortDesc((p) => !p)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant, fontSize: 12, fontFamily: MONO, fontWeight: 700, flexShrink: 0 }}>
              <Icon name="filter_list" size={18} style={{ color: C.onSurfaceVariant }} />
              {sortDesc ? "Newest first" : "Oldest first"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1.2fr)", gap: 20, alignItems: "start" }}>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {loading ? (
                [1,2,3].map((i) => <div key={i} style={{ height: 100, background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 14, animation: "pulse 1.5s ease-in-out infinite" }} />)
              ) : filtered.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", background: CARD, borderRadius: 14, border: `1px solid ${C.outlineVariant}` }}>
                  <Icon name="inbox" size={44} style={{ color: C.outlineVariant, display: "block", margin: "0 auto 12px" }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.onSurface }}>No requests found</p>
                  <p style={{ margin: "6px 0 12px", fontSize: 13, color: C.onSurfaceVariant }}>
                    {search || tab !== "All" ? "Try adjusting your filters." : "Submit your first facility request."}
                  </p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    {(search || tab !== "All") && (
                      <button onClick={() => { setTab("All"); setSearch(""); }} style={{ padding: "7px 16px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>
                        Clear filters
                      </button>
                    )}
                    <button onClick={() => setShowNew(true)} style={{ padding: "7px 16px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700 }}>
                      New Request
                    </button>
                  </div>
                </div>
              ) : (
                filtered.map((req) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    isActive={activeReq?.id === req.id}
                    onClick={() => {
                      setActiveReq(req);
                      if (isMobile) setShowDetail(true);
                    }}
                  />
                ))
              )}
            </div>

            {!isMobile && (
              <div style={{ position: "sticky", top: 80 }}>
                <DetailPanel
                  req={activeReq}
                  onDelete={(r) => setDeleteTarget(r)}
                  onAddNote={() => setShowNote(true)}
                  onResubmit={() => setResubmitTarget(activeReq)}
                  isMobile={false}
                  onClose={() => {}}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {isMobile && !showDetail && <BottomNav currentPath={location.pathname} onNavigate={go} />}

      {isMobile && showDetail && activeReq && (
        <DetailPanel
          req={activeReq}
          onDelete={(r) => { setDeleteTarget(r); setShowDetail(false); }}
          onAddNote={() => setShowNote(true)}
          onResubmit={() => setResubmitTarget(activeReq)}
          isMobile={true}
          onClose={() => setShowDetail(false)}
        />
      )}

      {showNew        && <SubmitModal    onClose={() => setShowNew(false)}   onSubmitted={handleSubmit} userId={user?.id} />}
      {resubmitTarget && <ResubmitModal  req={resubmitTarget} onClose={() => setResubmitTarget(null)} onResubmitted={handleResubmitted} />}
      {showNote       && <AddNoteModal   onClose={() => setShowNote(false)}  onSave={handleAddNote} />}
      {deleteTarget   && <DeleteModal    req={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}

      <Toast msg={toast} />
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "var(--color-inverse-surface)", color: "var(--color-inverse-on-surface)", padding: "10px 22px", borderRadius: 99, fontSize: 13, fontFamily: SANS, fontWeight: 600, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
      {msg}
    </div>
  );
}