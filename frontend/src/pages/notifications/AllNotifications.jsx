import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Pagination from "../../components/Pagination";
import FormField, { Input } from "../../components/FormField";

export default function AllNotifications() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/notifications", { params: { user_id: userId || undefined, page } });
      setData(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleFilter(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <Card title="All Notifications">
      <form onSubmit={handleFilter} className="mb-4 flex items-end gap-3">
        <FormField label="User ID">
          <Input
            type="number"
            placeholder="Filter by user id"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </FormField>
        <Button type="submit">Apply</Button>
      </form>

      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : loadError ? (
        <p className="text-rose-600">{loadError}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-brand-500">
              <th className="py-2">User ID</th>
              <th>Channel</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((n) => (
              <tr key={n.id} className="border-b border-brand-50">
                <td className="py-2 font-medium text-brand-900">{n.user_id}</td>
                <td className="text-brand-700 uppercase">{n.channel}</td>
                <td className="text-brand-700">{n.subject}</td>
                <td className="text-brand-700">{n.message}</td>
                <td className="text-brand-700">{new Date(n.sent_at).toLocaleString()}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-brand-400">
                  No notifications found
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
