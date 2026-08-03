import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [expiringCount, setExpiringCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      api.get("/reports/summary"),
      api.get("/policies/expiring", { params: { days: 30 } }),
      api.get("/premiums/overdue"),
      api.get("/claims", { params: { page: 1 } }),
    ])
      .then(([summaryRes, expiringRes, overdueRes, claimsRes]) => {
        setSummary(summaryRes.data);
        setExpiringCount(expiringRes.data.policies.length);
        setOverdueCount(overdueRes.data.payments.length);
        setRecentClaims(claimsRes.data.items.slice(0, 5));
      })
      .catch((err) => setLoadError(err.response?.data?.error || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-brand-500">Loading...</p>;
  if (loadError) return <p className="text-rose-600">{loadError}</p>;

  const totalPolicies = summary.active_policies + summary.expired_policies + summary.cancelled_policies;
  const totalClaims = summary.claim_stats.pending + summary.claim_stats.approved + summary.claim_stats.rejected;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-900">Welcome, {user?.name}</h1>
        <p className="text-brand-500">Business overview and quick actions.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-brand-600 p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Customers</p>
          <p className="mt-1 text-3xl font-bold">{summary.total_customers}</p>
        </div>
        <StatCard label="Active Policies" value={summary.active_policies} sub={`${totalPolicies} total`} />
        <StatCard label="Pending Claims" value={summary.claim_stats.pending} sub={`${totalClaims} total`} />
        <StatCard
          label="Premium Collected"
          value={summary.premium_collected.toFixed(2)}
          sub={`${overdueCount} overdue`}
        />
      </div>

      {expiringCount > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {expiringCount} policy(ies) expiring within 30 days.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Recent Claims"
          action={
            <button className="text-sm font-semibold text-brand-600" onClick={() => navigate("/claims")}>
              View all →
            </button>
          }
        >
          {recentClaims.length === 0 ? (
            <p className="text-brand-400">No claims yet</p>
          ) : (
            <div className="space-y-3">
              {recentClaims.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b border-brand-50 pb-2">
                  <div>
                    <p className="font-medium text-brand-900">{c.claim_amount}</p>
                    <p className="text-xs text-brand-500">{new Date(c.submission_date).toLocaleDateString()}</p>
                  </div>
                  <Badge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => navigate("/customers", { state: { openForm: true } })}>
              + Customer
            </Button>
            <Button variant="secondary" onClick={() => navigate("/policies", { state: { openForm: true } })}>
              + Policy
            </Button>
            <Button variant="secondary" onClick={() => navigate("/premiums", { state: { openForm: true } })}>
              Record Premium
            </Button>
            <Button onClick={() => navigate("/reports")}>View Reports</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-brand-400">{sub}</p>}
    </div>
  );
}
