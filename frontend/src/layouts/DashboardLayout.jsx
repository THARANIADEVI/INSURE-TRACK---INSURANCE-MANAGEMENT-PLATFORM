import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/Button";
import ThemeToggle from "../components/ThemeToggle";

const NAV_BY_ROLE = {
  admin: [
    { to: "/dashboard", label: "Reports Dashboard" },
    { to: "/customers", label: "Customers" },
    { to: "/policies", label: "Policies" },
    { to: "/policies/expiring", label: "Expiring Policies" },
    { to: "/premiums", label: "Premiums" },
    { to: "/claims", label: "Claims" },
    { to: "/notifications", label: "Notifications" },
    { to: "/notifications/all", label: "All Notifications" },
    { to: "/audit-logs", label: "Audit Logs" },
    { to: "/employees", label: "Employees" },
  ],
  agent: [
    { to: "/dashboard", label: "Reports Dashboard" },
    { to: "/customers", label: "Customers" },
    { to: "/policies", label: "Policies" },
    { to: "/policies/expiring", label: "Expiring Policies" },
    { to: "/premiums", label: "Premiums" },
    { to: "/claims", label: "Claims" },
    { to: "/notifications", label: "Notifications" },
    { to: "/notifications/all", label: "All Notifications" },
  ],
  customer: [
    { to: "/my-profile", label: "My Profile" },
    { to: "/my-policies", label: "My Policies" },
    { to: "/my-premiums", label: "My Premiums" },
    { to: "/my-claims", label: "My Claims" },
    { to: "/my-documents", label: "My Documents" },
    { to: "/notifications", label: "Notifications" },
  ],
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const links = NAV_BY_ROLE[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-offwhite">
      <aside className="w-64 shrink-0 border-r border-surface-border bg-surface">
        <div className="border-b border-surface-border px-6 py-5">
          <h1 className="text-lg font-bold text-brand-700">Insurance MP</h1>
          <p className="text-xs text-brand-500">Management Platform</p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive ? "bg-brand-600 text-white" : "text-brand-800 hover:bg-brand-50"
                }`
              }
            >
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
