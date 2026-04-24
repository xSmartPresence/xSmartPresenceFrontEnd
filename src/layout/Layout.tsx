import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
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
  DoorOpen,
} from "lucide-react";

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const role = (localStorage.getItem("role") ?? "admin")
    .toLowerCase()
    .replace(/ /g, "_");

const userEmail = localStorage.getItem("email") ?? "";
const userName = localStorage.getItem("name") ?? "";
const displayName = userName || userEmail; // show email if no name

const rawEmail = (localStorage.getItem("email") ?? "").trim();
const rawName  = (localStorage.getItem("name")  ?? "").trim();

const initials = rawName
  ? rawName.split(" ").filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2)
  : rawEmail
    ? rawEmail.split("@")[0].split(/[._\-+]/).filter(Boolean).map((w) => w[0]).join("").toUpperCase().slice(0, 2) || rawEmail[0].toUpperCase()
    : "?";

  // Derive display role label
  const roleLabel =
    role === "super_admin" ? "Super Admin" :
    role === "hr"          ? "HR"          :
                             "Admin";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  const sidebarItems = [
    { name: "Dashboard",        path: "/dashboard", icon: <Home size={18} />,           roles: ["admin", "hr", "super_admin"] },
    { name: "Attendance",       path: "/attendance", icon: <ClipboardCheck size={18} />, roles: ["admin", "hr", "super_admin"] },
    { name: "Employees",        path: "/employees", icon: <UserCircle2 size={18} />,     roles: ["admin", "hr", "super_admin"] },
    { name: "Shifts & Depts",   path: "/shifts",    icon: <Timer size={18} />,           roles: ["admin", "super_admin"] },
    { name: "Reports",          path: "/reports",   icon: <BarChart3 size={18} />,       roles: ["admin", "hr", "super_admin"] },
    { name: "Recognition Logs", path: "/logs",      icon: <Fingerprint size={18} />,     roles: ["admin", "super_admin"] },
    { name: "Anomalies",        path: "/anomalies", icon: <ShieldAlert size={18} />,     roles: ["admin", "super_admin"] },
    { name: "Settings",         path: "/settings",  icon: <Sliders size={18} />,         roles: ["super_admin"] },
  ];


  return (
    <div className="flex h-screen overflow-hidden">

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 h-screen bg-slate-900 text-white
          flex flex-col transition-all duration-300 z-50
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          xl:translate-x-0
          ${collapsed ? "xl:w-[70px]" : "xl:w-[230px]"}
          w-[230px]
        `}
      >
        {/* SIDEBAR HEADER */}
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
            <div>
              <h3 className="text-base font-semibold leading-tight">SmartPresence</h3>
              <p className="text-xs text-slate-400">by XSpine Tech</p>
            </div>
          )}
        </div>

        {/* MENU ITEMS */}
        <div className="flex-1 px-4 pt-4 space-y-1 overflow-y-auto">
          {sidebarItems.filter(item => item.roles.includes(role)).map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              className={`
                w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition
                ${location.pathname.startsWith(item.path) ? "bg-slate-700" : "hover:bg-slate-800"}
              `}
            >
              {item.icon}
              {!collapsed && <span className="text-sm">{item.name}</span>}
            </button>
          ))}
        </div>

        {/* LOGOUT */}
        <div className="px-4 py-4 border-t border-white/20">
          {!showLogoutConfirm ? (
            <div
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-red-900 rounded-lg cursor-pointer transition"
            >
              <DoorOpen size={18} />
              {!collapsed && <span className="text-sm">Logout</span>}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-white space-y-2">
              <p>Sure?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("role");
                    navigate("/");
                  }}
                  className="bg-red-600 px-2 py-1 rounded text-white"
                >Yes</button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="bg-slate-600 px-2 py-1 rounded text-white"
                >No</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div
        className={`
          flex-1 flex flex-col bg-gray-100 transition-all duration-300
          h-screen overflow-hidden
          ml-0
          ${collapsed ? "xl:ml-[70px]" : "xl:ml-[230px]"}
        `}
      >
        {/* ── TOP HEADER BAR ── */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">

          {/* LEFT: Hamburger */}
          <button
            onClick={() => {
              if (window.innerWidth < 1280) {
                setMobileOpen(!mobileOpen);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle sidebar"
          >
            <Menu size={22} className="text-gray-600" />
          </button>

        {/* RIGHT: User Info only */}
          <div className="flex items-center gap-2.5">
            {/* Avatar circle with initials */}
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>

            {/* Name + email */}
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-gray-800">{displayName}</p>
              {userName && <p className="text-xs text-gray-400">{userEmail}</p>}
            </div>

            {/* Role badge */}
            <span className="hidden md:inline-block text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
              {roleLabel}
            </span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </div>
      </div>

    </div>
  );
};

export default Layout;