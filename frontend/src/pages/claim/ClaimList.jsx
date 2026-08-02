import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";
import { TextArea } from "../../components/FormField";

export default function ClaimList() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const { data } = await api.get("/claims", { params: { status: status || undefined, page } });
      setData(data);
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load claims");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  async function handleReview(id, decision) {
    await api.put(`/claims/${id}/review`, { status: decision, review_notes: notes[id] || "" });
    load();
  }

  return (
    <Card title="Claims">
      <div className="mb-4 flex gap-2">
        {["", "pending", "approved", "rejected"].map((s) => (
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

      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : loadError ? (
        <p className="text-rose-600">{loadError}</p>
      ) : (
        <div className="space-y-3">
          {data.items.map((c) => (
            <div key={c.id} className="rounded-lg border border-brand-100 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-brand-900">
                  Claim #{c.id} · Policy #{c.policy_id} · {c.claim_amount}
                </p>
                <Badge status={c.status} />
              </div>
              <p className="mb-2 text-sm text-brand-700">{c.reason}</p>
              {c.status === "pending" ? (
                <div className="flex items-center gap-2">
                  <TextArea
                    placeholder="Review notes (optional)"
                    value={notes[c.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                  />
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button onClick={() => handleReview(c.id, "approved")}>Approve</Button>
                    <Button variant="danger" onClick={() => handleReview(c.id, "rejected")}>
                      Reject
                    </Button>
                  </div>
                </div>
              ) : (
                c.review_notes && <p className="text-xs text-brand-500">Notes: {c.review_notes}</p>
              )}
            </div>
          ))}
          {data.items.length === 0 && <p className="py-6 text-center text-brand-400">No claims found</p>}
        </div>
      )}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </Card>
  );
}
