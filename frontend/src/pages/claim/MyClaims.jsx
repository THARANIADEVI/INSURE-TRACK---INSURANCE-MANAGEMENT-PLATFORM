import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import FormField, { Input, Select, TextArea } from "../../components/FormField";

export default function MyClaims() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [policies, setPolicies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ policy_id: "", claim_amount: "", reason: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/claims/mine", { params: { page } });
      setData(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }

  async function loadPolicies() {
    try {
      const { data } = await api.get("/policies/mine", { params: { page: 1 } });
      setPolicies(data.items.filter((p) => p.status === "active"));
    } catch {
      setPolicies([]);
    }
  }

  useEffect(() => {
    load();
    loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const policyNumberById = Object.fromEntries(policies.map((p) => [p.id, p.policy_number]));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/claims", { ...form, policy_id: Number(form.policy_id) });
      setShowForm(false);
      setForm({ policy_id: "", claim_amount: "", reason: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit claim");
    }
  }

  return (
    <Card
      title="My Claims"
      action={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Submit Claim"}</Button>}
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-lg bg-brand-50 p-4">
          <FormField label="Policy">
            <Select
              required
              value={form.policy_id}
              onChange={(e) => setForm({ ...form, policy_id: e.target.value })}
            >
              <option value="" disabled>
                {policies.length === 0 ? "No active policies" : "Select a policy"}
              </option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.policy_number} · {p.policy_type}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Claim amount">
            <Input
              type="number"
              step="0.01"
              required
              value={form.claim_amount}
              onChange={(e) => setForm({ ...form, claim_amount: e.target.value })}
            />
          </FormField>
          <FormField label="Reason">
            <TextArea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </FormField>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit">Submit Claim</Button>
        </form>
      )}

      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : loadError ? (
        <p className="text-rose-600">{loadError}</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((c) => (
            <div key={c.id} className="rounded-lg border border-brand-100 p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-brand-900">
                  {policyNumberById[c.policy_id] || `Policy #${c.policy_id}`} · {c.claim_amount}
                </p>
                <Badge status={c.status} />
              </div>
              <p className="text-sm text-brand-700">{c.reason}</p>
              {c.review_notes && <p className="mt-1 text-xs text-brand-500">Notes: {c.review_notes}</p>}
            </div>
          ))}
          {data.items.length === 0 && <p className="py-6 text-center text-brand-400">No claims submitted yet</p>}
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </Card>
  );
}
