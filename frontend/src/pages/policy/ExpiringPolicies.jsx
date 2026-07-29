import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import FormField, { Input } from "../../components/FormField";

export default function ExpiringPolicies() {
  const [policies, setPolicies] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState(false);
  const [result, setResult] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await api.get("/policies/expiring", { params: { days } });
    setPolicies(data.policies);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    load();
  }

  async function handleNotify() {
    setNotifying(true);
    setResult("");
    try {
      const { data } = await api.post("/policies/expiring/notify", { days });
      setResult(`Notified ${data.notified} customer(s).`);
    } finally {
      setNotifying(false);
    }
  }

  function daysLeft(endDate) {
    const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  return (
    <Card
      title="Expiring Policies"
      action={
        <Button onClick={handleNotify} disabled={notifying || policies.length === 0}>
          {notifying ? "Notifying..." : "Notify All"}
        </Button>
      }
    >
      <form onSubmit={handleFilter} className="mb-4 flex items-end gap-3">
        <FormField label="Within days">
          <Input type="number" min="1" value={days} onChange={(e) => setDays(Number(e.target.value))} />
        </FormField>
        <Button type="submit">Apply</Button>
      </form>

      {result && <p className="mb-4 text-sm text-brand-600">{result}</p>}

      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-brand-500">
              <th className="py-2">Policy #</th>
              <th>Type</th>
              <th>Customer ID</th>
              <th>Ends</th>
              <th>Days left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} className="border-b border-brand-50">
                <td className="py-2 font-medium text-brand-900">{p.policy_number}</td>
                <td className="text-brand-700">{p.policy_type}</td>
                <td className="text-brand-700">{p.customer_id}</td>
                <td className="text-brand-700">{p.end_date}</td>
                <td className="text-brand-700">{daysLeft(p.end_date)}</td>
                <td>
                  <Badge status={p.status} />
                </td>
              </tr>
            ))}
            {policies.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-brand-400">
                  No policies expiring soon
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </Card>
  );
}
