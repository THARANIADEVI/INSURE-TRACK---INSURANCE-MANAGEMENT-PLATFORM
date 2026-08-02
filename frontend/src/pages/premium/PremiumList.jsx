import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import FormField, { Input } from "../../components/FormField";

export default function PremiumList() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ policy_id: "", due_date: "", amount: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/premiums", { params: { status: status || undefined, page } });
      setData(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load premiums");
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
      await api.post("/premiums", { ...form, policy_id: Number(form.policy_id) });
      setShowForm(false);
      setForm({ policy_id: "", due_date: "", amount: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to schedule premium");
    }
  }

  return (
    <Card
      title="Premium Tracking"
      action={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "+ Schedule Payment"}</Button>}
    >
      <div className="mb-4 flex gap-2">
        {["", "pending", "paid", "overdue"].map((s) => (
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
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-3 gap-3 rounded-lg bg-brand-50 p-4">
          <FormField label="Policy ID">
            <Input
              type="number"
              required
              value={form.policy_id}
              onChange={(e) => setForm({ ...form, policy_id: e.target.value })}
            />
          </FormField>
          <FormField label="Due date">
            <Input
              type="date"
              required
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </FormField>
          <FormField label="Amount">
            <Input
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </FormField>
          {error && <p className="col-span-3 text-sm text-rose-600">{error}</p>}
          <div className="col-span-3">
            <Button type="submit">Save</Button>
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
              <th className="py-2">Policy ID</th>
              <th>Due Date</th>
              <th>Paid On</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-b border-brand-50">
                <td className="py-2 font-medium text-brand-900">{p.policy_id}</td>
                <td className="text-brand-700">{p.due_date}</td>
                <td className="text-brand-700">{p.payment_date || "-"}</td>
                <td className="text-brand-700">{p.amount}</td>
                <td>
                  <Badge status={p.payment_status} />
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-brand-400">
                  No payment records
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
