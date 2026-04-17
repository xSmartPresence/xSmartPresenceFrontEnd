import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState , useEffect} from "react";
import {
  Home,
  ClipboardCheck,
  Menu,
  UserCircle2,
  Timer,
  BarChart3,
  Fingerprint,
  ShieldAlert,
  Sliders,
  DoorOpen
} from "lucide-react";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

   const sidebarItems = [
  { name: "Dashboard",        path: "/dashboard", icon: <Home size={18} />,        roles: ["admin", "hr", "super_admin"] },
  { name: "Attendance",       path: "/attendance", icon: <ClipboardCheck size={18} />, roles: ["admin", "hr", "super_admin"] },
  { name: "Employees",        path: "/employees", icon: <UserCircle2 size={18} />,  roles: ["admin", "hr", "super_admin"] },
  { name: "Shifts & Depts",   path: "/shifts",    icon: <Timer size={18} />,        roles: ["admin", "super_admin"] },
  { name: "Reports",          path: "/reports",   icon: <BarChart3 size={18} />,    roles: ["admin", "hr", "super_admin"] },
  { name: "Recognition Logs", path: "/logs",      icon: <Fingerprint size={18} />,  roles: ["admin", "super_admin"] },
  { name: "Anomalies",        path: "/anomalies", icon: <ShieldAlert size={18} />,  roles: ["admin", "super_admin"] },
  { name: "Settings",         path: "/settings",  icon: <Sliders size={18} />,      roles: ["super_admin"] },
];

 useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    navigate("/");
  }
  const savedRole = localStorage.getItem("role") || "admin";
  setRole(savedRole);
 }, []);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 h-screen bg-slate-900 text-white
          flex flex-col transition-all duration-300 z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "md:w-[70px]" : "md:w-[260px]"}
           w-[260px]
        `}
      >
        {/* HEADER */}
    <div className="flex items-center gap-3 px-4 py-6 border-b border-white/20">
  <div className="bg-white p-1.5 rounded-lg flex-shrink-0">
    <svg width="22" height="22" viewBox="0 0 100 100" fill="none" className="text-gray-800">
      <circle cx="50" cy="38" r="18" fill="currentColor" />
      <path d="M25 80C25 65 75 65 75 80V85H25V80Z" fill="currentColor" />
      <line x1="25" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="3" />
      <path d="M10 25V10H25" stroke="currentColor" strokeWidth="4" />
      <path d="M75 10H90V25" stroke="currentColor" strokeWidth="4" />
      <path d="M10 75V90H25" stroke="currentColor" strokeWidth="4" />
      <path d="M75 90H90V75" stroke="currentColor" strokeWidth="4" />
    </svg>
  </div>
  {!collapsed && (
    <h3 className="text-lg font-semibold">SmartPresence</h3>
  )}
</div>

        {/* MENU */}
        <div className="flex-1 px-4 pt-4 space-y-1 overflow-y-auto">
          {sidebarItems.filter(item => item.roles.includes(role)).map((item) => (
            <div
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition
                ${
                 location.pathname.startsWith(item.path)
                    ? "bg-slate-800"
                    : "hover:bg-slate-800"
                }
              `}
            >
              {item.icon}
              {!collapsed && item.name}
            </div>
          ))}
        </div>

        {/* LOGOUT */}
        <div className="px-4 py-4 border-t border-white/20">
          <div
           onClick={() => {
               const confirm = window.confirm("Are you sure you want to logout?");
               if (confirm) {
                   localStorage.removeItem("token");
                   localStorage.removeItem("role");  
                   navigate("/");
               }
           }}
            className="flex items-center gap-3 px-3 py-2 hover:bg-red-900 rounded-lg cursor-pointer transition"
          >
            <DoorOpen size={18} />
            {!collapsed && "Logout"}
          </div>
        </div>

      </div>

      {/* MAIN CONTENT */}
      <div
        className={`
          flex-1 bg-gray-100 p-6 transition-all duration-300
          h-screen overflow-y-auto
          ml-0
          ${collapsed ? "md:ml-[70px]" : "md:ml-[260px]"}
        `}
      >
        <Menu
          size={22}
          className="cursor-pointer mb-4"
          onClick={() => {
            if (window.innerWidth < 768) {
              setMobileOpen(!mobileOpen);
            } else {
              setCollapsed(!collapsed);
            }
          }}
        />

        <Outlet />
      </div>

    </div>
  );
};

export default Layout;