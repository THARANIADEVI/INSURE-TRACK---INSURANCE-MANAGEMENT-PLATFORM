import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Button from "../../components/Button";

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
  const overduePremiums = premiums.filter((p) => p.payment_status === "overdue").length;
  const pendingDocuments = documents.filter((d) => d.verification_status === "pending").length;
  const recentClaims = claims.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Welcome, {user?.name}</h1>
        <p className="text-brand-500">Here's a quick look at your policies, premiums, and claims.</p>
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
        <Card
          title="Recent Claims"
          action={
            <button
              type="button"
              className="cursor-pointer text-sm font-semibold text-brand-600 hover:text-brand-800 hover:underline"
              onClick={() => navigate("/my-claims")}
            >
              View all →
            </button>
          }
        >
          {recentClaims.length === 0 ? (
            <p className="text-brand-400">No claims submitted yet</p>
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
            <Button variant="secondary" onClick={() => navigate("/my-policies")}>
              View Policies
            </Button>
            <Button variant="secondary" onClick={() => navigate("/my-claims", { state: { openForm: true } })}>
              Submit Claim
            </Button>
            <Button variant="secondary" onClick={() => navigate("/my-premiums")}>
              Pay Premium
            </Button>
            <Button onClick={() => navigate("/my-documents")}>Upload Document</Button>
          </div>
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
