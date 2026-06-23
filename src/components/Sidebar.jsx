import { useNavigate } from "react-router-dom";

const navItems = [
  {
    icon: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
  },
  {
    icon: "list_alt",
    label: "Requests",
    path: "/admin/requests",
  },
  {
    icon: "engineering",
    label: "Job Orders",
    path: "/admin/job-orders",
  },
  {
    icon: "inventory_2",
    label: "Assets",
    path: "/admin/assets",
  },
  {
    icon: "group",
    label: "Users",
    path: "/admin/users",
  },
  {
    icon: "domain",
    label: "Departments",
    path: "/admin/departments",
  },
  {
    icon: "notifications",
    label: "Notifications",
    path: "/admin/notifications",
  },
];

export default function Sidebar({
  activeNav,
  setActiveNav,
}) {
  const navigate = useNavigate();

  return (
    <aside
      style={{
        width: 260,
        background: "#4a0404",
        color: "#fff",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
      }}
    >
      <div style={{ padding: 24 }}>
        <h2>AATU IMS</h2>
      </div>

      <nav>
        {navItems.map((item) => {
          const isActive =
            activeNav === item.label;

          return (
            <button
              key={item.label}
              onClick={() => {
                setActiveNav(item.label);
                navigate(item.path);
              }}
              style={{
                width: "100%",
                padding: "14px 24px",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                background: isActive
                  ? "rgba(255,255,255,0.1)"
                  : "transparent",
                color: "#fff",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}