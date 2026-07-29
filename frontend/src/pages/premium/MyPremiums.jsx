import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Badge from "../../components/Badge";
import Pagination from "../../components/Pagination";

export default function MyPremiums() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await api.get("/premiums/mine", { params: { page } });
    setData(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handlePay(id) {
    const today = new Date().toISOString().slice(0, 10);
    await api.post(`/premiums/${id}/pay`, { payment_date: today });
    load();
  }

  return (
    <Card title="My Premium Payments">
      {loading ? (
        <p className="text-brand-500">Loading...</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-brand-500">
              <th className="py-2">Policy ID</th>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((p) => (
              <tr key={p.id} className="border-b border-brand-50">
                <td className="py-2 font-medium text-brand-900">{p.policy_id}</td>
                <td className="text-brand-700">{p.due_date}</td>
                <td className="text-brand-700">{p.amount}</td>
                <td>
                  <Badge status={p.payment_status} />
                </td>
                <td className="text-right">
                  {p.payment_status !== "paid" && (
                    <Button variant="secondary" onClick={() => handlePay(p.id)}>
                      Pay now
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-brand-400">
                  No premium payments due
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
