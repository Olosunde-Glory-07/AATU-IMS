import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:                "var(--color-on-surface)",
  primaryContainer:       "var(--color-primary-container)",
  onPrimaryContainer:     "var(--color-on-primary-container)",
  secondary:              "var(--color-secondary)",
  secondaryContainer:     "var(--color-secondary-container)",
  onSecondaryContainer:   "var(--color-on-secondary-container)",
  tertiaryFixed:          "var(--color-tertiary-fixed)",
  onTertiaryFixed:        "var(--color-on-tertiary-fixed)",
  errorContainer:         "var(--color-error-container)",
  onErrorContainer:       "var(--color-on-error-container)",
  error:                  "var(--color-error)",
  surface:                "var(--color-background)",
  surfaceContainer:       "var(--color-surface-container)",
  surfaceContainerLow:    "var(--color-surface-container-low)",
  surfaceContainerHigh:   "var(--color-surface-container-high)",
  surfaceContainerHighest:"var(--color-surface-container-highest)",
  surfaceDim:             "var(--color-surface-dim)",
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

const NAV_ITEMS = [
  { icon: "dashboard",     label: "Dashboard",     path: "/admin/dashboard"     },
  { icon: "list_alt",      label: "Requests",      path: "/admin/requests"      },
  { icon: "engineering",   label: "Job Orders",    path: "/admin/job-orders"    },
  { icon: "inventory_2",   label: "Assets",        path: "/admin/assets"        },
  { icon: "group",         label: "Users",         path: "/admin/users"         },
  { icon: "domain",        label: "Departments",   path: "/admin/departments"   },
  { icon: "notifications", label: "Notifications", path: "/admin/notifications" },
];

function Icon({ name, size = 22, filled = false, style = {} }) {
  return (
    <span className="material-symbols-outlined" style={{
      fontSize: size, lineHeight: 1, verticalAlign: "middle",
      fontVariationSettings: filled ? "'FILL' 1,'wght' 400" : "'FILL' 0,'wght' 400",
      ...style,
    }}>{name}</span>
  );
}

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
    <aside style={{ width: 260, background: SIDEBAR_BG, color: C.white, display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", borderRight: `1px solid ${C.outlineVariant}`, fontFamily: SANS }}>
      <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="account_balance" size={22} filled style={{ color: C.white }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.white }}>AATU</div>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontFamily: MONO }}>Infrastructure Mgmt</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4 }}>
            <Icon name="close" size={22} />
          </button>
        )}
      </div>
      <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.label} onClick={() => { navigate(item.path); if (isMobile) onClose(); }} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
              background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
              color: isActive ? C.white : "rgba(255,255,255,0.65)", fontWeight: isActive ? 700 : 400,
              borderLeft: isActive ? "4px solid #ffb4aa" : "4px solid transparent",
              border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, letterSpacing: "0.04em", fontFamily: MONO,
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
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button onClick={() => navigate("/admin/profile")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="account_circle" size={18} /> User Profile
        </button>
        <button onClick={() => supabase.auth.signOut().then(() => navigate("/login"))} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO }}>
          <Icon name="logout" size={18} /> Logout
        </button>
      </div>
    </aside>
  );

  if (!isMobile) return <div style={{ width: 260, height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 50 }}>{content}</div>;
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100 }} />
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 260, zIndex: 101, boxShadow: "4px 0 20px rgba(0,0,0,0.2)" }}>{content}</div>
    </>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 90, background: CARD, borderTop: `1px solid ${C.outlineVariant}`, display: "flex", height: 60 }}>
      {NAV_ITEMS.slice(0, 5).map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button key={item.label} onClick={() => navigate(item.path)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "none", border: "none", cursor: "pointer", color: isActive ? C.primaryContainer : C.onSurfaceVariant, fontSize: 9, fontFamily: MONO }}>
            <Icon name={item.icon} size={20} filled={isActive} style={{ color: isActive ? C.primaryContainer : C.onSurfaceVariant }} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ onMenuClick, search, setSearch, isMobile }) {
  const navigate = useNavigate();
  return (
    <header style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 32px", position: "sticky", top: 0, zIndex: 40, background: "color-mix(in srgb, var(--color-background) 92%, transparent)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.outlineVariant}`, fontFamily: SANS, gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        {isMobile && (
          <button onClick={onMenuClick} style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurface, padding: 4, display: "flex", flexShrink: 0 }}>
            <Icon name="menu" size={24} />
          </button>
        )}
        <div style={{ flex: 1, maxWidth: isMobile ? "100%" : 440, position: "relative" }}>
          <Icon name="search" size={18} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.onSurfaceVariant }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments…" style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 9, paddingBottom: 9, background: C.surfaceContainerLow, border: "none", borderRadius: 8, fontSize: 14, outline: "none", color: C.onSurface, boxSizing: "border-box", fontFamily: SANS }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button onClick={() => navigate("/admin/notifications")} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: C.onSurfaceVariant, display: "flex" }}>
          <Icon name="notifications" size={22} />
        </button>
      </div>
    </header>
  );
}

// ─── Department Card ──────────────────────────────────────────────────────────
function DeptCard({ dept, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onSelect(dept)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: CARD, border: `1px solid ${C.outlineVariant}`, borderRadius: 12, padding: 24, cursor: "pointer", boxShadow: hov ? "0 8px 28px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.04)", transform: hov ? "translateY(-2px)" : "none", transition: "box-shadow 0.2s, transform 0.18s", fontFamily: SANS }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="domain" size={24} filled style={{ color: C.primaryContainer }} />
        </div>
        {dept.faculty && (
          <span style={{ padding: "3px 10px", borderRadius: 5, background: C.surfaceContainerHigh, color: C.onSurfaceVariant, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>{dept.faculty}</span>
        )}
      </div>
      <h4 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 700, color: C.onSurface }}>{dept.name}</h4>
      <p style={{ margin: "0 0 16px", fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.06em" }}>{dept.code || "—"}</p>

      <div style={{ borderTop: `1px solid ${C.outlineVariant}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { icon: "person",       label: "HOD",      value: dept.hodName || "Not assigned" },
          { icon: "location_on",  label: "Location", value: dept.location || "—" },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Icon name={icon} size={18} style={{ color: C.primaryContainer, marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", opacity: 0.7 }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.onSurface }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.onSurfaceVariant, fontFamily: MONO }}>
          <Icon name="inventory_2" size={16} />
          {dept.assetCount} asset{dept.assetCount !== 1 ? "s" : ""}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onSelect(dept); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: C.primaryContainer, fontWeight: 700, fontSize: 12, fontFamily: MONO }}>
          View Details <Icon name="arrow_forward" size={14} style={{ color: C.primaryContainer }} />
        </button>
      </div>
    </div>
  );
}

function AddCard({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: C.surfaceContainerLow, border: `2px dashed ${hov ? C.primaryContainer : C.outlineVariant}`, borderRadius: 12, padding: 24,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: "pointer",
      transition: "border-color 0.18s, box-shadow 0.18s", boxShadow: hov ? "0 4px 16px rgba(74,4,4,0.10)" : "none", minHeight: 260, fontFamily: SANS,
    }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: hov ? C.primaryContainer : C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, transition: "background 0.18s" }}>
        <Icon name="add_business" size={28} style={{ color: hov ? C.white : C.onSurfaceVariant }} />
      </div>
      <h4 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.onSurfaceVariant }}>Create New</h4>
      <p style={{ margin: 0, fontSize: 14, color: C.onSurfaceVariant, maxWidth: 180, lineHeight: 1.5 }}>Add a new department to the university structure.</p>
    </div>
  );
}

// ─── Detail Drawer — includes live maintenance-grouped asset breakdown ───────
function DetailDrawer({ dept, onClose, onEdit, onDelete }) {
  const isMobile = useIsMobile();
  const [maintenanceGroups, setMaintenanceGroups] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  useEffect(() => {
    if (!dept) return;
    (async () => {
      setLoadingAssets(true);
      const { data, error } = await supabase
        .from("asset_overview")
        .select("maintenance_type, category_name")
        .eq("department_id", dept.id);

      if (error) { console.error("Asset overview fetch error:", error.message); setLoadingAssets(false); return; }

      const counts = {};
      (data ?? []).forEach((a) => { counts[a.maintenance_type] = (counts[a.maintenance_type] || 0) + 1; });
      setMaintenanceGroups(Object.entries(counts).sort((a, b) => b[1] - a[1]));
      setLoadingAssets(false);
    })();
  }, [dept?.id]);

  if (!dept) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.22)", zIndex: 100 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: isMobile ? "100%" : 440, background: CARD, zIndex: 101, boxShadow: "-6px 0 32px rgba(0,0,0,0.13)", display: "flex", flexDirection: "column", fontFamily: SANS, overflowY: "auto" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="domain" size={26} filled style={{ color: C.primaryContainer }} />
              </div>
              <div>
                {dept.faculty && <span style={{ padding: "3px 10px", borderRadius: 5, background: C.surfaceContainerHigh, color: C.onSurfaceVariant, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>{dept.faculty}</span>}
                <h2 style={{ margin: "6px 0 2px", fontSize: 20, fontWeight: 700, color: C.onSurface }}>{dept.name}</h2>
                <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.06em" }}>{dept.code || "—"}</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}>
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {[["HOD", dept.hodName || "Not assigned", "person"], ["Location", dept.location || "—", "location_on"]].map(([label, value, icon]) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={icon} size={18} style={{ color: C.primaryContainer }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.onSurface }}>{value}</div>
              </div>
            </div>
          ))}

          <div>
            <div style={{ fontSize: 10, color: C.onSurfaceVariant, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Assets by Maintenance Type
            </div>
            {loadingAssets ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[1, 2].map((i) => <div key={i} style={{ height: 44, background: C.surfaceContainerLow, borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />)}
              </div>
            ) : maintenanceGroups.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: C.onSurfaceVariant }}>No assets registered for this department yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {maintenanceGroups.map(([type, count]) => (
                  <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}`, borderRadius: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.onSurface }}>{type}</span>
                    <span style={{ padding: "2px 9px", borderRadius: 99, background: C.surfaceContainerHigh, color: C.onSurfaceVariant, fontSize: 11, fontWeight: 700, fontFamily: MONO }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", gap: 10 }}>
          <button onClick={() => onEdit(dept)} style={{ flex: 1, padding: "11px 16px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon name="edit" size={15} style={{ color: C.white }} />
            Edit Department
          </button>
          <button onClick={() => onDelete(dept.id)} style={{ padding: "11px 14px", background: C.errorContainer, color: C.onErrorContainer, border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: MONO, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="delete" size={15} style={{ color: C.onErrorContainer }} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Add / Edit Department Modal ──────────────────────────────────────────────
function DeptFormModal({ initial, onClose, onSave, saving }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(initial ?? { name: "", code: "", faculty: "", location: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const inp = { width: "100%", padding: "9px 12px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, fontSize: 14, fontFamily: SANS, color: C.onSurface, background: C.surfaceContainerLow, outline: "none", boxSizing: "border-box" };
  const lbl = { fontSize: 10, fontFamily: MONO, color: C.onSurfaceVariant, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 5 };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, maxWidth: "calc(100vw - 32px)", background: CARD, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.20)", zIndex: 201, fontFamily: SANS, overflow: "hidden", maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.outlineVariant}`, background: C.surfaceContainerLow, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.onSurface }}>{isEdit ? "Edit Department" : "Add Department"}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: C.onSurfaceVariant, display: "flex" }}><Icon name="close" size={20} /></button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div><label style={lbl}>Department Name *</label><input value={form.name} onChange={set("name")} placeholder="e.g. Physics" style={inp} /></div>
            <div><label style={lbl}>Dept. Code</label><input value={form.code} onChange={set("code")} placeholder="e.g. PHY-SCI-05" style={inp} /></div>
          </div>
          <div><label style={lbl}>Faculty</label><input value={form.faculty} onChange={set("faculty")} placeholder="e.g. Faculty of Science" style={inp} /></div>
          <div><label style={lbl}>Location</label><input value={form.location} onChange={set("location")} placeholder="e.g. Science Complex, Wing C" style={inp} /></div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "flex-end", gap: 10, background: C.surfaceContainerLow }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "9px 20px", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 12, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            style={{ padding: "9px 20px", background: form.name.trim() ? C.primaryContainer : C.outlineVariant, color: C.white, border: "none", borderRadius: 8, cursor: (saving || !form.name.trim()) ? "not-allowed" : "pointer", fontSize: 12, fontFamily: MONO, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1 }}
          >
            <Icon name={isEdit ? "save" : "add"} size={15} style={{ color: C.white }} />
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Department"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteConfirmModal({ dept, onClose, onConfirm, deleting }) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", zIndex: 200 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(400px,95vw)", background: CARD, borderRadius: 16, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", zIndex: 201, fontFamily: SANS, overflow: "hidden" }}>
        <div style={{ padding: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.errorContainer, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Icon name="warning" size={22} style={{ color: C.error }} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: C.onSurface }}>Delete Department?</h3>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: C.onSurfaceVariant, lineHeight: 1.6 }}>
            This will permanently delete <strong>{dept?.name}</strong> and unassign any linked assets. This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} disabled={deleting} style={{ flex: 1, padding: "10px 0", border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "none", cursor: "pointer", fontSize: 13, fontFamily: MONO, color: C.onSurface }}>Cancel</button>
            <button onClick={onConfirm} disabled={deleting} style={{ flex: 1, padding: "10px 0", background: C.error, color: C.white, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: MONO, fontWeight: 700, opacity: deleting ? 0.7 : 1 }}>
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDepartmentsPage() {
  const isMobile = useIsMobile();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(null);
  const [adding, setAdding]         = useState(false);
  const [editing, setEditing]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [toast, setToast]           = useState(null);

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      // departments joined with HOD name and a live asset count
      const { data, error } = await supabase
        .from("departments")
        .select(`
          id, name, code, faculty, location, created_at,
          hod:profiles!departments_hod_id_fkey ( full_name ),
          assets ( count )
        `)
        .order("name");

      if (error) throw error;

      setDepartments((data ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        faculty: d.faculty,
        location: d.location,
        hodName: d.hod?.full_name ?? null,
        assetCount: d.assets?.[0]?.count ?? 0,
      })));
    } catch (err) {
      console.error("Departments fetch error:", err);
      showToast(`Failed to load departments: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return departments.filter((d) => !q || [d.name, d.code, d.faculty, d.hodName, d.location].some((f) => f?.toLowerCase().includes(q)));
  }, [departments, search]);

  async function handleAdd(form) {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert({ name: form.name.trim(), code: form.code.trim() || null, faculty: form.faculty.trim() || null, location: form.location.trim() || null })
        .select()
        .single();
      if (error) throw error;
      setAdding(false);
      await fetchDepartments();
      showToast(`${data.name} added.`);
    } catch (err) {
      console.error("Add department error:", err);
      showToast(`Failed to add department: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(form) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("departments")
        .update({ name: form.name.trim(), code: form.code.trim() || null, faculty: form.faculty.trim() || null, location: form.location.trim() || null })
        .eq("id", editing.id);
      if (error) throw error;
      setEditing(null);
      setSelected(null);
      await fetchDepartments();
      showToast(`${form.name} updated.`);
    } catch (err) {
      console.error("Edit department error:", err);
      showToast(`Failed to update department: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("departments").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setDeleteTarget(null);
      setSelected(null);
      await fetchDepartments();
      showToast(`${deleteTarget.name} removed.`);
    } catch (err) {
      console.error("Delete department error:", err);
      showToast(`Failed to delete: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  }

  const totalMembers = departments.reduce((sum, d) => sum + (d.assetCount || 0), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.surface, fontFamily: SANS, color: C.onSurface }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main style={{ marginLeft: isMobile ? 0 : 260, flex: 1, display: "flex", flexDirection: "column", paddingBottom: isMobile ? 60 : 0, minWidth: 0 }}>
        <TopBar onMenuClick={() => setDrawerOpen(true)} search={search} setSearch={setSearch} isMobile={isMobile} />

        <div style={{ flex: 1, padding: isMobile ? "20px 16px" : 32, maxWidth: 1600, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "flex-end", flexDirection: isMobile ? "column" : "row", gap: 16, marginBottom: isMobile ? 20 : 32 }}>
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: isMobile ? 22 : 28, fontWeight: 700 }}>Departments</h2>
              <p style={{ margin: 0, fontSize: isMobile ? 13 : 15, color: C.onSurfaceVariant, maxWidth: 600, lineHeight: 1.6 }}>
                Manage academic and administrative departments, and track their assets.
              </p>
            </div>
            <button onClick={() => setAdding(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", background: C.primaryContainer, color: C.white, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: SANS, boxShadow: "0 2px 10px rgba(74,4,4,0.25)", width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
              <Icon name="add" size={18} style={{ color: C.white }} />
              Add Department
            </button>
          </div>

          <div style={{ position: "relative", width: "100%", height: isMobile ? 140 : 180, borderRadius: 16, overflow: "hidden", marginBottom: isMobile ? 20 : 32, border: `1px solid ${C.outlineVariant}`, background: "linear-gradient(135deg, #4a0404 0%, #7e2b23 60%, #a03c34 100%)" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(33,0,0,0.75) 0%, rgba(33,0,0,0.15) 60%, transparent 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: isMobile ? 20 : 32 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: isMobile ? 17 : 20, fontWeight: 700, color: "#ffffff" }}>Campus Department Directory</h3>
              <p style={{ margin: 0, fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.8)" }}>
                {loading ? "Loading…" : `${departments.length} department${departments.length !== 1 ? "s" : ""} · ${totalMembers} total asset${totalMembers !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: isMobile ? 16 : 24 }}>
              {[1, 2, 3].map((i) => <div key={i} style={{ height: 280, background: C.surfaceContainerLow, borderRadius: 12, animation: "pulse 1.5s ease-in-out infinite" }} />)}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: isMobile ? 16 : 24 }}>
              {filtered.map((dept) => <DeptCard key={dept.id} dept={dept} onSelect={setSelected} />)}
              {!search && <AddCard onClick={() => setAdding(true)} />}
              {search && filtered.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 48, color: C.onSurfaceVariant }}>
                  No departments match "{search}".
                </div>
              )}
              {!search && departments.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 24, color: C.onSurfaceVariant, fontSize: 13 }}>
                  No departments yet — click "Create New" to add your first one.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {isMobile && <BottomNav />}

      {selected && <DetailDrawer dept={selected} onClose={() => setSelected(null)} onEdit={(d) => { setEditing(d); setSelected(null); }} onDelete={(id) => { setDeleteTarget(selected); }} />}
      {adding && <DeptFormModal onClose={() => setAdding(false)} onSave={handleAdd} saving={saving} />}
      {editing && <DeptFormModal initial={editing} onClose={() => setEditing(null)} onSave={handleSaveEdit} saving={saving} />}
      {deleteTarget && <DeleteConfirmModal dept={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />}

      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 76 : 24, left: "50%", transform: "translateX(-50%)", background: "var(--color-inverse-surface)", color: "var(--color-inverse-on-surface)", padding: "12px 24px", borderRadius: 30, fontSize: 13, fontFamily: MONO, zIndex: 300, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxWidth: "90vw", textAlign: "center" }}>
          {toast}
        </div>
      )}
    </div>
  );
}