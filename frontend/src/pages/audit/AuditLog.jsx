import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Pagination from "../../components/Pagination";

export default function AuditLog() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    api
      .get("/audit-logs", { params: { page } })
      .then(({ data }) => setData(data))
      .catch((err) => setLoadError(err.response?.data?.error || "Failed to load audit logs"))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Card title="Audit Logs">
      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-brand-500">
              <th className="py-2">Entity</th>
              <th>Action</th>
              <th>Performed By (user id)</th>
              <th>Details</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((a) => (
              <tr key={a.id} className="border-b border-brand-50">
                <td className="py-2 font-medium text-brand-900">
                  {a.entity_type} #{a.entity_id}
                </td>
                <td className="text-brand-700">{a.action}</td>
                <td className="text-brand-700">{a.performed_by ?? "-"}</td>
                <td className="text-brand-700">{a.details || "-"}</td>
                <td className="text-brand-700">{new Date(a.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-brand-400">
                  No audit entries yet
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
