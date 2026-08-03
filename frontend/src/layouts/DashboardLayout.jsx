import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import ThemeToggle from "../components/ThemeToggle";

const NAV_BY_ROLE = {
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/customers", label: "Customers", icon: "👥" },
    { to: "/policies", label: "Policies", icon: "📄" },
    { to: "/policies/expiring", label: "Expiring Policies", icon: "⏰" },
    { to: "/premiums", label: "Premiums", icon: "💰" },
    { to: "/claims", label: "Claims", icon: "📝" },
    { to: "/notifications", label: "Notifications", icon: "🔔" },
    { to: "/notifications/all", label: "All Notifications", icon: "📬" },
    { to: "/reports", label: "Reports", icon: "📈" },
    { to: "/audit-logs", label: "Audit Logs", icon: "🗂️" },
    { to: "/employees", label: "Employees", icon: "🧑‍💼" },
    { to: "/settings", label: "Settings", icon: "⚙️" },
  ],
  agent: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/customers", label: "Customers", icon: "👥" },
    { to: "/policies", label: "Policies", icon: "📄" },
    { to: "/policies/expiring", label: "Expiring Policies", icon: "⏰" },
    { to: "/premiums", label: "Premiums", icon: "💰" },
    { to: "/claims", label: "Claims", icon: "📝" },
    { to: "/notifications", label: "Notifications", icon: "🔔" },
    { to: "/notifications/all", label: "All Notifications", icon: "📬" },
    { to: "/reports", label: "Reports", icon: "📈" },
  ],
  customer: [
    { to: "/my-dashboard", label: "Dashboard", icon: "📊" },
    { to: "/my-profile", label: "My Profile", icon: "🙍" },
    { to: "/my-policies", label: "My Policies", icon: "📄" },
    { to: "/my-premiums", label: "My Premiums", icon: "💰" },
    { to: "/my-claims", label: "My Claims", icon: "📝" },
    { to: "/my-documents", label: "My Documents", icon: "📁" },
    { to: "/notifications", label: "Notifications", icon: "🔔" },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const links = NAV_BY_ROLE[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-offwhite">
      <aside className="w-64 shrink-0 border-r border-surface-border bg-surface">
        <div className="flex items-center gap-3 border-b border-surface-border px-6 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 font-heading text-sm font-bold text-white">
            IT
          </span>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight text-brand-700">InsureTrack</h1>
            <p className="text-xs text-brand-500">Management Platform</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg border-l-4 px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-transparent text-brand-800 hover:bg-brand-50"
                }`
              }
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-surface-border bg-surface px-6 py-4">
          <div>
            <p className="text-sm text-brand-500">Signed in as</p>
            <p className="font-semibold text-brand-900">
              {user?.name} <span className="text-xs uppercase text-brand-500">({user?.role})</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
