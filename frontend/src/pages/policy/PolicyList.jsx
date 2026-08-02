import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import FormField, { Input } from "../../components/FormField";

export default function PolicyList() {
  const location = useLocation();
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(Boolean(location.state?.openForm));
  const [form, setForm] = useState({
    customer_id: "",
    policy_type: "",
    premium_amount: "",
    start_date: "",
    end_date: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/policies", { params: { status: status || undefined, page } });
      setData(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/policies", { ...form, customer_id: Number(form.customer_id) });
      setShowForm(false);
      setForm({ customer_id: "", policy_type: "", premium_amount: "", start_date: "", end_date: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create policy");
    }
  }

  async function handleRenew(id) {
    await api.post(`/policies/${id}/renew`, { months: 12 });
    load();
  }

  async function handleCancel(id) {
    if (!confirm("Cancel this policy?")) return;
    await api.post(`/policies/${id}/cancel`);
    load();
  }

  async function handleViewQr(id) {
    const response = await api.get(`/policies/${id}/qr`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    window.open(url, "_blank");
  }

  return (
    <Card
      title="Policies"
      action={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Create Policy"}</Button>}
    >
      <div className="mb-4 flex gap-2">
        {["", "active", "expired", "cancelled"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              status === s ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-2 gap-3 rounded-lg bg-brand-50 p-4">
          <FormField label="Customer ID">
            <Input
              type="number"
              required
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            />
          </FormField>
          <FormField label="Policy type">
            <Input
              required
              placeholder="Health, Life, Vehicle..."
              value={form.policy_type}
              onChange={(e) => setForm({ ...form, policy_type: e.target.value })}
            />
          </FormField>
          <FormField label="Premium amount">
            <Input
              type="number"
              step="0.01"
              required
              value={form.premium_amount}
              onChange={(e) => setForm({ ...form, premium_amount: e.target.value })}
            />
          </FormField>
          <div />
          <FormField label="Start date">
            <Input
              type="date"
              required
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </FormField>
          <FormField label="End date">
            <Input
              type="date"
              required
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </FormField>
          {error && <p className="col-span-2 text-sm text-rose-600">{error}</p>}
          <div className="col-span-2">
            <Button type="submit">Save Policy</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : loadError ? (
        <p className="text-rose-600">{loadError}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-brand-500">
              <th className="py-2">Policy #</th>
              <th>Type</th>
              <th>Premium</th>
              <th>Ends</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-b border-brand-50">
                <td className="py-2 font-medium text-brand-900">{p.policy_number}</td>
                <td className="text-brand-700">{p.policy_type}</td>
                <td className="text-brand-700">{p.premium_amount}</td>
                <td className="text-brand-700">{p.end_date}</td>
                <td>
                  <Badge status={p.status} />
                </td>
                <td className="space-x-2 text-right">
                  <button className="text-brand-600 underline" onClick={() => handleViewQr(p.id)}>
                    QR
                  </button>
                  {p.status !== "cancelled" && (
                    <>
                      <button className="text-brand-600 underline" onClick={() => handleRenew(p.id)}>
                        Renew
                      </button>
                      <button className="text-rose-600 underline" onClick={() => handleCancel(p.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-brand-400">
                  No policies found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </Card>
  );
}
