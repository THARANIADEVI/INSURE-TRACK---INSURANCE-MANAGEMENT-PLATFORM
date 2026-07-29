import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CustomerList from "./pages/customer/CustomerList";
import CustomerDetail from "./pages/customer/CustomerDetail";
import MyProfile from "./pages/customer/MyProfile";
import PolicyList from "./pages/policy/PolicyList";
import ExpiringPolicies from "./pages/policy/ExpiringPolicies";
import MyPolicies from "./pages/policy/MyPolicies";
import PremiumList from "./pages/premium/PremiumList";
import MyPremiums from "./pages/premium/MyPremiums";
import ClaimList from "./pages/claim/ClaimList";
import MyClaims from "./pages/claim/MyClaims";
import MyDocuments from "./pages/document/MyDocuments";
import Dashboard from "./pages/reports/Dashboard";
import MyNotifications from "./pages/notifications/MyNotifications";
import AllNotifications from "./pages/notifications/AllNotifications";
import AuditLog from "./pages/audit/AuditLog";
import EmployeeList from "./pages/employee/EmployeeList";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "customer" ? "/my-policies" : "/dashboard"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute roles={["admin", "agent"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/policies" element={<PolicyList />} />
          <Route path="/policies/expiring" element={<ExpiringPolicies />} />
          <Route path="/premiums" element={<PremiumList />} />
          <Route path="/claims" element={<ClaimList />} />
          <Route path="/notifications/all" element={<AllNotifications />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/audit-logs" element={<AuditLog />} />
          <Route path="/employees" element={<EmployeeList />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["customer"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/my-policies" element={<MyPolicies />} />
          <Route path="/my-premiums" element={<MyPremiums />} />
          <Route path="/my-claims" element={<MyClaims />} />
          <Route path="/my-documents" element={<MyDocuments />} />
          <Route path="/my-profile" element={<MyProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={["admin", "agent", "customer"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/notifications" element={<MyNotifications />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
