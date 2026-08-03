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
      <aside className="w-64 shrink-0 bg-[color:var(--color-sidebar)]">
        <div className="flex items-center gap-3 border-b border-[color:var(--color-sidebar-border)] px-6 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 font-heading text-sm font-bold text-white">
            IT
          </span>
          <div>
            <h1 className="font-heading text-lg font-bold leading-tight text-white">InsureTrack</h1>
            <p className="text-xs text-[color:var(--color-sidebar-text)]">Management Platform</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-[color:var(--color-sidebar-active)] text-white"
                    : "text-[color:var(--color-sidebar-text)] hover:bg-white/5 hover:text-white"
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
