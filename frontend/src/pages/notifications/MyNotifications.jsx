import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Pagination from "../../components/Pagination";

export default function MyNotifications() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    api
      .get("/notifications/mine", { params: { page } })
      .then(({ data }) => setData(data))
      .catch((err) => setLoadError(err.response?.data?.error || "Failed to load notifications"))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Card title="Notifications">
      <p className="mb-4 text-sm text-brand-500">
        Email/SMS reminders are mocked for this project (no real mail/SMS provider configured) — they're logged here
        instead.
      </p>
      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : loadError ? (
        <p className="text-rose-600">{loadError}</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((n) => (
            <div key={n.id} className="rounded-lg border border-surface-border p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold text-brand-900">{n.subject}</p>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase text-brand-700">
                  {n.channel}
                </span>
              </div>
              <p className="text-sm text-brand-700">{n.message}</p>
              <p className="mt-1 text-xs text-brand-400">{new Date(n.sent_at).toLocaleString()}</p>
            </div>
          ))}
          {data.items.length === 0 && <p className="py-6 text-center text-brand-400">No notifications yet</p>}
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </Card>
  );
}
