import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/Card";
import Badge from "../../components/Badge";

ChartJS.register(ArcElement, Tooltip, Legend);

const QUICK_ACTIONS = [
  { label: "View Policies", icon: "📄", to: "/my-policies" },
  { label: "Submit Claim", icon: "📝", to: "/my-claims", state: { openForm: true } },
  { label: "Pay Premium", icon: "💳", to: "/my-premiums" },
  { label: "Upload Document", icon: "📁", to: "/my-documents" },
];

export default function CustomerOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [premiums, setPremiums] = useState([]);
  const [claims, setClaims] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    Promise.all([
      api.get("/policies/mine", { params: { page: 1 } }),
      api.get("/premiums/mine", { params: { page: 1 } }),
      api.get("/claims/mine", { params: { page: 1 } }),
      api.get("/documents/mine"),
    ])
      .then(([policiesRes, premiumsRes, claimsRes, documentsRes]) => {
        setPolicies(policiesRes.data.items);
        setPremiums(premiumsRes.data.items);
        setClaims(claimsRes.data.items);
        setDocuments(documentsRes.data.documents);
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setLoadError(err.response?.data?.error || "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-brand-500">Loading...</p>;

  if (notFound) {
    return (
      <Card title={`Welcome, ${user?.name}`}>
        <p className="text-brand-500">
          No customer profile is linked to your account yet. Contact an admin/agent to get your policies set up.
        </p>
      </Card>
    );
  }

  if (loadError) return <p className="text-rose-600">{loadError}</p>;

  const activePolicies = policies.filter((p) => p.status === "active").length;
  const pendingClaims = claims.filter((c) => c.status === "pending").length;
  const approvedClaims = claims.filter((c) => c.status === "approved").length;
  const rejectedClaims = claims.filter((c) => c.status === "rejected").length;
  const overduePremiums = premiums.filter((p) => p.payment_status === "overdue").length;
  const pendingDocuments = documents.filter((d) => d.verification_status === "pending").length;

  const upcomingPremiums = premiums
    .filter((p) => p.payment_status !== "paid")
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 4);

  const claimsChartData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        data: [pendingClaims, approvedClaims, rejectedClaims],
        backgroundColor: ["#f59e0b", "#10b981", "#f43f5e"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-900">Welcome, {user?.name}</h1>
        <p className="text-brand-500">Here's a quick look at your policies, premiums, and claims.</p>
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
        <button
          type="button"
          onClick={() => navigate("/my-policies")}
          className="cursor-pointer rounded-xl bg-brand-600 p-5 text-left text-white shadow-sm transition hover:bg-brand-700"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Active Policies</p>
          <p className="mt-1 text-3xl font-bold">{activePolicies}</p>
          <p className="mt-1 text-xs text-brand-100">{policies.length} total</p>
        </button>
        <StatCard
          label="Pending Claims"
          value={pendingClaims}
          sub={`${claims.length} total`}
          onClick={() => navigate("/my-claims")}
        />
        <StatCard
          label="Overdue Premiums"
          value={overduePremiums}
          sub={`${premiums.length} total`}
          onClick={() => navigate("/my-premiums")}
        />
        <StatCard
          label="Documents Pending Review"
          value={pendingDocuments}
          sub={`${documents.length} total`}
          onClick={() => navigate("/my-documents")}
        />
      </div>

      {overduePremiums > 0 && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          You have {overduePremiums} overdue premium payment(s).{" "}
          <button
            type="button"
            className="cursor-pointer font-semibold underline hover:text-rose-900"
            onClick={() => navigate("/my-premiums")}
          >
            Pay now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Claims Breakdown">
          {claims.length === 0 ? (
            <p className="text-brand-400">No claims submitted yet</p>
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
          title="Upcoming Premiums"
          action={
            <button
              type="button"
              className="cursor-pointer text-sm font-semibold text-brand-600 hover:text-brand-800 hover:underline"
              onClick={() => navigate("/my-premiums")}
            >
              View all →
            </button>
          }
        >
          {upcomingPremiums.length === 0 ? (
            <p className="text-brand-400">No pending payments — you're all caught up.</p>
          ) : (
            <div className="space-y-3">
              {upcomingPremiums.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b border-surface-border pb-2">
                  <div>
                    <p className="font-medium text-brand-900">₹{p.amount}</p>
                    <p className="text-xs text-brand-500">Due {new Date(p.due_date).toLocaleDateString()}</p>
                  </div>
                  <Badge status={p.payment_status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-surface-border bg-surface p-5 text-left shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-brand-400">{sub}</p>}
    </button>
  );
}
