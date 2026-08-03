import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/Card";

ChartJS.register(ArcElement, Tooltip, Legend);

const QUICK_ACTIONS = [
  { label: "+ Customer", icon: "👥", to: "/customers", state: { openForm: true } },
  { label: "+ Policy", icon: "📄", to: "/policies", state: { openForm: true } },
  { label: "Record Premium", icon: "💰", to: "/premiums", state: { openForm: true } },
  { label: "View Reports", icon: "📈", to: "/reports" },
];

export default function Overview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [expiringPolicies, setExpiringPolicies] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      api.get("/reports/summary"),
      api.get("/policies/expiring", { params: { days: 30 } }),
      api.get("/premiums/overdue"),
    ])
      .then(([summaryRes, expiringRes, overdueRes]) => {
        setSummary(summaryRes.data);
        setExpiringPolicies(expiringRes.data.policies);
        setOverdueCount(overdueRes.data.payments.length);
      })
      .catch((err) => setLoadError(err.response?.data?.error || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-brand-500">Loading...</p>;
  if (loadError) return <p className="text-rose-600">{loadError}</p>;

  const totalPolicies = summary.active_policies + summary.expired_policies + summary.cancelled_policies;
  const totalClaims = summary.claim_stats.pending + summary.claim_stats.approved + summary.claim_stats.rejected;

  const claimsChartData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        data: [summary.claim_stats.pending, summary.claim_stats.approved, summary.claim_stats.rejected],
        backgroundColor: ["#f59e0b", "#10b981", "#f43f5e"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-900">Welcome, {user?.name}</h1>
        <p className="text-brand-500">Business overview and quick actions.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => navigate(action.to, action.state ? { state: action.state } : undefined)}
            className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-brand-200 bg-surface px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-500 hover:bg-brand-50"
          >
            <span aria-hidden="true">{action.icon}</span>
            {action.label}
          </button>
        ))}
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

      {expiringPolicies.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {expiringPolicies.length} policy(ies) expiring within 30 days.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Claims Breakdown">
          {totalClaims === 0 ? (
            <p className="text-brand-400">No claims yet</p>
          ) : (
            <div className="mx-auto max-w-[220px]">
              <Doughnut
                data={claimsChartData}
                options={{ plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } } }}
              />
            </div>
          )}
        </Card>

        <Card
          title="Needs Attention"
          action={
            <button
              type="button"
              className="cursor-pointer text-sm font-semibold text-brand-600 hover:text-brand-800 hover:underline"
              onClick={() => navigate("/policies/expiring")}
            >
              View all →
            </button>
          }
        >
          {expiringPolicies.length === 0 ? (
            <p className="text-brand-400">Nothing expiring soon — all clear.</p>
          ) : (
            <div className="space-y-3">
              {expiringPolicies.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-surface-border pb-2">
                  <div>
                    <p className="font-medium text-brand-900">
                      {p.policy_number} · {p.policy_type}
                    </p>
                    <p className="text-xs text-brand-500">Expires {new Date(p.end_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
