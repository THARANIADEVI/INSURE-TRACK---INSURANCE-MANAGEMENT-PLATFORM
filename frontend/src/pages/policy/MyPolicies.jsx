import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";

export default function MyPolicies() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    api
      .get("/policies/mine", { params: { page } })
      .then(({ data }) => setData(data))
      .catch((err) => setLoadError(err.response?.data?.error || "Failed to load policies"))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleViewQr(id) {
    const response = await api.get(`/policies/${id}/qr`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    window.open(url, "_blank");
  }

  return (
    <Card title="My Policies">
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
              <th>Start</th>
              <th>End</th>
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
                <td className="text-brand-700">{p.start_date}</td>
                <td className="text-brand-700">{p.end_date}</td>
                <td>
                  <Badge status={p.status} />
                </td>
                <td className="text-right">
                  <button className="text-brand-600 underline" onClick={() => handleViewQr(p.id)}>
                    QR
                  </button>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-brand-400">
                  You have no policies yet
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
